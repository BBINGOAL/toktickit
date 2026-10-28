import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { DashboardError, fetchRequesterDashboard } from '../api/dashboards'
import type { RequesterDashboardData, TicketPreview } from '../api/dashboards'
import './RequesterDashboard.css'

const cards = [
  ['activeTickets', 'Active Tickets'], ['waitingForRequester', 'Waiting for You'],
  ['recentlyUpdated', 'Recently Updated'], ['recentlyResolved', 'Recently Resolved'],
] as const
const time = (value: string) => new Date(value).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', dateStyle: 'medium', timeStyle: 'short' })

function TicketList({ title, tickets, viewAll, empty }: { title: string; tickets: TicketPreview[]; viewAll: string; empty: string }) {
  return <section className="dashboard-panel" aria-label={title}>
    <h2>{title}</h2>
    {tickets.length ? <ul className="dashboard-tickets">{tickets.map(t => <li key={t.id}>
      <Link to={t.detailUrl}>{t.ticketNumber}: {t.summary}</Link>
      <span>{t.status.replaceAll('_', ' ')} · Updated {time(t.updatedAt)} (Bangkok)</span>
    </li>)}</ul> : <p>{empty}</p>}
    <Link to={viewAll}>View all {title.toLowerCase()}</Link>
  </section>
}

export default function RequesterDashboard() {
  const { user } = useAuth()
  const [snapshot, setSnapshot] = useState<{ userId: number; data: RequesterDashboardData } | null>(null)
  const [error, setError] = useState<{ status: number; message: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    if (!user || user.role !== 'REQUESTER') return
    let live = true
    setLoading(true); setError(null)
    fetchRequesterDashboard().then(data => {
      if (live) setSnapshot({ userId: user.id, data })
    }).catch(e => {
      if (!live) return
      const status = e instanceof DashboardError ? e.status : 0
      setError({ status, message: e instanceof DashboardError ? e.message : 'Unable to load your dashboard. Please try again.' })
      if (status === 401 || status === 403) setSnapshot(null)
    }).finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [user?.id, user?.role, refresh])
  if (!user || user.role !== 'REQUESTER') return <div role="alert"><h1>Dashboard unavailable</h1><p>Requester access required.</p><Link to="/">Return to sign in</Link></div>
  const data = snapshot?.userId === user.id ? snapshot.data : null
  return <div className="requester-dashboard">
    <header className="dashboard-heading">
      <div><h1>My Dashboard</h1><p>Your support requests at a glance.</p></div>
      <button onClick={() => setRefresh(n => n + 1)} disabled={loading}>Refresh dashboard</button>
    </header>
    <nav aria-label="Dashboard quick actions"><Link to="/create">Create Ticket</Link><Link to="/tickets">My Tickets</Link></nav>
    {loading && <p role="status">{data ? 'Refreshing dashboard…' : 'Loading dashboard…'}</p>}
    {error && <div role="alert" className="dashboard-error">
      <p>{error.message}</p>{data && <p>Showing the previous snapshot. Counts may have changed.</p>}
      {error.status === 401 || error.status === 403 ? <Link to="/">Return to sign in</Link> : <button disabled={loading} onClick={() => setRefresh(n => n + 1)}>Retry dashboard</button>}
    </div>}
    {data && <>
      <p className="dashboard-window">Snapshot: {time(data.asOf)} ({data.timezone}). Recent window: {time(data.windowStart)} through {time(data.asOf)} — seven calendar dates.</p>
      <div className="dashboard-metrics" aria-label="Ticket summary">{cards.map(([key, label]) =>
        <Link className="dashboard-metric" to={data.drillDown[key]} key={key} aria-label={`${label}: ${data.metrics[key]}`}>
          <span>{label}</span><strong>{data.metrics[key]}</strong>
        </Link>)}</div>
      <div className="dashboard-lists">
        <TicketList title="Recent Tickets" tickets={data.recentTickets} viewAll="/tickets?sort=updatedAt&order=desc&page=1" empty="No tickets yet. Create a ticket to get support." />
        <TicketList title="Needs Your Attention" tickets={data.attentionTickets} viewAll={data.drillDown.waitingForRequester} empty="No tickets are waiting for your response." />
      </div>
    </>}
  </div>
}
