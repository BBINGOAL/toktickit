import { ActionApiError } from '../../api/actions'
import type { ActionTaken } from '../../api/actions'

export const active = ['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'REOPENED']
export const terminal = (a: ActionTaken) => ['COMPLETED', 'CANCELLED'].includes(a.status)
export const formatTime = (value: string) => new Date(value).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' }) + ' (Bangkok)'
export function localTime(value: string) {
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 23)
}
export const message = (error: unknown) => error instanceof ActionApiError ? error.message : 'Unable to load or save Actions Taken. Please retry.'

