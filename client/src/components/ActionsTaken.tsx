import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { ActionApiError, fetchActionById, fetchActions } from '../api/actions'
import type { ActionPage, ActionTaken } from '../api/actions'
import Modal from './Dialog'
import ActionDetails from './actions/ActionDetails'
import History from './actions/History'
import Editor from './actions/Editor'
import Pager from './actions/Pager'
import { active, formatTime, message, terminal } from './actions/presentation'
import './ActionsTaken.css'

export default function ActionsTaken({ ticketId, ticketStatus, ticketCreatedAt, workCycle, ticketVersion, linkedActionId, onDetailsClose, onChanged }: {
  ticketId: number; ticketStatus: string; ticketCreatedAt: string; workCycle?: number; ticketVersion?: number; linkedActionId?: string; onDetailsClose?: () => void; onChanged: () => void
}) {
  const { user } = useAuth()
  const [data, setData] = useState<ActionPage | null>(null)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [revision, setRevision] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editor, setEditor] = useState<{ action?: ActionTaken; predecessor?: ActionTaken } | null>(null)
  const [view, setView] = useState<ActionTaken | null>(null)
  const [linkError, setLinkError] = useState('')
  const [linkRevision, setLinkRevision] = useState(0)
  useEffect(() => {
    let live = true; setLinkError(''); setView(null)
    if (!linkedActionId) return
    if (!/^[1-9]\d*$/.test(linkedActionId) || !Number.isSafeInteger(Number(linkedActionId))) {
      setLinkError('Invalid action link. Open an action from its Ticket or My Actions.'); return
    }
    fetchActionById(ticketId, linkedActionId).then(result => { if (live) setView(result.data) }).catch(() => {
      if (live) setLinkError('Unable to open this action. It may be unavailable or you may need to sign in again.')
    })
    return () => { live = false }
  }, [ticketId, linkedActionId, linkRevision, user?.id])
  const newActionButton = useRef<HTMLButtonElement>(null)
  const restoreFocusAfterReload = useRef(false)
  const staff = user?.role === 'IT_STAFF' || user?.role === 'ADMIN'
  const writable = staff && active.includes(ticketStatus)
  useEffect(() => {
    if (!loading && restoreFocusAfterReload.current) { newActionButton.current?.focus(); restoreFocusAfterReload.current = false }
  }, [loading])
  useEffect(() => {
    let live = true; setLoading(true); setError('')
    fetchActions(ticketId, page, size).then(result => {
      if (!live) return
      if (result.meta.totalPages > 0 && page > result.meta.totalPages) { setPage(result.meta.totalPages); return }
      setData(result)
    }).catch(e => {
      if (!live) return
      setError(message(e))
      if (e instanceof ActionApiError && [401, 403, 404].includes(e.status)) { setData(null); setEditor(null); setView(null) }
    }).finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [ticketId, ticketStatus, ticketVersion, page, size, revision])
  return <section className="actions-section" aria-labelledby="actions-title" aria-busy={loading}>
    <div className="actions-toolbar"><h2 id="actions-title">Actions Taken</h2><button disabled={loading || Boolean(editor)} onClick={() => setRevision(n => n + 1)}>Refresh actions</button>
      {writable && <button ref={newActionButton} className="primary" disabled={loading || !data || Boolean(error)} onClick={() => setEditor({})}>New action</button>}</div>
    <p>Shared work records · Times shown in Asia/Bangkok · Ordered by work date/time, then ID.</p>
    {!staff && <p>Read-only: IT Staff record the work on your Ticket.</p>}
    {staff && !writable && <p>This Ticket is terminal. Actions and history remain read-only.</p>}
    <div role="status" aria-live="polite">{notice}{loading && <p>Loading actions...</p>}</div>
    {error && <div role="alert" className="action-error">{error}<button onClick={() => setRevision(n => n + 1)}>Retry actions</button></div>}
    {linkError && <div role="alert">Linked action unavailable. {linkError}<button onClick={() => setLinkRevision(n => n + 1)}>Retry linked action</button></div>}
    {data && <>
      {!data.data.length && !loading && !error && <p>No Actions Taken yet.</p>}
      <ol className="action-list">{data.data.map(action => <li className="action-card" id={`action-${action.id}`} key={action.id}>
        <div className="actions-toolbar"><strong>Action #{action.id} · Cycle {action.workCycle}</strong><span className="action-status">{action.status}</span></div>
        <p>{formatTime(action.actionDateTime)}</p><p>{action.description}</p><p>Result: {action.result || 'Not recorded'}</p>
        <p>Performed by: {action.performedBy.name} · Assigned to: {action.assignee.name}</p>
        <p>Follow-up required: {action.followUpRequired ? 'Yes' : 'No'}{action.followUpNote && ` — ${action.followUpNote}`}</p>
        {action.attachmentNotes && <p>Attachment notes: {action.attachmentNotes}</p>}
        {action.followsUpActionId && <p>Follows up action #{action.followsUpActionId}</p>}
        <div className="actions-toolbar"><button onClick={() => setView(action)}>Details and history #{action.id}</button>
          {writable && !terminal(action) && (workCycle === undefined || action.workCycle === workCycle) && <button disabled={loading || Boolean(error)} onClick={() => setEditor({ action })}>Edit action #{action.id}</button>}
          {writable && action.status === 'COMPLETED' && action.followUpRequired && (workCycle === undefined || action.workCycle === workCycle) && <button disabled={loading || Boolean(error)} onClick={() => setEditor({ predecessor: action })}>Add follow-up to #{action.id}</button>}
        </div>
      </li>)}</ol>
      <div className="actions-toolbar"><label htmlFor="actions-page-size">Actions per page</label><select id="actions-page-size" value={size} disabled={loading} onChange={e => { setSize(Number(e.target.value)); setPage(1) }}>{[10, 25, 50].map(n => <option key={n}>{n}</option>)}</select></div>
      <Pager meta={data.meta} change={setPage} disabled={loading} label="Actions pages" />
    </>}
    {view && <Modal title={`Action #${view.id}`} onClose={() => { setView(null); onDetailsClose?.() }} busy={false}><ActionDetails action={view} /><History ticketId={ticketId} actionId={view.id} /></Modal>}
    {editor && data && user && <Editor {...editor} actor={user} ticketId={ticketId} ticketCreatedAt={ticketCreatedAt} ticketVersion={data.ticketVersion} workCycle={workCycle} onClose={uncertain => { setEditor(null); if (uncertain) { restoreFocusAfterReload.current = true; setRevision(n => n + 1); onChanged() } }} onSaved={() => { setEditor(null); restoreFocusAfterReload.current = true; setNotice('Action saved.'); setRevision(n => n + 1); onChanged() }} />}
  </section>
}
