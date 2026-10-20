import { apiFetch, BASE_URL } from './index'

export type ActionStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
export interface ActionTaken {
  id: number; ticketId: number; workCycle: number; actionDateTime: string
  description: string; result: string; performedBy: { id: number; name: string }
  assignee: { id: number; name: string }; followUpRequired: boolean; followUpNote: string
  attachmentNotes: string; followsUpActionId: number | null; status: ActionStatus
  cancellationReason: string | null; version: number; createdAt: string; updatedAt: string
}
export interface PageMeta { page: number; pageSize: number; totalItems: number; totalPages: number }
export interface ActionPage { data: ActionTaken[]; meta: PageMeta; ticketVersion: number }
export interface Assignee { id: number; name: string; role: string }
export interface ActionEvent {
  id: number; kind: string; actor: { id: number; name: string }; createdAt: string
  before: Record<string, unknown> | null; after: Record<string, unknown>
}
export interface ActionFields {
  actionDateTime: string; description: string; result: string; assigneeId: number
  followUpRequired: boolean; followUpNote: string; attachmentNotes: string
}
export interface CreateAction extends ActionFields { expectedTicketVersion: number; followsUpActionId: number | null }
export interface UpdateAction extends Partial<ActionFields> {
  expectedVersion: number; expectedTicketVersion: number; status?: ActionStatus; cancellationReason?: string
}
export class ActionApiError extends Error {
  status: number
  code: string
  fieldErrors: Record<string, string>
  currentVersion?: number
  constructor(status: number, code: string, message: string,
    fieldErrors: Record<string, string> = {}, currentVersion?: number) {
    super(message); this.status = status; this.code = code; this.fieldErrors = fieldErrors; this.currentVersion = currentVersion
  }
}
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(`${BASE_URL}/api${path}`, init)
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    // Do not display arbitrary server/proxy error strings or stacks.
    const messages: Record<number, string> = {
      400: 'Check the action fields below.', 401: 'Your session expired. Sign in again.',
      403: 'You do not have permission to perform this action.', 404: 'Ticket or action unavailable.',
      409: 'Another change or workflow rule prevents saving. Reload current state before trying again.',
    }
    const allowedFields = ['actionDateTime', 'description', 'result', 'assigneeId', 'followUpRequired', 'followUpNote', 'attachmentNotes', 'cancellationReason']
    const errors = Object.fromEntries(Object.entries(body?.fieldErrors || {}).filter(([key, value]) => allowedFields.includes(key) && typeof value === 'string' && value.length <= 160)) as Record<string, string>
    throw new ActionApiError(response.status, body?.code || 'API_ERROR', messages[response.status] || 'Unable to save or load Actions Taken. Please retry.', errors, body?.currentVersion)
  }
  if (!body) throw new Error('Invalid Actions Taken response. Please retry.')
  return body as T
}
export function fetchActions(ticketId: number, page = 1, pageSize = 10) {
  return request<ActionPage>(`/tickets/${ticketId}/actions?page=${page}&pageSize=${pageSize}`)
}
export function fetchActionHistory(ticketId: number, actionId: number, page = 1) {
  return request<{ data: ActionEvent[]; meta: PageMeta }>(`/tickets/${ticketId}/actions/${actionId}/history?page=${page}&pageSize=10`)
}
export function fetchAssignees(search = '', page = 1) {
  return request<{ data: Assignee[]; meta: PageMeta }>(`/staff/action-assignees?${new URLSearchParams({ search, page: String(page), pageSize: '10' })}`)
}
const mutation = (method: string, body: CreateAction | UpdateAction, key: string): RequestInit => ({
  method, headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key }, body: JSON.stringify(body),
})
export function createAction(ticketId: number, body: CreateAction, key: string) {
  return request<{ data: ActionTaken; ticketVersion: number }>(`/tickets/${ticketId}/actions`, mutation('POST', body, key))
}
export function updateAction(ticketId: number, actionId: number, body: UpdateAction, key: string) {
  return request<{ data: ActionTaken; ticketVersion: number }>(`/tickets/${ticketId}/actions/${actionId}`, mutation('PATCH', body, key))
}
