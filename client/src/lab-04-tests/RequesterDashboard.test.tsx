import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RequesterDashboard from '../pages/RequesterDashboard'
import MyTicketsPage from '../pages/MyTicketsPage'
import { useAuth } from '../context/AuthContext'
import * as dashboards from '../api/dashboards'
import * as api from '../api'

vi.mock('../api/dashboards', async original => ({ ...await original<typeof import('../api/dashboards')>(), fetchRequesterDashboard: vi.fn() }))
vi.mock('../api', () => ({ fetchTickets: vi.fn(), fetchCategories: vi.fn() }))
vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }))
const data: dashboards.RequesterDashboardData = {
  asOf: '2026-10-28T04:00:00.000Z', windowStart: '2026-10-21T17:00:00.000Z', timezone: 'Asia/Bangkok',
  metrics: { activeTickets: 27, waitingForRequester: 2, recentlyUpdated: 11, recentlyResolved: 3 },
  recentTickets: [{ id: 1, ticketNumber: 'TKT-1', summary: 'VPN error', status: 'OPEN', itPriority: 'HIGH', updatedAt: '2026-10-28T03:00:00Z', detailUrl: '/tickets/1' }],
  attentionTickets: [], drillDown: { activeTickets: '/tickets?scope=active&page=1', waitingForRequester: '/tickets?status=WAITING_FOR_REQUESTER&page=1', recentlyUpdated: '/tickets?updatedSince=2026-10-21T17%3A00%3A00.000Z&updatedUntil=2026-10-28T04%3A00%3A00.000Z&page=1', recentlyResolved: '/tickets?resolvedSince=2026-10-21T17%3A00%3A00.000Z&resolvedUntil=2026-10-28T04%3A00%3A00.000Z&page=1' },
}
function auth(id = 1, role = 'REQUESTER') { vi.mocked(useAuth).mockReturnValue({ user: { id, name: 'Requester', role: role as any }, loading: false, setUser: vi.fn(), logout: vi.fn() }) }
function Location() { const location = useLocation(); return <output data-testid="location">{location.pathname}{location.search}</output> }
function page() { return render(<MemoryRouter><RequesterDashboard /></MemoryRouter>) }
beforeEach(() => {
  vi.resetAllMocks(); auth()
  vi.mocked(dashboards.fetchRequesterDashboard).mockResolvedValue(data)
  vi.mocked(api.fetchCategories).mockResolvedValue([])
  vi.mocked(api.fetchTickets).mockResolvedValue({ data: [], meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 } })
})

