import { Prisma } from '../generated/prisma/client'
import { prisma } from '../db'
import { activeStatuses, dashboardWindow, requesterTicketQuery } from './dashboard-rules'

const previewSelect = { id: true, ticketNumber: true, summary: true, status: true, itPriority: true, updatedAt: true } satisfies Prisma.TicketSelect

function listLink(filters: Record<string, string>) {
  return '/tickets?' + new URLSearchParams({ ...filters, sort: 'updatedAt', order: 'desc', page: '1' })
}

export async function requesterDashboard(requesterId: number) {
  return prisma.$transaction(async tx => {
    const window = dashboardWindow()
    const within = { gte: window.windowStart, lte: window.asOf }
    const active = { requesterId, status: { in: activeStatuses } }
    const waiting = { requesterId, status: 'WAITING_FOR_REQUESTER' as const }
    const activeTickets = await tx.ticket.count({ where: active })
    const waitingForRequester = await tx.ticket.count({ where: waiting })
    const recentlyUpdated = await tx.ticket.count({ where: { requesterId, updatedAt: within } })
    const recentlyResolved = await tx.ticket.count({ where: { requesterId, status: { in: ['RESOLVED','CLOSED'] }, resolvedAt: within } })
    const orderBy = [{ updatedAt: 'desc' as const }, { id: 'desc' as const }]
    const recent = await tx.ticket.findMany({ where: { requesterId }, orderBy, take: 5, select: previewSelect })
    const attention = await tx.ticket.findMany({ where: waiting, orderBy, take: 5, select: previewSelect })
    const preview = (rows: typeof recent) => rows.map(t => ({ ...t, detailUrl: `/tickets/${t.id}` }))
    return {
      ...window, metrics: { activeTickets, waitingForRequester, recentlyUpdated, recentlyResolved },
      recentTickets: preview(recent), attentionTickets: preview(attention),
      drillDown: {
        activeTickets: listLink({ scope: 'active' }),
        waitingForRequester: listLink({ status: 'WAITING_FOR_REQUESTER' }),
        recentlyUpdated: listLink({ updatedSince: window.windowStart.toISOString(), updatedUntil: window.asOf.toISOString() }),
        recentlyResolved: listLink({ resolvedSince: window.windowStart.toISOString(), resolvedUntil: window.asOf.toISOString() }),
      },
    }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead })
}

export async function requesterTickets(requesterId: number, query: Record<string, unknown>) {
  const { page, pageSize, ...args } = requesterTicketQuery(query, requesterId)
  return prisma.$transaction(async tx => {
    const totalItems = await tx.ticket.count({ where: args.where })
    const data = await tx.ticket.findMany({ ...args, select: {
      ...previewSelect, category: { select: { id: true, name: true } }, relatedSystem: { select: { id: true, name: true } },
      requestedPriority: true, owner: { select: { id: true, name: true } }, createdAt: true,
    } })
    return { data, meta: { totalItems, page, pageSize, totalPages: Math.ceil(totalItems / pageSize) } }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead })
}
