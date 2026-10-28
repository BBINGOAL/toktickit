import type { Prisma, TicketStatus } from '../generated/prisma/client'

export const activeStatuses: TicketStatus[] = ['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'REOPENED']

export function dashboardWindow(asOf = new Date()) {
  // Bangkok has a fixed UTC+7 offset. UTC arithmetic avoids the host timezone/DST.
  const local = new Date(asOf.getTime() + 7 * 60 * 60 * 1000)
  const windowStart = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - 6) - 7 * 60 * 60 * 1000)
  return { asOf, windowStart, timezone: 'Asia/Bangkok' as const }
}

export class DashboardQueryError extends Error {}
const bad = (): never => { throw new DashboardQueryError('Invalid ticket filters, date bounds, sorting or pagination') }
function scalar(value: unknown): string {
  if (typeof value !== 'string') return bad()
  return value
}
function date(value: string): Date {
  const parts = /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:\.\d{1,3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.exec(value)
  if (!parts) return bad()
  const [year, month, day] = parts.slice(1, 4).map(Number)
  const calendar = new Date(Date.UTC(year, month - 1, day))
  const parsed = new Date(value)
  if (calendar.getUTCFullYear() !== year || calendar.getUTCMonth() !== month - 1 || calendar.getUTCDate() !== day || !Number.isFinite(parsed.getTime())) return bad()
  return parsed
}

export function requesterTicketQuery(query: Record<string, unknown>, requesterId: number) {
  const allowed = ['search','categoryId','requestedPriority','itPriority','status','scope','sort','order','page','pageSize','updatedSince','updatedUntil','resolvedSince','resolvedUntil']
  const q: Record<string, string> = {}
  for (const [key, value] of Object.entries(query)) {
    if (!allowed.includes(key)) return bad()
    q[key] = scalar(value)
  }
  const positive = (value: string) => {
    if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) > 2147483647) return bad()
    return Number(value)
  }
  const page = positive(q.page ?? '1'), pageSize = positive(q.pageSize ?? '10')
  if (![10,25,50].includes(pageSize) || (page - 1) * pageSize > 2147483647) return bad()
  const sort = q.sort ?? 'createdAt', order = q.order ?? 'desc'
  if (!['createdAt','updatedAt','summary','status','itPriority','requestedPriority','ticketNumber'].includes(sort) || !['asc','desc'].includes(order)) return bad()
  const where: Prisma.TicketWhereInput = { requesterId }
  const and: Prisma.TicketWhereInput[] = []
  if (q.scope !== undefined) {
    if (q.scope !== 'active') return bad()
    and.push({ status: { in: activeStatuses } })
  }
  if (q.status !== undefined) {
    if (![...activeStatuses,'RESOLVED','CLOSED','CANCELLED'].includes(q.status as TicketStatus)) return bad()
    where.status = q.status as TicketStatus
  }
  for (const key of ['requestedPriority','itPriority'] as const) {
    if (q[key] !== undefined) {
      if (!['LOW','MEDIUM','HIGH'].includes(q[key])) return bad()
      where[key] = q[key] as 'LOW'|'MEDIUM'|'HIGH'
    }
  }
  if (q.categoryId !== undefined) where.categoryId = positive(q.categoryId)
  if (q.search !== undefined) {
    if (q.search.length > 100) return bad()
    if (q.search.trim()) where.OR = [{ ticketNumber: { contains: q.search.trim(), mode: 'insensitive' } }, { summary: { contains: q.search.trim(), mode: 'insensitive' } }]
  }
  for (const [field, since, until] of [['updatedAt','updatedSince','updatedUntil'],['resolvedAt','resolvedSince','resolvedUntil']] as const) {
    if (q[since] === undefined && q[until] === undefined) continue
    const gte = q[since] === undefined ? undefined : date(q[since])
    const lte = q[until] === undefined ? undefined : date(q[until])
    if (gte && lte && gte > lte) return bad()
    and.push({ [field]: { ...(gte ? { gte } : {}), ...(lte ? { lte } : {}) } })
    if (field === 'resolvedAt') and.push({ status: { in: ['RESOLVED','CLOSED'] } })
  }
  if (and.length) where.AND = and
  const orderBy: Prisma.TicketOrderByWithRelationInput[] = [{ [sort]: order }, { id: order as 'asc'|'desc' }]
  return { where, orderBy, skip: (page - 1) * pageSize, take: pageSize, page, pageSize }
}
