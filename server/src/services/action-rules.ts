export class ActionError extends Error {
  constructor(public status: number, public code: string, message: string, public details: Record<string, unknown> = {}) { super(message) }
}
export function invalid(field: string, message: string): never {
  throw new ActionError(400, 'VALIDATION_ERROR', 'Invalid action data', { fieldErrors: { [field]: message } })
}
export function integer(value: unknown, field: string, minimum = 0): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimum || value > 2147483647) invalid(field, `Expected integer >= ${minimum}`)
  return value as number
}
export function text(value: unknown, field: string, limit: number, required = false): string {
  if (typeof value !== 'string') invalid(field, 'Expected text')
  const trimmed = (value as string).trim()
  if (trimmed.length > limit || (required && !trimmed.length)) invalid(field, `Expected ${required ? '1' : '0'}-${limit} characters`)
  return trimmed
}
export function object(body: unknown, allowed: string[]): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) invalid('body', 'Expected an object')
  const result = body as Record<string, unknown>
  for (const key of Object.keys(result)) if (!allowed.includes(key)) invalid(key, 'Unknown field')
  return result
}
export const actionEdges: Record<string, readonly string[]> = { PLANNED: ['IN_PROGRESS', 'CANCELLED'], IN_PROGRESS: ['COMPLETED', 'CANCELLED'], COMPLETED: [], CANCELLED: [] }
export const activeTicketStates = ['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'REOPENED']
export function transition(from: string, to: string) {
  if (!actionEdges[from]?.includes(to)) throw new ActionError(409, 'INVALID_TRANSITION', `Cannot transition from ${from} to ${to}`)
}
export function normalizedFields(body: Record<string, unknown>, create: boolean, actorId: number) {
  const data: Record<string, any> = {}
  for (const [field, limit] of Object.entries({ description: 2000, result: 2000, followUpNote: 2000, attachmentNotes: 1000, cancellationReason: 1000 })) {
    if (field in body) data[field] = text(body[field], field, limit, field === 'description' || field === 'cancellationReason')
    else if (create && field !== 'cancellationReason') data[field] = field === 'description' ? text(undefined, field, limit, true) : ''
  }
  if ('actionDateTime' in body || create) {
    const value = body.actionDateTime
    // Strict calendar/time/offset validation: Date.parse alone normalizes impossible dates.
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.test(value)) invalid('actionDateTime', 'An ISO date/time with offset is required')
    const raw = value as string
    const year = Number(raw.slice(0, 4)), month = Number(raw.slice(5, 7)), day = Number(raw.slice(8, 10))
    const date = new Date(raw)
    const offset = raw.endsWith('Z') ? null : raw.slice(-6)
    if (!Number.isFinite(date.getTime()) || month < 1 || month > 12 || day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate() || Number(raw.slice(11, 13)) > 23 || Number(raw.slice(14, 16)) > 59 || Number(raw.slice(17, 19)) > 59 || (offset && (Number(offset.slice(1, 3)) > 23 || Number(offset.slice(4)) > 59))) invalid('actionDateTime', 'Invalid date/time')
    data.actionDateTime = date
  }
  if ('assigneeId' in body || create) data.assigneeId = integer('assigneeId' in body ? body.assigneeId : actorId, 'assigneeId', 1)
  if ('followUpRequired' in body || create) {
    const flag = 'followUpRequired' in body ? body.followUpRequired : false
    if (typeof flag !== 'boolean') invalid('followUpRequired', 'Expected boolean')
    data.followUpRequired = flag
  }
  if (create) data.followsUpActionId = body.followsUpActionId === undefined || body.followsUpActionId === null ? null : integer(body.followsUpActionId, 'followsUpActionId', 1)
  if ('status' in body) {
    if (typeof body.status !== 'string' || !Object.prototype.hasOwnProperty.call(actionEdges, body.status)) invalid('status', 'Invalid status')
    data.status = body.status
  }
  return data
}
export function validateMerged(action: Record<string, any>, ticketCreatedAt: Date, now = new Date()) {
  if (action.actionDateTime < ticketCreatedAt || action.actionDateTime > now) invalid('actionDateTime', 'Must be between Ticket creation and now')
  if (action.followUpRequired && !action.followUpNote.trim()) invalid('followUpNote', 'Required when follow-up is needed')
  if (action.status === 'COMPLETED' && !action.result.trim()) invalid('result', 'Required to complete an action')
  if (action.status === 'CANCELLED' && !action.cancellationReason?.trim()) invalid('cancellationReason', 'Required to cancel an action')
}
