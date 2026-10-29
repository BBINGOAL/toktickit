import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { ActionApiError, createAction, fetchActions, fetchAssignees, updateAction } from '../../api/actions'
import type { ActionFields, ActionStatus, ActionTaken, Assignee, CreateAction, PageMeta, UpdateAction } from '../../api/actions'
import Modal from '../Dialog'
import ActionDetails from './ActionDetails'
import Pager from './Pager'
import { localTime, message, terminal } from './presentation'

interface Draft extends Omit<ActionFields, 'assigneeId'> { assigneeId: string; cancellationReason: string }
interface EditorProps {
  ticketId: number; ticketCreatedAt: string; ticketVersion: number; workCycle?: number
  action?: ActionTaken; predecessor?: ActionTaken; actor: { id: number; name: string }
  onClose: (uncertain?: boolean) => void; onSaved: () => void
}
export default function Editor({ ticketId, ticketCreatedAt, ticketVersion, workCycle, action, predecessor, actor, onClose, onSaved }: EditorProps) {
  const [current, setCurrent] = useState(action)
  const [version, setVersion] = useState(ticketVersion)
  const initial = (): Draft => ({ actionDateTime: localTime(action?.actionDateTime ?? new Date().toISOString()), description: action?.description ?? '', result: action?.result ?? '',
    assigneeId: String(action?.assignee.id ?? actor.id), followUpRequired: action?.followUpRequired ?? false, followUpNote: action?.followUpNote ?? '', attachmentNotes: action?.attachmentNotes ?? '', cancellationReason: '' })
  const [draft, setDraft] = useState<Draft>(initial)
  const [comparisonDraft, setComparisonDraft] = useState<Draft | null>(null)
  const [dirty, setDirty] = useState(false)
  const [pending, setPending] = useState(false)
  const lock = useRef(false)
  const [intent, setIntent] = useState<{ key: string; body: CreateAction | UpdateAction } | null>(null)
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
  const dismiss = () => {
    if (lock.current) return
    const warning = intent ? 'The previous request may already have succeeded. Close this draft and refresh the action list?' : 'Discard this unsaved action draft?'
    if ((!dirty && !intent) || window.confirm(warning)) onClose(Boolean(intent))
  }
  const change = <K extends keyof Draft>(key: K, value: Draft[K]) => { setDraft(d => ({ ...d, [key]: value })); setDirty(true) }
  const frozen = pending || Boolean(intent) || blocked || conflict
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
      setVersion(response.ticketVersion); setIntent(null); setConflict(false); setError(''); setErrors({})
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
    let request = intent
    if (!request) {
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
      request = { key: crypto.randomUUID(), body }
      setIntent(request)
    }
    lock.current = true; setPending(true)
    try {
      if (current) await updateAction(ticketId, current.id, request.body as UpdateAction, request.key)
      else await createAction(ticketId, request.body as CreateAction, request.key)
      setIntent(null); setDirty(false); onSaved()
    } catch (e) {
      setError(message(e))
      if (e instanceof ActionApiError) {
        setErrors(e.fieldErrors)
        if (e.status === 409) { setConflict(true); setConflictVersion(e.currentVersion); setIntent(null) }
        else if (e.status < 500) setIntent(null)
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
      <p id="action-timezone">Input timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}. Work records are displayed in Asia/Bangkok.</p>
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
        {intent ? <><button type="button" className="primary" disabled={pending} onClick={() => void submit()}>Retry same submission</button><button type="button" disabled={pending} onClick={() => {
          if (window.confirm('The previous request may have succeeded. Reload and check the action list before starting a new intent. Keep this draft?')) { setIntent(null); setConflict(true); setError('Reload current state and check for previously saved work before submitting a new intent.') }
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

