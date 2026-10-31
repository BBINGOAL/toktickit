import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { DashboardError, fetchStaffDashboard, fetchMyActions } from '../api/dashboards'
import type { StaffDashboardData, PendingActionPage, PendingActionPreview, TicketPreview } from '../api/dashboards'
import './RequesterDashboard.css'

const time = (value: string) => new Date(value).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', dateStyle: 'medium', timeStyle: 'short' })
const metricCards = [['unassignedActive','Unassigned Active'],['myActiveTickets','My Active Tickets'],['myPendingActions','My Pending Actions']] as const
const groupCards = [['byStatus','Tickets by Status'],['activeByPriority','Active Tickets by IT Priority']] as const
function TicketList({ title, rows, all }: { title: string; rows: TicketPreview[]; all: string }) {
  return <section className="dashboard-panel" aria-label={title}><h2>{title}</h2>
    {rows.length ? <ul className="dashboard-tickets">{rows.map(t => <li key={t.id}><Link to={t.detailUrl}>{t.ticketNumber}: {t.summary}</Link><span>{t.status.replaceAll('_',' ')} · IT priority: {t.itPriority || 'UNSET'} · {time(t.updatedAt)} (Bangkok)</span></li>)}</ul> : <p>No {title.toLowerCase()}.</p>}
    <Link to={all}>View all {title.toLowerCase()}</Link></section>
}
function ActionList({ rows }: { rows: PendingActionPreview[] }) {
  return rows.length ? <ul className="dashboard-tickets">{rows.map(a => <li key={a.id}><Link to={a.detailUrl}>{a.ticketNumber} · Action #{a.id}: {a.description}</Link><span>{a.status.replaceAll('_',' ')} · {time(a.updatedAt)} (Bangkok)</span></li>)}</ul> : <p>No pending actions assigned to you on active Tickets.</p>
}
const errorInfo = (e: unknown) => ({ status: e instanceof DashboardError ? e.status : 0, message: e instanceof DashboardError ? e.message : 'Unable to load your dashboard. Please try again.' })

export default function StaffDashboard() {
  const { user } = useAuth(), userId = user?.id, role = user?.role
  const allowed = role === 'IT_STAFF' || role === 'ADMIN'
  const [params, setParams] = useSearchParams(), queryKey = params.toString(), view = params.get('view') || ''
  const actionsView = view === 'my-actions'
  const [snapshot, setSnapshot] = useState<{ userId: number; data: StaffDashboardData } | null>(null)
  const [work, setWork] = useState<{ key: string; data: PendingActionPage } | null>(null)
  const [loading, setLoading] = useState(true), [error, setError] = useState<ReturnType<typeof errorInfo> | null>(null)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    if (userId === undefined || !allowed || (view && !actionsView)) return
    let live = true; setLoading(true); setError(null)
    const query = new URLSearchParams(queryKey); query.delete('view')
    const load = actionsView ? fetchMyActions(query.toString()) : fetchStaffDashboard()
    load.then(result => {
      if (!live) return
      if (actionsView) setWork({ key: `${userId}:${queryKey}`, data: result as PendingActionPage })
      else setSnapshot({ userId, data: result as StaffDashboardData })
    }).catch(e => {
      if (!live) return
      const failure = errorInfo(e); setError(failure)
      if ([401,403].includes(failure.status)) { setSnapshot(null); setWork(null) }
    }).finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [userId, allowed, view, actionsView, queryKey, revision])
  if (!allowed || userId === undefined) return <div role="alert"><h1>Dashboard unavailable</h1><p>Staff or Administrator access required.</p><Link to="/">Return to sign in</Link></div>
  if (view && !actionsView) return <div role="alert"><p>Unknown dashboard view.</p><Link to="/staff/dashboard">Return to Staff Dashboard</Link></div>
  const data = snapshot?.userId === userId ? snapshot.data : null
  const actionPage = work?.key === `${userId}:${queryKey}` ? work.data : null
  const existing = actionsView ? actionPage : data
  const page = actionPage?.meta.page || Number(params.get('page') || 1)
  const changePage = (page: number, size = params.get('pageSize') || '10') => setParams({ view: 'my-actions', page: String(Math.max(1,page)), pageSize: size })
  return <div className="requester-dashboard staff-dashboard">
    <header className="dashboard-heading"><div><h1>{actionsView ? 'My Pending Actions' : 'Staff Dashboard'}</h1><p>Work assigned to you and the service desk overview.</p></div><button disabled={loading} onClick={() => setRevision(n => n + 1)}>Refresh dashboard</button></header>
    <nav aria-label="Staff dashboard navigation"><Link to="/staff/dashboard">Overview</Link><Link to="/staff/dashboard?view=my-actions&page=1&pageSize=10">My Actions</Link><Link to="/staff/tickets">Ticket Queue</Link></nav>
    {loading && <p role="status">{existing ? 'Refreshing dashboard…' : 'Loading dashboard…'}</p>}
    {error && <div className="dashboard-error" role="alert"><p>{error.message}</p>{existing && <p>Showing previously loaded data. Values may have changed.</p>}{[401,403].includes(error.status) ? <Link to="/">Return to sign in</Link> : <button disabled={loading} onClick={() => setRevision(n => n + 1)}>Retry dashboard</button>}</div>}
    {actionsView ? actionPage && <section className="dashboard-panel" aria-label="My pending work">
      <p>{actionPage.meta.totalItems} pending actions · Page {page} of {actionPage.meta.totalPages || 1}</p>
      {!actionPage.data.length && actionPage.meta.totalItems > 0 ? <p>No actions on this page. Choose an earlier page.</p> : <ActionList rows={actionPage.data} />}
      <nav aria-label="My Actions pages"><button disabled={loading || page <= 1} onClick={() => changePage(1)}>First page</button><button disabled={loading || page <= 1} onClick={() => changePage(page - 1)}>Previous page</button><button disabled={loading || page >= actionPage.meta.totalPages} onClick={() => changePage(page + 1)}>Next page</button><label>Actions per page <select value={params.get('pageSize') || '10'} disabled={loading} onChange={e => changePage(1,e.target.value)}>{[10,25,50].map(n => <option key={n}>{n}</option>)}</select></label></nav>
    </section> : data && <>
      <p className="dashboard-window">Snapshot: {time(data.asOf)} ({data.timezone}). Counts cover all accessible Tickets; active excludes resolved, closed and cancelled.</p>
      <p>Queue and My Actions links show current data. Counts may change after this snapshot.</p>
      <div className="dashboard-metrics" aria-label="Staff summary">{metricCards.map(([key,label]) => <Link className="dashboard-metric" key={key} to={data.drillDown[key]} aria-label={`${label}: ${data.metrics[key]}`}><span>{label}</span><strong>{data.metrics[key]}</strong></Link>)}</div>
      <div className="dashboard-lists">{groupCards.map(([key,title]) => <section key={key} className="dashboard-panel" aria-label={title}><h2>{title}</h2><ul className="dashboard-tickets">{Object.entries(data.metrics[key]).map(([group,count]) => <li key={group}><Link to={data.drillDown[key][group]}>{group.replaceAll('_',' ')}: {count}</Link></li>)}</ul></section>)}</div>
      <div className="dashboard-lists" style={{ marginTop: '1rem' }}><section className="dashboard-panel" aria-label="My Actions"><h2>My Actions</h2><ActionList rows={data.myActions} /><Link to={data.drillDown.myPendingActions}>View all my pending actions</Link></section><TicketList title="Urgent Tickets" rows={data.urgentTickets} all={data.drillDown.urgentTickets} /><TicketList title="Recent Tickets" rows={data.recentTickets} all={data.drillDown.recentTickets} /></div>
    </>}
  </div>
}
