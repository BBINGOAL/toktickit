import { createHash } from 'node:crypto'
import { Prisma } from '../generated/prisma/client'
import { prisma } from '../db'
import { ActionError, activeTicketStates, integer, invalid, normalizedFields, object, transition, validateMerged } from './action-rules'

type Tx = Prisma.TransactionClient
export const publicAction = {
  id: true, ticketId: true, workCycle: true, actionDateTime: true, description: true, result: true,
  performedBy: { select: { id: true, name: true } }, assignee: { select: { id: true, name: true } },
  followUpRequired: true, followUpNote: true, attachmentNotes: true, followsUpActionId: true,
  status: true, cancellationReason: true, version: true, createdAt: true, updatedAt: true,
} satisfies Prisma.ActionTakenSelect
export const json = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value))
function stable(value: any): any {
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])]))
  return value
}
export function digest(value: unknown) { return createHash('sha256').update(JSON.stringify(stable(value))).digest('hex') }
export function idempotencyKey(value: unknown, required: boolean): string | undefined {
  if (value === undefined && !required) return undefined
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{16,128}$/.test(value)) invalid('Idempotency-Key', 'Use 16-128 letters, digits, hyphens or underscores')
  return value as string
}
export async function actionTransaction<T>(operation: (tx: Tx) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await prisma.$transaction(operation, { maxWait: 5000, timeout: 10000 }) }
    catch (error: any) {
      const retryable = error.code === 'P2034' || (error.code === 'P2010' && ['40P01', '40001'].includes(error.meta?.code))
      if (retryable && attempt < 2) continue
      if (retryable) throw new ActionError(409, 'STALE_VERSION', 'Concurrent change; refresh and retry')
      throw error
    }
  }
}
export async function lockTicket(tx: Tx, id: number) {
  await tx.$queryRaw`SELECT "id" FROM "Ticket" WHERE "id" = ${id} FOR UPDATE`
  const ticket = await tx.ticket.findUnique({ where: { id } })
  if (!ticket) throw new ActionError(404, 'NOT_FOUND', 'Resource not found')
  return ticket
}
export async function lockEligibleUsers(tx: Tx, actorId: number, assigneeId: number, validateAssignee = true) {
  // Parent Ticket first, then User IDs ascending. Admin updates lock User rows only.
  const ids = [...new Set([actorId, assigneeId])].sort((a, b) => a - b)
  await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "User" WHERE "id" IN (${Prisma.join(ids)}) ORDER BY "id" FOR UPDATE`)
  const users = await tx.user.findMany({ where: { id: { in: ids } } })
  const actor = users.find(u => u.id === actorId)
  if (!actor?.isActive) throw new ActionError(401, 'UNAUTHORIZED', 'Unauthorized')
  if (actor.mustChangePassword || !['IT_STAFF', 'ADMIN'].includes(actor.role)) throw new ActionError(403, 'FORBIDDEN', 'Staff access required')
  const assignee = users.find(u => u.id === assigneeId)
  if (validateAssignee && (!assignee?.isActive || !['IT_STAFF', 'ADMIN'].includes(assignee.role))) invalid('assigneeId', 'Choose an active IT Staff or Administrator')
}
export async function replay(tx: Tx, userId: number, scope: string, key: string | undefined, payloadDigest: string) {
  if (!key) return null
  const previous = await tx.mutationRequest.findUnique({ where: { userId_scope_key: { userId, scope, key } } })
  if (!previous) return null
  if (previous.payloadDigest !== payloadDigest) throw new ActionError(409, 'IDEMPOTENCY_CONFLICT', 'Key already used for different data')
  return { status: previous.responseStatus, body: previous.response }
}
export async function mutateAction(ticketId: number, actionId: number | undefined, actorId: number, body: unknown, key: string | undefined) {
  const create = actionId === undefined
  const allowed = create
    ? ['expectedTicketVersion', 'actionDateTime', 'description', 'result', 'assigneeId', 'followUpRequired', 'followUpNote', 'attachmentNotes', 'followsUpActionId']
    : ['expectedVersion', 'expectedTicketVersion', 'actionDateTime', 'description', 'result', 'assigneeId', 'followUpRequired', 'followUpNote', 'attachmentNotes', 'status', 'cancellationReason']
  const input = object(body, allowed)
  const expectedTicketVersion = integer(input.expectedTicketVersion, 'expectedTicketVersion')
  const expectedVersion = create ? undefined : integer(input.expectedVersion, 'expectedVersion')
  const data = normalizedFields(input, create, actorId)
  if (!create && !Object.keys(data).length) invalid('body', 'No changes supplied')
  const payloadDigest = digest({ ...data, expectedTicketVersion, ...(create ? {} : { expectedVersion }) })
  const scope = `/tickets/${ticketId}/actions${create ? '' : `/${actionId}`}`
  return actionTransaction(async tx => {
    const ticket = await lockTicket(tx, ticketId)
    const current = create ? null : await tx.actionTaken.findFirst({ where: { id: actionId, ticketId } })
    // Authenticate again under lock before replay; do not disclose a stored result to a revoked actor.
    await lockEligibleUsers(tx, actorId, data.assigneeId ?? current?.assigneeId ?? actorId, false)
    const previous = await replay(tx, actorId, scope, key, payloadDigest)
    if (previous) return previous
    if (!activeTicketStates.includes(ticket.status)) throw new ActionError(409, 'INVALID_TRANSITION', 'Reopen the Ticket before recording more work')
    if (ticket.version !== expectedTicketVersion) throw new ActionError(409, 'STALE_VERSION', 'Ticket changed; refresh before saving', { currentVersion: ticket.version })
    if (!create && !current) throw new ActionError(404, 'NOT_FOUND', 'Resource not found')
    if (current && (current.version !== expectedVersion || current.workCycle !== ticket.workCycle)) throw new ActionError(409, 'STALE_VERSION', 'Action changed; refresh before saving', { currentVersion: current.version })
    if (current && ['COMPLETED', 'CANCELLED'].includes(current.status)) throw new ActionError(409, 'INVALID_TRANSITION', 'Completed and cancelled actions are read-only')
    if (current && data.status) transition(current.status, data.status)
    const merged: Record<string, any> = { ...(current || { status: 'PLANNED' }), ...data }
    const needsEligibleAssignee = create || 'assigneeId' in data || ['IN_PROGRESS', 'COMPLETED'].includes(data.status)
    await lockEligibleUsers(tx, actorId, merged.assigneeId, needsEligibleAssignee)
    if ('cancellationReason' in data && merged.status !== 'CANCELLED') invalid('cancellationReason', 'Only supply a cancellation reason when cancelling')
    validateMerged(merged, ticket.createdAt)
    if (create && data.followsUpActionId !== null) {
      const predecessor = await tx.actionTaken.findFirst({ where: { id: data.followsUpActionId, ticketId, workCycle: ticket.workCycle, status: 'COMPLETED', followUpRequired: true } })
      if (!predecessor) invalid('followsUpActionId', 'Choose completed follow-up-required work in this Ticket and cycle')
      // New records only link backwards to an existing immutable record, so cycles/self-links cannot form.
    }
    if (current && Object.entries(data).every(([k, v]) => stable((current as any)[k]) === stable(v))) invalid('body', 'No changes supplied')
    const before = current ? await tx.actionTaken.findUniqueOrThrow({ where: { id: current.id }, select: publicAction }) : undefined
    const action = create
      ? await tx.actionTaken.create({ data: { ...data, ticketId, workCycle: ticket.workCycle, performedById: actorId } as Prisma.ActionTakenUncheckedCreateInput, select: publicAction })
      : await tx.actionTaken.update({ where: { id: current!.id }, data: { ...data, version: { increment: 1 } }, select: publicAction })
    const updated = await tx.ticket.update({ where: { id: ticketId }, data: { version: { increment: 1 } } })
    const kind = create ? 'CREATED' : data.status ? ({ IN_PROGRESS: 'STARTED', COMPLETED: 'COMPLETED', CANCELLED: 'CANCELLED' }[data.status as string] || 'UPDATED') : data.assigneeId && data.assigneeId !== current!.assigneeId ? 'ASSIGNED' : 'UPDATED'
    await tx.actionTakenEvent.create({ data: { actionId: action.id, actorId, kind, ...(before ? { before: json(before) } : {}), after: json(action) } })
    const result = { status: create ? 201 : 200, body: json({ data: action, ticketVersion: updated.version }) }
    if (key) await tx.mutationRequest.create({ data: { userId: actorId, scope, key, payloadDigest, responseStatus: result.status, response: result.body } })
    return result
  })
}
