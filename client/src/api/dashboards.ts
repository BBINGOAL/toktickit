import { apiFetch, BASE_URL } from './index'

export interface TicketPreview {
  id: number; ticketNumber: string; summary: string; status: string
  itPriority: string | null; updatedAt: string; detailUrl: string
}
export interface RequesterDashboardData {
  asOf: string; windowStart: string; timezone: string
  metrics: { activeTickets: number; waitingForRequester: number; recentlyUpdated: number; recentlyResolved: number }
  recentTickets: TicketPreview[]; attentionTickets: TicketPreview[]
  drillDown: Record<keyof RequesterDashboardData['metrics'], string>
}
export class DashboardError extends Error {
  status: number
  constructor(status: number) {
    super(status === 401 ? 'Your session has expired. Sign in again.' : status === 403 ? 'You do not have access to this dashboard.' : 'Unable to load your dashboard. Please try again.')
    this.status = status
  }
}
export async function fetchRequesterDashboard(): Promise<RequesterDashboardData> {
  const response = await apiFetch(`${BASE_URL}/api/dashboards/requester`)
  if (!response.ok) throw new DashboardError(response.status)
  return response.json()
}
