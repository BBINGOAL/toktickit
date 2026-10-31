import { useEffect, useId, useRef, useState } from 'react'
import { addComment, addNote, fetchComments, fetchNotes } from '../api'
import type { PublicComment } from '../api'

export default function TicketDiscussion({ ticketId, privateNotes = false }: { ticketId: number; privateNotes?: boolean }) {
  const [rows, setRows] = useState<PublicComment[]>([])
  const [draft, setDraft] = useState(''), [error, setError] = useState(''), [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true), [pending, setPending] = useState(false), [revision, setRevision] = useState(0)
  const lock = useRef(false), id = useId()
  const title = privateNotes ? 'Internal Notes (Staff Only)' : 'Public Comments'
  useEffect(() => {
    let live = true; setLoading(true); setError('')
    const load = privateNotes ? fetchNotes : fetchComments
    load(ticketId).then(data => { if (live) setRows(data) }).catch(() => {
      if (live) setError('Unable to load this discussion. Please retry.')
    }).finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [ticketId, privateNotes, revision])
  async function post() {
    if (lock.current || !draft.trim()) return
    lock.current = true; setPending(true); setError(''); setNotice('')
    try {
      const save = privateNotes ? addNote : addComment
      const added = await save(ticketId, draft)
      setRows(previous => [...previous, added]); setDraft(''); setNotice(privateNotes ? 'Note added.' : 'Comment posted.')
    } catch {
      setError('Unable to save this message. Your text has been kept. Check the discussion before retrying if the response was lost.')
    } finally { lock.current = false; setPending(false) }
  }
  return <section className={`ticket-discussion ${privateNotes ? 'private-discussion' : ''}`} aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`}>{title}</h2>
    {loading && <p role="status">Loading discussion...</p>}
    {error && <div role="alert" className="action-error">{error}<button disabled={loading} onClick={() => setRevision(n => n + 1)}>Reload discussion</button></div>}
    {!loading && !error && !rows.length && <p>{privateNotes ? 'No internal notes yet.' : 'No comments yet.'}</p>}
    <div className="discussion-messages">{rows.map(row => <article key={row.id}>
      <p><strong>{row.author.name}</strong> ({row.author.role}) · {new Date(row.createdAt).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' })} (Bangkok)</p>
      <p style={{ whiteSpace: 'pre-wrap' }}>{row.content}</p>
    </article>)}</div>
    <label htmlFor={`${id}-message`}>{privateNotes ? 'Internal note' : 'Public comment'}</label>
    <textarea id={`${id}-message`} value={draft} maxLength={5000} disabled={pending} placeholder={privateNotes ? 'Write an internal note...' : 'Write a comment...'} onChange={event => setDraft(event.target.value)} />
    <button className="btn btn-primary" disabled={pending || !draft.trim()} onClick={() => void post()}>{pending ? 'Posting...' : privateNotes ? 'Add Note' : 'Post Comment'}</button>
    {notice && <p role="status">{notice}</p>}
  </section>
}
