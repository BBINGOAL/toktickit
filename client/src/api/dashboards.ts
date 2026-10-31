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

export interface PendingActionPreview {
  id: number; ticketId: number; ticketNumber: string; description: string; status: string; updatedAt: string; detailUrl: string
}
export interface StaffDashboardData {
  asOf: string; windowStart: string; timezone: string
  metrics: { unassignedActive: number; myActiveTickets: number; myPendingActions: number; byStatus: Record<string, number>; activeByPriority: Record<string, number> }
  recentTickets: TicketPreview[]; urgentTickets: TicketPreview[]; myActions: PendingActionPreview[]
  drillDown: { unassignedActive: string; myActiveTickets: string; myPendingActions: string; byStatus: Record<string, string>; activeByPriority: Record<string, string>; recentTickets: string; urgentTickets: string }
}
export interface PendingActionPage {
  data: PendingActionPreview[]; meta: { page: number; pageSize: number; totalItems: number; totalPages: number }
}
async function staffRequest<T>(path: string): Promise<T> {
  const response = await apiFetch(`${BASE_URL}/api${path}`)
  if (!response.ok) throw new DashboardError(response.status)
  return response.json()
}
export const fetchStaffDashboard = () => staffRequest<StaffDashboardData>('/dashboards/staff')
export const fetchMyActions = (query = '') => staffRequest<PendingActionPage>('/staff/actions?' + query)
