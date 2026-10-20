import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import { ActionApiError, createAction, fetchActionHistory, fetchActions, fetchAssignees, updateAction } from '../api/actions'
import type { ActionEvent, ActionFields, ActionPage, ActionStatus, ActionTaken, Assignee, CreateAction, PageMeta, UpdateAction } from '../api/actions'
import './ActionsTaken.css'

const active = ['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'REOPENED']
const terminal = (a: ActionTaken) => ['COMPLETED', 'CANCELLED'].includes(a.status)
const formatTime = (value: string) => new Date(value).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' }) + ' (Bangkok)'
function localTime(value: string) {
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 23)
}
const message = (error: unknown) => error instanceof ActionApiError ? error.message : 'Unable to load or save Actions Taken. Please retry.'

function Modal({ title, children, onClose, busy }: { title: string; children: ReactNode; onClose: () => void; busy: boolean }) {
  const panel = useRef<HTMLDivElement>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.focus()
    return () => { document.body.style.overflow = previousOverflow; trigger?.focus() }
  }, [])
  return <div className="action-backdrop"><div className="action-dialog" ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="action-dialog-title" aria-busy={busy} onKeyDown={event => {
    if (event.key === 'Escape') { event.stopPropagation(); if (!busy) close.current() }
    if (event.key !== 'Tab') return
    const nodes = Array.from(panel.current!.querySelectorAll<HTMLElement>('button, input, textarea, select, a[href], summary, [tabindex]'))
      .filter(node => !node.hasAttribute('disabled') && node.tabIndex >= 0 && !node.closest('[hidden]'))
      .filter(node => {
        const details = node.closest('details')
        return !details || details.open || (node.tagName === 'SUMMARY' && node.parentElement === details)
      })
    event.preventDefault()
    if (!nodes.length) return
    const index = nodes.indexOf(document.activeElement as HTMLElement)
    const next = index < 0 ? (event.shiftKey ? nodes.length - 1 : 0) : (index + (event.shiftKey ? -1 : 1) + nodes.length) % nodes.length
    nodes[next].focus()
  }}><div className="actions-toolbar"><h2 id="action-dialog-title">{title}</h2><button type="button" onClick={onClose} disabled={busy} style={{ marginLeft: 'auto' }}>Close</button></div>{children}</div></div>
}
function Pager({ meta, change, disabled = false, label }: { meta: PageMeta; change: (page: number) => void; disabled?: boolean; label: string }) {
  return <nav className="actions-toolbar" aria-label={label}>
    <span>{meta.totalItems} records · Page {meta.totalPages ? meta.page : 0} of {meta.totalPages}</span>
    <button type="button" disabled={disabled || meta.page <= 1} onClick={() => change(meta.page - 1)}>Previous</button>
    <button type="button" disabled={disabled || meta.page >= meta.totalPages} onClick={() => change(meta.page + 1)}>Next</button>
  </nav>
}
function History({ ticketId, actionId }: { ticketId: number; actionId: number }) {
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ data: ActionEvent[]; meta: PageMeta } | null>(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let live = true; setError(''); setData(null)
    fetchActionHistory(ticketId, actionId, page).then(result => { if (live) setData(result) }).catch(e => { if (live) setError(message(e)) })
    return () => { live = false }
  }, [ticketId, actionId, page, retry])
  const fields = ['description', 'result', 'assignee', 'status', 'followUpRequired', 'followUpNote', 'attachmentNotes', 'cancellationReason', 'actionDateTime']
  const historyValue = (key: string, value: unknown): string => {
    if (value === undefined) return 'Not recorded'
    if (value === null) return 'None'
    if (key === 'assignee' && typeof value === 'object' && 'name' in value) return String(value.name)
    if (key === 'actionDateTime' && typeof value === 'string') return formatTime(value)
    return String(value)
  }
  return <section aria-label="Action history"><h3>History (read-only)</h3>
    {error ? <div role="alert" className="action-error">{error}<button onClick={() => setRetry(n => n + 1)}>Retry history</button></div> : !data ? <p role="status">Loading history...</p> : <>
      {!data.data.length && <p>No history yet.</p>}
      <ol className="action-history">{data.data.map(event => <li key={event.id}>
        <strong>{event.kind}</strong> · {event.actor.name} · {formatTime(event.createdAt)}
        <ul>{fields.filter(key => event.after?.[key] !== undefined && JSON.stringify(event.before?.[key]) !== JSON.stringify(event.after[key])).map(key => <li key={key}>{key}: {historyValue(key, event.before?.[key])} → {historyValue(key, event.after[key])}</li>)}</ul>
      </li>)}</ol><Pager meta={data.meta} change={setPage} label="History pages" />
    </>}
  </section>
}
function ActionDetails({ action }: { action: ActionTaken }) {
  return <dl className="action-details">{Object.entries({
    'Work date/time': formatTime(action.actionDateTime), Description: action.description, Result: action.result || 'Not recorded',
    'Performed by': action.performedBy.name, Assignee: action.assignee.name, Status: action.status, 'Work cycle': action.workCycle,
    'Follow-up required': action.followUpRequired ? 'Yes' : 'No', 'Follow-up note': action.followUpNote || 'None',
    'Attachment notes': action.attachmentNotes || 'None', 'Follows up action': action.followsUpActionId ?? 'None',
    'Cancellation reason': action.cancellationReason || 'None', 'Recorded at': formatTime(action.createdAt),
  }).map(([label, value]) => <div key={label} style={{ display: 'contents' }}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
}

interface Draft extends Omit<ActionFields, 'assigneeId'> { assigneeId: string; cancellationReason: string }
interface EditorProps {
  ticketId: number; ticketCreatedAt: string; ticketVersion: number; workCycle?: number
  action?: ActionTaken; predecessor?: ActionTaken; actor: { id: number; name: string }
  onClose: () => void; onSaved: () => void
}
function Editor({ ticketId, ticketCreatedAt, ticketVersion, workCycle, action, predecessor, actor, onClose, onSaved }: EditorProps) {
  const [current, setCurrent] = useState(action)
  const [version, setVersion] = useState(ticketVersion)
  const initial = (): Draft => ({ actionDateTime: localTime(action?.actionDateTime ?? new Date().toISOString()), description: action?.description ?? '', result: action?.result ?? '',
    assigneeId: String(action?.assignee.id ?? actor.id), followUpRequired: action?.followUpRequired ?? false, followUpNote: action?.followUpNote ?? '', attachmentNotes: action?.attachmentNotes ?? '', cancellationReason: '' })
  const [draft, setDraft] = useState<Draft>(initial)
  const [comparisonDraft, setComparisonDraft] = useState<Draft | null>(null)
  const [dirty, setDirty] = useState(false)
  const [pending, setPending] = useState(false)
  const lock = useRef(false)
  const intent = useRef<{ key: string; body: CreateAction | UpdateAction } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState(false)
  const [conflictVersion, setConflictVersion] = useState<number | undefined>()
  const [blocked, setBlocked] = useState(false)
  const [search, setSearch] = useState('')
  const [assigneePage, setAssigneePage] = useState(1)
  const [choices, setChoices] = useState<{ data: Assignee[]; meta: PageMeta } | null>(null)
  const [choiceError, setChoiceError] = useState('')
  const [choiceRetry, setChoiceRetry] = useState(0)
  const summary = useRef<HTMLDivElement>(null)
  const selectedName = useRef({ id: draft.assigneeId, name: action?.assignee.name ?? actor.name })
  useEffect(() => {
    let live = true; setChoiceError(''); setChoices(null)
    const timer = window.setTimeout(() => {
      fetchAssignees(search, assigneePage).then(result => { if (live) setChoices(result) }).catch(e => { if (live) setChoiceError(message(e)) })
    }, 150)
    return () => { live = false; window.clearTimeout(timer) }
  }, [search, assigneePage, choiceRetry])
  const dismiss = () => { if (!lock.current && (!dirty || window.confirm('Discard this unsaved action draft?'))) onClose() }
  const change = <K extends keyof Draft>(key: K, value: Draft[K]) => { setDraft(d => ({ ...d, [key]: value })); setDirty(true) }
  const frozen = pending || Boolean(intent.current) || blocked || conflict
  async function reload() {
    if (lock.current) return
    lock.current = true; setPending(true)
    try {
      let response = await fetchActions(ticketId, 1, 50)
      if (current) {
        let found = response.data.find(a => a.id === current.id)
        for (let p = 2; !found && p <= response.meta.totalPages; p++) {
          const next = await fetchActions(ticketId, p, 50)
          found = next.data.find(a => a.id === current.id)
        }
        if (!found) { setBlocked(true); throw new Error('unavailable') }
        setCurrent(found)
        setBlocked(terminal(found))
      }
      setVersion(response.ticketVersion); intent.current = null; setConflict(false); setError(''); setErrors({})
      setChoiceRetry(n => n + 1)
    } catch (e) { setError(message(e)) }
    finally { lock.current = false; setPending(false) }
  }
  async function submit(status?: ActionStatus) {
    if (lock.current || conflict || blocked) return
    const fieldErrors: Record<string, string> = {}
    const date = new Date(draft.actionDateTime)
    if (!draft.actionDateTime || !Number.isFinite(date.getTime()) || date < new Date(ticketCreatedAt) || date > new Date()) fieldErrors.actionDateTime = 'Choose a time between Ticket creation and now.'
    if (!draft.description.trim()) fieldErrors.description = 'Enter an action description.'
    if (!draft.assigneeId) fieldErrors.assigneeId = 'Choose an active Staff or Administrator.'
    if (draft.followUpRequired && !draft.followUpNote.trim()) fieldErrors.followUpNote = 'Enter a follow-up note.'
    if (status === 'COMPLETED' && !draft.result.trim()) fieldErrors.result = 'Enter a result before completing.'
    if (status === 'CANCELLED' && !draft.cancellationReason.trim()) fieldErrors.cancellationReason = 'Enter a cancellation reason.'
    setErrors(fieldErrors); setError('')
    if (Object.keys(fieldErrors).length) { setError('Check the action fields below.'); queueMicrotask(() => summary.current?.focus()); return }
    if (!intent.current) {
      if (status === 'CANCELLED' && !window.confirm('Cancel this action? Its record and history will be kept.')) return
      const fields: ActionFields = { ...draft, actionDateTime: date.toISOString(), assigneeId: Number(draft.assigneeId) }
      // Explicit whitelist: cancellationReason must never leak into a create/ordinary edit payload.
      const { actionDateTime, description, result, assigneeId, followUpRequired, followUpNote, attachmentNotes } = fields
      const common = { actionDateTime, description: description.trim(), result: result.trim(), assigneeId, followUpRequired, followUpNote: followUpNote.trim(), attachmentNotes: attachmentNotes.trim(), expectedTicketVersion: version }
      const body: CreateAction | UpdateAction = current ? { ...common, expectedVersion: current.version, ...(status ? { status } : {}), ...(status === 'CANCELLED' ? { cancellationReason: draft.cancellationReason.trim() } : {}) } : { ...common, followsUpActionId: predecessor?.id ?? null }
      // Historical inactive assignments may still be edited/cancelled. Only an
      // intentional reassignment should send assigneeId; Start/Complete eligibility
      // is always rechecked by the server regardless of this omission.
      if (current && body.assigneeId === current.assignee.id) delete (body as UpdateAction).assigneeId
      intent.current = { key: crypto.randomUUID(), body }
    }
    lock.current = true; setPending(true)
    try {
      const request = intent.current
      if (current) await updateAction(ticketId, current.id, request.body as UpdateAction, request.key)
      else await createAction(ticketId, request.body as CreateAction, request.key)
      intent.current = null; setDirty(false); onSaved()
    } catch (e) {
      setError(message(e))
      if (e instanceof ActionApiError) {
        setErrors(e.fieldErrors)
        if (e.status === 409) { setConflict(true); setConflictVersion(e.currentVersion); intent.current = null }
        else if (e.status < 500) intent.current = null
        if ([401, 403, 404].includes(e.status)) setBlocked(true)
        if (e.fieldErrors.assigneeId) setChoiceRetry(n => n + 1)
      }
      queueMicrotask(() => summary.current?.focus())
    } finally { lock.current = false; setPending(false) }
  }
  const field = (key: keyof Draft, label: string, input: ReactNode) => <div className="action-field"><label htmlFor={`action-${key}`}>{label}</label>{input}{errors[key] && <small id={`action-${key}-error`}>{errors[key]}</small>}</div>
  const accessibility = (key: keyof Draft) => ({ id: `action-${key}`, 'aria-invalid': Boolean(errors[key]), 'aria-describedby': errors[key] ? `action-${key}-error` : undefined, disabled: frozen })
  return <Modal title={current ? `Edit action #${current.id}` : 'New Action Taken'} onClose={dismiss} busy={pending}>
    <p>Performed by (automatic): <strong>{current?.performedBy.name ?? actor.name}</strong> · Work cycle: {current?.workCycle ?? workCycle ?? 'Assigned by server'}</p>
    {predecessor && <p>Follow-up to action #{predecessor.id}: {predecessor.description}</p>}
    {current && <p>Current status: <strong>{current.status}</strong> · Action version {current.version} · Ticket version {version}</p>}
    {error && <div ref={summary} tabIndex={-1} role="alert" className="action-error">{error}{conflict && <p>Current server version: {conflictVersion ?? 'reload to inspect'}. Your draft has been kept.</p>}</div>}
    {conflict && <button disabled={pending} onClick={reload}>Reload current state (keep draft)</button>}
    {blocked && <p>This action is no longer editable or accessible. Your unsaved draft is shown below.</p>}
    {current && <details><summary>Compare with current saved action</summary><ActionDetails action={current} />
      <button type="button" disabled={frozen} onClick={() => {
        if (!window.confirm('Load the saved action into the form? Your previous draft will remain available for comparison.')) return
        setComparisonDraft({ ...draft })
        setDraft({ actionDateTime: localTime(current.actionDateTime), description: current.description, result: current.result, assigneeId: String(current.assignee.id), followUpRequired: current.followUpRequired, followUpNote: current.followUpNote, attachmentNotes: current.attachmentNotes, cancellationReason: '' })
        selectedName.current = { id: String(current.assignee.id), name: current.assignee.name }
        setDirty(true); setErrors({})
      }}>Load saved values into form</button>
    </details>}
    {comparisonDraft && <details><summary>Previous unsaved draft (kept for comparison)</summary><dl className="action-details">{Object.entries(comparisonDraft).map(([key, value]) => <div style={{ display: 'contents' }} key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>)}</dl><button type="button" disabled={frozen} onClick={() => { setDraft({ ...comparisonDraft }); setDirty(true) }}>Restore previous draft</button></details>}
    <form noValidate onSubmit={(event: FormEvent) => { event.preventDefault(); void submit() }}>
      <div className="action-form-grid">
        {field('actionDateTime', 'Action date/time (your local timezone)', <input type="datetime-local" step="0.001" {...accessibility('actionDateTime')} value={draft.actionDateTime} onChange={e => change('actionDateTime', e.target.value)} />)}
        <div className="action-field"><label htmlFor="assignee-search">Find active assignee by name</label><input className="assignee-search" id="assignee-search" disabled={pending} value={search} maxLength={100} onChange={e => { setSearch(e.target.value); setAssigneePage(1) }} />
          {choiceError ? <div role="alert">{choiceError}<button type="button" onClick={() => setChoiceRetry(n => n + 1)}>Retry assignees</button></div> : !choices ? <p role="status">Loading assignees...</p> : <Pager meta={choices.meta} change={setAssigneePage} disabled={pending} label="Assignee pages" />}
          {field('assigneeId', 'Assignee', <select {...accessibility('assigneeId')} value={draft.assigneeId} onChange={e => {
            const choice = choices?.data.find(a => String(a.id) === e.target.value)
            if (choice) selectedName.current = { id: String(choice.id), name: choice.name }
            change('assigneeId', e.target.value)
          }}>
            {!choices?.data.some(a => String(a.id) === draft.assigneeId) && <option value={draft.assigneeId}>{selectedName.current.name} (saved selection; eligibility checked on save)</option>}
            {choices?.data.map(a => <option value={a.id} key={a.id}>{a.name} ({a.role})</option>)}
          </select>)}
        </div>
      </div>
      {field('description', 'Action description', <textarea {...accessibility('description')} maxLength={2000} value={draft.description} onChange={e => change('description', e.target.value)} />)}
      {field('result', 'Result', <textarea {...accessibility('result')} maxLength={2000} value={draft.result} onChange={e => change('result', e.target.value)} />)}
      <div className="action-field"><label><input type="checkbox" disabled={frozen} checked={draft.followUpRequired} onChange={e => change('followUpRequired', e.target.checked)} /> Follow-up required?</label></div>
      {field('followUpNote', draft.followUpRequired ? 'Follow-up note (required)' : 'Follow-up note', <textarea {...accessibility('followUpNote')} maxLength={2000} value={draft.followUpNote} onChange={e => change('followUpNote', e.target.value)} />)}
      {field('attachmentNotes', 'Attachment notes (existing Ticket files)', <textarea {...accessibility('attachmentNotes')} maxLength={1000} value={draft.attachmentNotes} onChange={e => change('attachmentNotes', e.target.value)} />)}
      {current && field('cancellationReason', 'Cancellation reason (required to cancel)', <textarea {...accessibility('cancellationReason')} maxLength={1000} value={draft.cancellationReason} onChange={e => change('cancellationReason', e.target.value)} />)}
      <div className="actions-toolbar">
        {intent.current ? <><button type="button" className="primary" disabled={pending} onClick={() => void submit()}>Retry same submission</button><button type="button" disabled={pending} onClick={() => {
          if (window.confirm('The previous request may have succeeded. Reload and check the action list before starting a new intent. Keep this draft?')) { intent.current = null; setConflict(true); setError('Reload current state and check for previously saved work before submitting a new intent.') }
        }}>Review uncertain submission</button></> : <>
          <button type="submit" className="primary" disabled={frozen}>{pending ? 'Saving...' : current ? 'Save changes' : 'Create action'}</button>
          {current?.status === 'PLANNED' && <button type="button" disabled={frozen} onClick={() => void submit('IN_PROGRESS')}>Start action</button>}
          {current?.status === 'IN_PROGRESS' && <button type="button" disabled={frozen} onClick={() => void submit('COMPLETED')}>Complete action</button>}
          {current && !terminal(current) && <button type="button" disabled={frozen} onClick={() => void submit('CANCELLED')}>Cancel action</button>}
        </>}
      </div>
    </form>
  </Modal>
}

export default function ActionsTaken({ ticketId, ticketStatus, ticketCreatedAt, workCycle, onChanged }: {
  ticketId: number; ticketStatus: string; ticketCreatedAt: string; workCycle?: number; onChanged: () => void
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
  const staff = user?.role === 'IT_STAFF' || user?.role === 'ADMIN'
  const writable = staff && active.includes(ticketStatus)
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
  }, [ticketId, ticketStatus, page, size, revision])
  return <section className="actions-section" aria-labelledby="actions-title" aria-busy={loading}>
    <div className="actions-toolbar"><h2 id="actions-title">Actions Taken</h2><button disabled={loading || Boolean(editor)} onClick={() => setRevision(n => n + 1)}>Refresh actions</button>
      {writable && <button className="primary" disabled={loading || !data || Boolean(error)} onClick={() => setEditor({})}>New action</button>}</div>
    <p>Shared work records · Times shown in Asia/Bangkok · Ordered by work date/time, then ID.</p>
    {!staff && <p>Read-only: IT Staff record the work on your Ticket.</p>}
    {staff && !writable && <p>This Ticket is terminal. Actions and history remain read-only.</p>}
    <div role="status" aria-live="polite">{notice}{loading && <p>Loading actions...</p>}</div>
    {error && <div role="alert" className="action-error">{error}<button onClick={() => setRevision(n => n + 1)}>Retry actions</button></div>}
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
    {view && <Modal title={`Action #${view.id}`} onClose={() => setView(null)} busy={false}><ActionDetails action={view} /><History ticketId={ticketId} actionId={view.id} /></Modal>}
    {editor && data && user && <Editor {...editor} actor={user} ticketId={ticketId} ticketCreatedAt={ticketCreatedAt} ticketVersion={data.ticketVersion} workCycle={workCycle} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); setNotice('Action saved.'); setRevision(n => n + 1); onChanged() }} />}
  </section>
}