describe('Requester dashboard states', () => {
  it('renders server counts rather than counting the bounded preview, exact links and Bangkok window', async () => {
    page()
    expect(await screen.findByRole('link', { name: 'Active Tickets: 27' })).toHaveAttribute('href', data.drillDown.activeTickets)
    expect(screen.getByRole('link', { name: 'Recently Resolved: 3' })).toHaveAttribute('href', data.drillDown.recentlyResolved)
    expect(screen.getByRole('link', { name: 'TKT-1: VPN error' })).toHaveAttribute('href', '/tickets/1')
    expect(screen.getByText(/seven calendar dates/)).toHaveTextContent('Asia/Bangkok')
    expect(screen.getByRole('button', { name: 'Refresh dashboard' })).toBeEnabled()
  })
  it('announces loading without premature zero cards and prevents repeated refresh', () => {
    vi.mocked(dashboards.fetchRequesterDashboard).mockReturnValue(new Promise(() => {}))
    page(); expect(screen.getByRole('status')).toHaveTextContent('Loading dashboard')
    expect(screen.queryByRole('link', { name: /Active Tickets:/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Refresh dashboard' })).toBeDisabled()
  })
  it('shows explicit zeros, separate empty lists and usable create/view-all links', async () => {
    vi.mocked(dashboards.fetchRequesterDashboard).mockResolvedValue({ ...data, metrics: { activeTickets: 0, waitingForRequester: 0, recentlyUpdated: 0, recentlyResolved: 0 }, recentTickets: [] })
    page(); expect(await screen.findByRole('link', { name: 'Active Tickets: 0' })).toBeVisible()
    expect(screen.getByText('No tickets yet. Create a ticket to get support.')).toBeVisible()
    expect(screen.getByText('No tickets are waiting for your response.')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Create Ticket' })).toHaveAttribute('href', '/create')
  })
  it('shows a safe error and retries to authoritative success', async () => {
    vi.mocked(dashboards.fetchRequesterDashboard).mockRejectedValueOnce(new Error('SQL SECRET'))
    page(); expect(await screen.findByRole('alert')).not.toHaveTextContent('SECRET')
    fireEvent.click(screen.getByRole('button', { name: 'Retry dashboard' }))
    expect(await screen.findByRole('link', { name: 'Active Tickets: 27' })).toBeVisible()
  })
  it('keeps a labelled previous snapshot after a recoverable refresh failure', async () => {
    page(); await screen.findByRole('link', { name: 'Active Tickets: 27' })
    vi.mocked(dashboards.fetchRequesterDashboard).mockRejectedValueOnce(new Error('offline'))
    fireEvent.click(screen.getByRole('button', { name: 'Refresh dashboard' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Showing the previous snapshot')
    expect(screen.getByRole('link', { name: 'Active Tickets: 27' })).toBeVisible()
  })
  it.each([401, 403])('clears old data on authorization error %s', async status => {
    page(); await screen.findByRole('link', { name: 'Active Tickets: 27' })
    vi.mocked(dashboards.fetchRequesterDashboard).mockRejectedValueOnce(new dashboards.DashboardError(status))
    fireEvent.click(screen.getByRole('button', { name: 'Refresh dashboard' }))
    expect(await screen.findByRole('alert')).toBeVisible()
    expect(screen.queryByRole('link', { name: 'Active Tickets: 27' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Return to sign in' })).toBeVisible()
  })
  it('denies non-Requester access without issuing a dashboard request', () => {
    auth(2, 'IT_STAFF'); page()
    expect(screen.getByRole('alert')).toHaveTextContent('Requester access required')
    expect(dashboards.fetchRequesterDashboard).not.toHaveBeenCalled()
  })
  it('ignores a late response from a previous user and never displays their snapshot', async () => {
    let finish!: (value: typeof data) => void
    vi.mocked(dashboards.fetchRequesterDashboard).mockReturnValueOnce(new Promise(resolve => { finish = resolve })).mockResolvedValueOnce({ ...data, metrics: { ...data.metrics, activeTickets: 0 }, recentTickets: [] })
    const rendered = page(); auth(2)
    rendered.rerender(<MemoryRouter><RequesterDashboard /></MemoryRouter>)
    await screen.findByRole('link', { name: 'Active Tickets: 0' })
    await act(async () => finish(data))
    expect(screen.queryByRole('link', { name: 'Active Tickets: 27' })).not.toBeInTheDocument()
  })
})

describe('My Tickets URL integration', () => {
  it('loads dashboard bounds from URL and preserves them while searching/sorting/clearing', async () => {
    render(<MemoryRouter initialEntries={['/tickets?scope=active&updatedSince=2026-10-21T17%3A00%3A00.000Z&page=2&sort=updatedAt&order=desc']}><MyTicketsPage /><Location /></MemoryRouter>)
    await waitFor(() => expect(api.fetchTickets).toHaveBeenCalledWith(expect.objectContaining({ scope: 'active', page: '2', updatedSince: data.windowStart })))
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'VPN' } })
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))
    await waitFor(() => expect(api.fetchTickets).toHaveBeenLastCalledWith(expect.objectContaining({ scope: 'active', search: 'VPN', page: '1', updatedSince: data.windowStart })))
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'OPEN' } })
    await waitFor(() => expect(api.fetchTickets).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'OPEN', scope: 'active' })))
    fireEvent.click(screen.getAllByRole('button', { name: 'Clear Filters' })[0])
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/tickets$/))
    expect(api.fetchTickets).toHaveBeenLastCalledWith({})
  })
  it('suppresses an outdated query response after navigating to another filter', async () => {
    let finish!: (value: any) => void
    vi.mocked(api.fetchTickets).mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    render(<MemoryRouter><MyTicketsPage /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'CLOSED' } })
    await screen.findByText('No results found')
    await act(async () => finish({ data: [], meta: { totalItems: 999, totalPages: 100 } }))
    expect(screen.queryByText(/999 tickets/)).not.toBeInTheDocument()
    expect(screen.getByText('No results found')).toBeVisible()
  })
})
