import { Prisma } from '../generated/prisma/client'
import { prisma } from '../db'
import { activeStatuses, allTicketStatuses, dashboardWindow, myActionsQuery, staffTicketQuery } from './dashboard-rules'

const ticketSelect = { id: true, ticketNumber: true, summary: true, status: true, itPriority: true, updatedAt: true } satisfies Prisma.TicketSelect
const actionSelect = { id: true, ticketId: true, description: true, status: true, updatedAt: true, ticket: { select: { ticketNumber: true } } } satisfies Prisma.ActionTakenSelect
const recentOrder = [{ updatedAt: 'desc' as const }, { id: 'desc' as const }]
const queueLink = (filters: Record<string, string> = {}) => '/staff/tickets?' + new URLSearchParams({ ...filters, sort: 'updatedAt', order: 'desc', page: '1' })
const actionPreview = (rows: Prisma.ActionTakenGetPayload<{ select: typeof actionSelect }>[]) => rows.map(({ ticket, ...a }) => ({ ...a, ticketNumber: ticket.ticketNumber, detailUrl: `/tickets/${a.ticketId}?actionId=${a.id}` }))
const ticketPreview = (rows: Prisma.TicketGetPayload<{ select: typeof ticketSelect }>[]) => rows.map(t => ({ ...t, detailUrl: `/tickets/${t.id}` }))

export function staffGroupCounts(statusRows: { status: string; _count: { _all: number } }[], priorityRows: { itPriority: string | null; _count: { _all: number } }[]) {
  const byStatus = Object.fromEntries(allTicketStatuses.map(key => [key, 0]))
  const activeByPriority = { LOW: 0, MEDIUM: 0, HIGH: 0, UNSET: 0 }
  for (const row of statusRows) byStatus[row.status] = row._count._all
  for (const row of priorityRows) activeByPriority[(row.itPriority || 'UNSET') as keyof typeof activeByPriority] = row._count._all
  return { byStatus, activeByPriority }
}

export async function staffDashboard(staffId: number) {
  return prisma.$transaction(async tx => {
    const window = dashboardWindow(), active = { status: { in: activeStatuses } }, pending = myActionsQuery({}, staffId).where
    const unassignedActive = await tx.ticket.count({ where: { ...active, ownerId: null } })
    const myActiveTickets = await tx.ticket.count({ where: { ...active, ownerId: staffId } })
    const statusRows = await tx.ticket.groupBy({ by: ['status'], _count: { _all: true } })
    const priorityRows = await tx.ticket.groupBy({ by: ['itPriority'], where: active, _count: { _all: true } })
    const myPendingActions = await tx.actionTaken.count({ where: pending })
    const recent = await tx.ticket.findMany({ orderBy: recentOrder, take: 5, select: ticketSelect })
    const urgent = await tx.ticket.findMany({ where: { ...active, itPriority: 'HIGH' }, orderBy: recentOrder, take: 5, select: ticketSelect })
    const mine = await tx.actionTaken.findMany({ where: pending, orderBy: recentOrder, take: 5, select: actionSelect })
    return { ...window, metrics: { unassignedActive, myActiveTickets, myPendingActions, ...staffGroupCounts(statusRows, priorityRows) },
      recentTickets: ticketPreview(recent), urgentTickets: ticketPreview(urgent), myActions: actionPreview(mine),
      drillDown: { unassignedActive: queueLink({ scope: 'active', owner: 'unassigned' }), myActiveTickets: queueLink({ scope: 'active', owner: 'me' }), myPendingActions: '/staff/dashboard?view=my-actions&page=1&pageSize=10',
        byStatus: Object.fromEntries(allTicketStatuses.map(status => [status, queueLink({ status })])),
        activeByPriority: Object.fromEntries(['LOW','MEDIUM','HIGH','UNSET'].map(priority => [priority, queueLink({ scope: 'active', priority })])),
        recentTickets: queueLink(), urgentTickets: queueLink({ scope: 'active', priority: 'HIGH' }),
      },
    }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead })
}

export async function staffTickets(staffId: number, query: Record<string, unknown>) {
  const { page, pageSize, ...args } = staffTicketQuery(query, staffId)
  return prisma.$transaction(async tx => {
    const totalItems = await tx.ticket.count({ where: args.where })
    const data = await tx.ticket.findMany({ ...args, select: { ...ticketSelect, categoryId: true, relatedSystemId: true, ownerId: true, category: { select: { id: true, name: true } }, relatedSystem: { select: { id: true, name: true } }, owner: { select: { id: true, name: true } }, requester: { select: { id: true, name: true } }, requestedPriority: true, createdAt: true } })
    return { data, meta: { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) } }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead })
}

export async function staffActions(staffId: number, query: Record<string, unknown>) {
  const { page, pageSize, ...args } = myActionsQuery(query, staffId)
  return prisma.$transaction(async tx => {
    const totalItems = await tx.actionTaken.count({ where: args.where })
    const rows = await tx.actionTaken.findMany({ ...args, orderBy: recentOrder, select: actionSelect })
    return { data: actionPreview(rows), meta: { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) } }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead })
}
