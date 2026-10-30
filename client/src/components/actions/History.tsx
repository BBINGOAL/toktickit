import { useEffect, useState } from 'react'
import { fetchActionHistory } from '../../api/actions'
import type { ActionEvent, PageMeta } from '../../api/actions'
import { formatTime, message } from './presentation'
import Pager from './Pager'

export default function History({ ticketId, actionId }: { ticketId: number; actionId: number }) {
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
