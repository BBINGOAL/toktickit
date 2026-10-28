import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchStaffTickets } from '../api'
import type { TicketsResponse } from '../api'
import { useAuth } from '../context/AuthContext'
import './ITStaffQueue.css'

const statuses = ['NEW','OPEN','IN_PROGRESS','WAITING_FOR_REQUESTER','RESOLVED','CLOSED','REOPENED','CANCELLED']
export default function ITStaffQueue() {
  const { user } = useAuth(), userId = user?.id
  const [params, setParams] = useSearchParams(), queryKey = params.toString()
  const [input, setInput] = useState(params.get('search') || '')
  const [snapshot, setSnapshot] = useState<{ key: string; data: TicketsResponse } | null>(null)
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [revision, setRevision] = useState(0)
  useEffect(() => { setInput(new URLSearchParams(queryKey).get('search') || '') }, [queryKey])
  useEffect(() => {
    let live = true; setLoading(true); setError('')
    fetchStaffTickets(Object.fromEntries(new URLSearchParams(queryKey))).then(data => {
      if (live) setSnapshot({ key: `${userId}:${queryKey}`, data })
    }).catch(() => { if (live) setError('Failed to load tickets. Check the filters or retry.') }).finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [userId, queryKey, revision])
  const result = snapshot?.key === `${userId}:${queryKey}` ? snapshot.data : null
  const page = result?.meta.page || Number(params.get('page') || 1), totalPages = result?.meta.totalPages || 0
  function update(changes: Record<string, string>, reset = true) {
    const next = new URLSearchParams(params)
    for (const [key,value] of Object.entries(changes)) { if (value) next.set(key,value); else next.delete(key) }
    if (reset) next.set('page','1')
    setParams(next)
  }
  return <div className="staff-queue">
    <h1>IT Staff Ticket Queue</h1>
    <form className="queue-filters" onSubmit={e => { e.preventDefault(); update({ search: input }) }}>
      <label>Search<input placeholder="Search ticket number or summary..." value={input} maxLength={100} onChange={e => setInput(e.target.value)} /></label>
      <button type="submit">Search</button>
      <label>Status<select value={params.get('status') || ''} onChange={e => update({ status: e.target.value })}><option value="">All Statuses</option>{statuses.map(s => <option key={s} value={s}>{s.replaceAll('_',' ')}</option>)}</select></label>
      <label>IT Priority<select value={params.get('priority') || ''} onChange={e => update({ priority: e.target.value })}><option value="">All IT Priorities</option>{['LOW','MEDIUM','HIGH','UNSET'].map(p => <option key={p}>{p}</option>)}</select></label>
      <label>Owner<select value={params.get('owner') || ''} onChange={e => update({ owner: e.target.value, ownerId: '' })}><option value="">All Owners</option><option value="me">Assigned to me</option><option value="unassigned">Unassigned</option></select></label>
      <label>Scope<select value={params.get('scope') || ''} onChange={e => update({ scope: e.target.value })}><option value="">All Tickets</option><option value="active">Active Tickets</option></select></label>
      <label>Sort by<select value={params.get('sort') || 'createdAt'} onChange={e => update({ sort: e.target.value })}>{[['createdAt','Created'],['updatedAt','Last Updated'],['ticketNumber','Ticket Number'],['status','Status'],['itPriority','IT Priority'],['summary','Summary']].map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label>Sort order<select value={params.get('order') || 'desc'} onChange={e => update({ order: e.target.value })}><option value="desc">Descending</option><option value="asc">Ascending</option></select></label>
      {queryKey && <button type="button" onClick={() => { setInput(''); setParams({}) }}>Clear Filters</button>}
    </form>
    {queryKey && <p className="queue-query">Current filters: {Array.from(params).filter(([key]) => !['page','pageSize','sort','order'].includes(key)).map(([key,value]) => `${key}: ${value}`).join(' · ') || 'All Tickets'}</p>}
    {loading && <p role="status">Loading tickets...</p>}
    {error && <div role="alert"><p>{error}</p><button onClick={() => setRevision(n => n + 1)}>Retry tickets</button></div>}
    {result && !loading && !error && <section aria-label="Queue results">
      <p>{result.meta.totalItems} tickets found</p>
      {!result.data.length ? <p>No tickets found. {result.meta.totalItems > 0 ? 'Choose an earlier page.' : 'Try adjusting your search or filters.'}</p> : <div className="queue-table" role="region" aria-label="Ticket Queue table" tabIndex={0}>
        <table><thead><tr>{['Ticket','Category & System','Status & Priority','Owner','Created','Last Updated'].map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{result.data.map(t => <tr key={t.id}>
          <td><Link to={`/tickets/${t.id}`}>{t.ticketNumber}</Link><div>{t.summary}</div></td>
          <td>{t.category.name}<div>{t.relatedSystem.name}</div></td>
          <td>{t.status}<div>IT Priority: {t.itPriority || 'UNSET'}</div></td>
          <td>{t.owner?.name || 'Unassigned'}</td>
          <td>{new Date(t.createdAt).toLocaleString('en-GB',{timeZone:'Asia/Bangkok'})}</td>
          <td>{new Date(t.updatedAt).toLocaleString('en-GB',{timeZone:'Asia/Bangkok'})}</td>
        </tr>)}</tbody></table>
      </div>}
      <nav className="queue-pages" aria-label="Queue pages"><span>Page {page} of {totalPages || 1}</span><button disabled={page <= 1} onClick={() => update({page:'1'},false)}>First page</button><button disabled={page <= 1} onClick={() => update({page:String(Math.max(1,page - 1))},false)}>Previous page</button><button disabled={page >= totalPages} onClick={() => update({page:String(page + 1)},false)}>Next page</button><label>Tickets per page<select value={params.get('pageSize') || '10'} onChange={e => update({pageSize:e.target.value})}>{[10,25,50].map(n => <option key={n}>{n}</option>)}</select></label></nav>
    </section>}
  </div>
}
