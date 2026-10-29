import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import StaffDashboard from '../pages/StaffDashboard'
import ITStaffQueue from '../pages/ITStaffQueue'
import { useAuth } from '../context/AuthContext'
import * as api from '../api/dashboards'
import { fetchStaffTickets } from '../api'

vi.mock('../api/dashboards', async original => ({ ...await original<typeof import('../api/dashboards')>(), fetchStaffDashboard: vi.fn(), fetchMyActions: vi.fn() }))
vi.mock('../api', () => ({ fetchStaffTickets: vi.fn() }))
vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }))
const statuses = ['NEW','OPEN','IN_PROGRESS','WAITING_FOR_REQUESTER','RESOLVED','CLOSED','REOPENED','CANCELLED']
const date = '2026-10-28T10:00:00Z'
const data: api.StaffDashboardData = { asOf: date, windowStart: '2026-10-21T17:00:00Z', timezone: 'Asia/Bangkok',
  metrics: { unassignedActive: 15, myActiveTickets: 4, myPendingActions: 12, byStatus: Object.fromEntries(statuses.map(s => [s,0])), activeByPriority: { LOW: 0, MEDIUM: 0, HIGH: 2, UNSET: 1 } }, recentTickets: [], urgentTickets: [],
  myActions: [{ id: 99, ticketId: 7, ticketNumber: 'TKT-7', description: 'Fix network', status: 'PLANNED', updatedAt: date, detailUrl: '/tickets/7?actionId=99' }],
  drillDown: { unassignedActive: '/staff/tickets?scope=active&owner=unassigned&page=1', myActiveTickets: '/staff/tickets?scope=active&owner=me&page=1', myPendingActions: '/staff/dashboard?view=my-actions&page=1&pageSize=10', byStatus: Object.fromEntries(statuses.map(s => [s,`/staff/tickets?status=${s}&page=1`])), activeByPriority: Object.fromEntries(['LOW','MEDIUM','HIGH','UNSET'].map(p => [p,`/staff/tickets?scope=active&priority=${p}&page=1`])), recentTickets: '/staff/tickets?sort=updatedAt', urgentTickets: '/staff/tickets?scope=active&priority=HIGH' },
}
function auth(id = 2, role = 'IT_STAFF') { vi.mocked(useAuth).mockReturnValue({ user: { id, name: 'Staff', role }, loading: false, setUser: vi.fn(), logout: vi.fn() }) }
function Location() { const loc = useLocation(); return <span data-testid="location">{loc.pathname}{loc.search}</span> }
function page(url = '/staff/dashboard') { return render(<MemoryRouter initialEntries={[url]}><StaffDashboard /><Location /></MemoryRouter>) }
beforeEach(() => {
  vi.resetAllMocks(); auth()
  vi.mocked(api.fetchStaffDashboard).mockResolvedValue(data)
  vi.mocked(api.fetchMyActions).mockResolvedValue({ data: data.myActions, meta: { page: 1, pageSize: 10, totalItems: 12, totalPages: 2 } })
  vi.mocked(fetchStaffTickets).mockResolvedValue({ data: [], meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 } })
})
describe('Staff Dashboard', () => {
  it.each(['IT_STAFF','ADMIN'])('shows authoritative counts, all zero group keys and direct action links for %s', async role => {
    auth(2,role); page()
    expect(await screen.findByRole('link',{name:'My Pending Actions: 12'})).toHaveAttribute('href',data.drillDown.myPendingActions)
    expect(screen.getByRole('link',{name:'Unassigned Active: 15'})).toHaveAttribute('href',data.drillDown.unassignedActive)
    expect(within(screen.getByRole('region',{name:'Tickets by Status'})).getAllByRole('link')).toHaveLength(8)
    expect(screen.getByRole('link',{name:'UNSET: 1'})).toHaveAttribute('href',data.drillDown.activeByPriority.UNSET)
    expect(screen.getByRole('link',{name:/TKT-7 · Action #99/})).toHaveAttribute('href','/tickets/7?actionId=99')
    expect(screen.getByText(/Snapshot:/)).toHaveTextContent('Asia/Bangkok')
  })
  it('shows loading without inventing zero counts and disables refresh', () => {
    vi.mocked(api.fetchStaffDashboard).mockReturnValue(new Promise(() => {})); page()
    expect(screen.getByRole('status')).toHaveTextContent('Loading dashboard')
    expect(screen.queryByRole('link',{name:/Unassigned Active:/})).not.toBeInTheDocument()
    expect(screen.getByRole('button',{name:'Refresh dashboard'})).toBeDisabled()
  })
  it('shows explicit empty lists and zero cards', async () => {
    vi.mocked(api.fetchStaffDashboard).mockResolvedValue({...data,metrics:{...data.metrics,unassignedActive:0,myActiveTickets:0,myPendingActions:0},myActions:[]})
    page(); expect(await screen.findByRole('link',{name:'My Pending Actions: 0'})).toBeVisible()
    expect(screen.getByText('No pending actions assigned to you on active Tickets.')).toBeVisible()
    expect(screen.getByText('No urgent tickets.')).toBeVisible()
  })
  it('retries safe failure without displaying arbitrary server text', async () => {
    vi.mocked(api.fetchStaffDashboard).mockRejectedValueOnce(new Error('SQL SECRET')); page()
    expect(await screen.findByRole('alert')).not.toHaveTextContent('SECRET')
    fireEvent.click(screen.getByRole('button',{name:'Retry dashboard'}))
    expect(await screen.findByRole('link',{name:'My Active Tickets: 4'})).toBeVisible()
  })
  it('labels retained data on refresh failure', async () => {
    page(); await screen.findByRole('link',{name:'My Active Tickets: 4'})
    vi.mocked(api.fetchStaffDashboard).mockRejectedValueOnce(new Error('offline'))
    fireEvent.click(screen.getByRole('button',{name:'Refresh dashboard'}))
    expect(await screen.findByRole('alert')).toHaveTextContent('Showing previously loaded data')
  })
  it.each([401,403])('clears stale counts on authorization failure %s', async status => {
    page(); await screen.findByRole('link',{name:'My Active Tickets: 4'})
    vi.mocked(api.fetchStaffDashboard).mockRejectedValueOnce(new api.DashboardError(status))
    fireEvent.click(screen.getByRole('button',{name:'Refresh dashboard'}))
    await screen.findByRole('alert'); expect(screen.queryByRole('link',{name:'My Active Tickets: 4'})).not.toBeInTheDocument()
  })
  it('denies Requesters without fetching business data', () => {
    auth(3,'REQUESTER'); page(); expect(screen.getByRole('alert')).toHaveTextContent('Staff or Administrator access required')
    expect(api.fetchStaffDashboard).not.toHaveBeenCalled(); expect(api.fetchMyActions).not.toHaveBeenCalled()
  })
  it('ignores an older user response', async () => {
    let finish!: (value: typeof data) => void
    vi.mocked(api.fetchStaffDashboard).mockReturnValueOnce(new Promise(resolve => {finish=resolve})).mockResolvedValueOnce({...data,metrics:{...data.metrics,myActiveTickets:0}})
    const rendered=page(); auth(3)
    rendered.rerender(<MemoryRouter><StaffDashboard /></MemoryRouter>)
    await screen.findByRole('link',{name:'My Active Tickets: 0'})
    await act(async()=>finish(data)); expect(screen.queryByRole('link',{name:'My Active Tickets: 4'})).not.toBeInTheDocument()
  })
  it('loads paged My Actions from URL and resets page when size changes', async () => {
    page('/staff/dashboard?view=my-actions&page=2&pageSize=10')
    await waitFor(()=>expect(api.fetchMyActions).toHaveBeenCalledWith('page=2&pageSize=10'))
    expect(api.fetchStaffDashboard).not.toHaveBeenCalled()
    fireEvent.change(await screen.findByLabelText('Actions per page'),{target:{value:'25'}})
    await waitFor(()=>expect(api.fetchMyActions).toHaveBeenLastCalledWith('page=1&pageSize=25'))
    expect(screen.getByTestId('location')).toHaveTextContent('view=my-actions&page=1&pageSize=25')
  })
  it('reports a failed My Actions request instead of a false empty state', async () => {
    vi.mocked(api.fetchMyActions).mockRejectedValueOnce(new Error('SQL'))
    page('/staff/dashboard?view=my-actions&page=1')
    await screen.findByRole('alert'); expect(screen.queryByText('No pending actions assigned to you on active Tickets.')).not.toBeInTheDocument()
  })
})
describe('Queue URL state',()=>{
  it('preserves Dashboard filters through search/sort and resets page atomically',async()=>{
    render(<MemoryRouter initialEntries={['/staff/tickets?scope=active&owner=me&priority=UNSET&page=2']}><ITStaffQueue /><Location /></MemoryRouter>)
    await waitFor(()=>expect(fetchStaffTickets).toHaveBeenCalledWith(expect.objectContaining({scope:'active',owner:'me',priority:'UNSET',page:'2'})))
    fireEvent.change(screen.getByLabelText('Search'),{target:{value:'VPN'}})
    fireEvent.click(screen.getByRole('button',{name:'Search'}))
    await waitFor(()=>expect(fetchStaffTickets).toHaveBeenLastCalledWith(expect.objectContaining({scope:'active',owner:'me',priority:'UNSET',search:'VPN',page:'1'})))
    fireEvent.change(screen.getByLabelText('Sort by'),{target:{value:'updatedAt'}})
    await waitFor(()=>expect(fetchStaffTickets).toHaveBeenLastCalledWith(expect.objectContaining({owner:'me',sort:'updatedAt',page:'1'})))
    fireEvent.click(screen.getByRole('button',{name:'Clear Filters'})); await waitFor(()=>expect(fetchStaffTickets).toHaveBeenLastCalledWith({}))
  })
})
