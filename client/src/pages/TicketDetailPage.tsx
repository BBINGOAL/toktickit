import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
    fetchTicketDetail, uploadAttachment, downloadAttachment, removeAttachment,
    fetchComments, addComment, fetchNotes, addNote,
    updateTicketStatus, updateTicketPriority, updateTicketOwner
} from '../api'
import type { TicketDetail, Attachment, PublicComment, InternalNote } from '../api'

function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function PriorityBadge({ value }: { value?: string | null }) {
    if (!value) return <span style={{ color: '#9CA3AF' }}>—</span>
    let color = '#374151', bg = '#F3F4F6'
    if (value === 'HIGH') { color = '#991B1B'; bg = '#FEF2F2' }
    if (value === 'MEDIUM') { color = '#92400E'; bg = '#FEF3C7' }
    if (value === 'LOW') { color = '#065F46'; bg = '#D1FAE5' }
    return (
        <span style={{ background: bg, color, padding: '2px 8px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600 }}>
            {value}
        </span>
    )
}

function AttachmentRow({ att, onRemoved, onDownload }: {
    att: Attachment
    onRemoved: (id: number, updated: Attachment) => void
    onDownload: (att: Attachment) => void
}) {
    const [showDialog, setShowDialog] = useState(false)
    const [removing, setRemoving] = useState(false)
    const [reason, setReason] = useState('')

    async function handleConfirmRemove() {
        setRemoving(true)
        try {
            const updated = await removeAttachment(att.id, reason)
            onRemoved(att.id, updated)
        } finally {
            setRemoving(false)
            setShowDialog(false)
        }
    }

    const isRemoved = att.isRemoved
    return (
        <>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: '1px solid #F3F4F6', opacity: isRemoved ? 0.65 : 1 }}>
                <div style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 8, background: isRemoved ? '#F3F4F6' : '#EAF6EF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: isRemoved ? '#9CA3AF' : '#006B3C' }}>
                    {isRemoved ? '🗑️' : '📄'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, color: isRemoved ? '#9CA3AF' : '#111827', wordBreak: 'break-all' }}>{att.originalFilename}</span>
                        <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>{(att.sizeBytes / 1024).toFixed(1)} KB</span>
                        {isRemoved && <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '2px 6px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700 }}>REMOVED</span>}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                        Uploaded {formatDate(att.createdAt)}
                        {isRemoved && att.removedAt && (
                            <div style={{ marginTop: 4, color: '#DC2626' }}>
                                Removed on {formatDate(att.removedAt)}<br />
                                Reason: <span style={{ fontWeight: 500 }}>{att.removalReason}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {!isRemoved && (
                        <>
                            <button onClick={() => onDownload(att)} style={{ background: '#F3F4F6', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, color: '#374151' }}>Download</button>
                            <button onClick={() => setShowDialog(true)} style={{ background: '#FEF2F2', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, color: '#DC2626' }}>Remove</button>
                        </>
                    )}
                </div>
            </div>
            {showDialog && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 16 }}>
                    <div style={{ background: 'white', padding: 24, borderRadius: 12, width: '100%', maxWidth: 400, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                        <h4 style={{ margin: '0 0 16px', fontSize: '1.1rem' }}>Remove Attachment</h4>
                        <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: '#4B5563' }}>Please provide a reason for removing <strong>{att.originalFilename}</strong>:</p>
                        <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Uploaded wrong file" style={{ width: '100%', padding: '8px 12px', boxSizing: 'border-box', border: '1px solid #D1D5DB', borderRadius: 6, marginBottom: 20 }} autoFocus />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            <button onClick={() => setShowDialog(false)} disabled={removing} style={{ background: '#F3F4F6', padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                            <button onClick={handleConfirmRemove} disabled={!reason.trim() || removing} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: !reason.trim() || removing ? '#FCA5A5' : '#DC2626', color: 'white', cursor: !reason.trim() || removing ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                                {removing ? 'Removing…' : 'Confirm Remove'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

function CommentSection({ ticketId }: { ticketId: number }) {
    const [comments, setComments] = useState<PublicComment[]>([])
    const [newComment, setNewComment] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchComments(ticketId).then(setComments).catch(console.error)
    }, [ticketId])

    async function handleAddComment() {
        if (!newComment.trim()) return
        setLoading(true)
        try {
            const added = await addComment(ticketId, newComment)
            setComments([...comments, added])
            setNewComment('')
        } finally { setLoading(false) }
    }

    return (
        <div style={{ marginTop: 24, padding: 24, background: 'white', border: '1px solid #E5E7EB', borderRadius: 12 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700 }}>Public Comments</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16, maxHeight: 300, overflowY: 'auto' }}>
                {comments.length === 0 && <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>No comments yet.</p>}
                {comments.map(c => (
                    <div key={c.id} style={{ background: '#F9FAFB', padding: 12, borderRadius: 8 }}>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: 4 }}>
                            <strong>{c.author.name}</strong> ({c.author.role}) • {formatDate(c.createdAt)}
                        </div>
                        <div style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{c.content}</div>
                    </div>
                ))}
            </div>
            <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Write a comment..." style={{ width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 8, border: '1px solid #D1D5DB', minHeight: 80, marginBottom: 12 }} />
            <button onClick={handleAddComment} disabled={loading || !newComment.trim()} style={{ background: '#006B3C', color: 'white', padding: '8px 16px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' }}>{loading ? 'Posting...' : 'Post Comment'}</button>
        </div>
    )
}

function NoteSection({ ticketId }: { ticketId: number }) {
    const [notes, setNotes] = useState<InternalNote[]>([])
    const [newNote, setNewNote] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchNotes(ticketId).then(setNotes).catch(console.error)
    }, [ticketId])

    async function handleAddNote() {
        if (!newNote.trim()) return
        setLoading(true)
        try {
            const added = await addNote(ticketId, newNote)
            setNotes([...notes, added])
            setNewNote('')
        } finally { setLoading(false) }
    }

    return (
        <div style={{ marginTop: 24, padding: 24, background: '#FEFCE8', border: '1px solid #FEF08A', borderRadius: 12 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: '#854D0E' }}>Internal Notes (Staff Only)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16, maxHeight: 300, overflowY: 'auto' }}>
                {notes.length === 0 && <p style={{ color: '#A16207', fontSize: '0.875rem' }}>No internal notes yet.</p>}
                {notes.map(n => (
                    <div key={n.id} style={{ background: '#FEF9C3', padding: 12, borderRadius: 8 }}>
                        <div style={{ fontSize: '0.75rem', color: '#A16207', marginBottom: 4 }}>
                            <strong>{n.author.name}</strong> • {formatDate(n.createdAt)}
                        </div>
                        <div style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap', color: '#713F12' }}>{n.content}</div>
                    </div>
                ))}
            </div>
            <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Write an internal note..." style={{ width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 8, border: '1px solid #FDE047', background: 'white', minHeight: 80, marginBottom: 12 }} />
            <button onClick={handleAddNote} disabled={loading || !newNote.trim()} style={{ background: '#CA8A04', color: 'white', padding: '8px 16px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' }}>{loading ? 'Saving...' : 'Add Note'}</button>
        </div>
    )
}

export default function TicketDetailPage() {
    const { id } = useParams()
    const { user } = useAuth()
    const [ticket, setTicket] = useState<TicketDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        if (!user || !id) return
        setLoading(true)
        fetchTicketDetail(parseInt(id))
            .then(setTicket)
            .catch(() => setError('Failed to load ticket. It may not exist or you may not have access.'))
            .finally(() => setLoading(false))
    }, [id, user])

    async function handleAttachmentFile(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0 || !ticket || !user) return
        const file = e.target.files[0]
        setUploadError(null)
        setUploading(true)
        try {
            const newAtt = await uploadAttachment(ticket.id, file)
            setTicket(prev => prev ? { ...prev, attachments: [...prev.attachments, newAtt] } : null)
        } catch (err: unknown) {
            setUploadError(err instanceof Error ? err.message : 'Upload failed')
        } finally {
            setUploading(false)
            e.target.value = ''
        }
    }

    function handleRemoved(attachmentId: number, updatedAttachment: Attachment) {
        setTicket(prev => {
            if (!prev) return prev
            const nextAtts = prev.attachments.map(a => a.id === attachmentId ? updatedAttachment : a)
            return { ...prev, attachments: nextAtts }
        })
    }

    async function handleDownload(att: Attachment) {
        try {
            await downloadAttachment(att.id, att.originalFilename)
        } catch { alert('Failed to download file.') }
    }

    async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
        if (!ticket) return;
        const newStatus = e.target.value;
        try {
            await updateTicketStatus(ticket.id, newStatus);
            setTicket({ ...ticket, status: newStatus });
        } catch { alert('Failed to update status'); }
    }

    async function handlePriorityChange(e: React.ChangeEvent<HTMLSelectElement>) {
        if (!ticket) return;
        const newPri = e.target.value;
        try {
            await updateTicketPriority(ticket.id, newPri);
            setTicket({ ...ticket, itPriority: newPri });
        } catch { alert('Failed to update priority'); }
    }

    async function handleAssignToMe() {
        if (!ticket || !user) return;
        try {
            await updateTicketOwner(ticket.id, user.id);
            setTicket({ ...ticket, owner: { id: user.id, name: user.name } });
        } catch { alert('Failed to assign owner'); }
    }

    if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Loading ticket...</div>
    if (error || !ticket) return <div style={{ padding: 40, textAlign: 'center', color: '#DC2626' }}>{error}</div>

    const activeAttachments = ticket.attachments.filter(a => !a.isRemoved)
    const atLimit = activeAttachments.length >= 5
    const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' as const, marginBottom: 4 }
    const fieldStyle = { fontSize: '0.95rem', color: '#111827', fontWeight: 500 }
    const isStaff = user?.role === 'IT_STAFF' || user?.role === 'ADMIN';

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
            <div style={{ marginBottom: 20, fontSize: '0.875rem', color: '#9CA3AF' }}>
                <Link to={isStaff ? "/staff/tickets" : "/tickets"} style={{ color: '#006B3C', textDecoration: 'none', fontWeight: 600 }}>{isStaff ? "Ticket Queue" : "My Tickets"}</Link>
                <span style={{ margin: '0 8px' }}>›</span>
                <span>Ticket Detail</span>
            </div>

            {isStaff && (
                <div style={{ background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: 12, padding: '16px 24px', marginBottom: 20, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div>
                        <span style={{ ...labelStyle, color: '#4B5563' }}>Update Status</span>
                        <select value={ticket.status} onChange={handleStatusChange} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #9CA3AF' }}>
                            <option value="DRAFT">DRAFT</option>
                            <option value="OPEN">OPEN</option>
                            <option value="IN_PROGRESS">IN_PROGRESS</option>
                            <option value="RESOLVED">RESOLVED</option>
                            <option value="CLOSED">CLOSED</option>
                            <option value="CANCELLED">CANCELLED</option>
                        </select>
                    </div>
                    <div>
                        <span style={{ ...labelStyle, color: '#4B5563' }}>IT Priority</span>
                        <select value={ticket.itPriority || ''} onChange={handlePriorityChange} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #9CA3AF' }}>
                            <option value="">Unassigned</option>
                            <option value="LOW">LOW</option>
                            <option value="MEDIUM">MEDIUM</option>
                            <option value="HIGH">HIGH</option>
                        </select>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                        <span style={{ ...labelStyle, color: '#4B5563' }}>Owner</span>
                        {ticket.owner ? (
                            <div style={{ fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                                {ticket.owner.name}
                                {ticket.owner.id !== user.id && (
                                    <button onClick={handleAssignToMe} style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}>Take Over</button>
                                )}
                            </div>
                        ) : (
                            <button onClick={handleAssignToMe} style={{ background: '#006B3C', color: 'white', border: 'none', padding: '6px 16px', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>Assign to me</button>
                        )}
                    </div>
                </div>
            )}

            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ background: '#006B3C', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ color: '#A7F3D0', fontSize: '0.75rem', fontWeight: 600, marginBottom: 4 }}>TICKET DETAIL</div>
                        <div style={{ color: 'white', fontWeight: 800, fontSize: '1.25rem' }}>{ticket.ticketNumber}</div>
                    </div>
                    <span style={{ background: '#EAF6EF', color: '#006B3C', padding: '4px 16px', borderRadius: 999, fontWeight: 700, fontSize: '0.8rem' }}>{ticket.status}</span>
                </div>
                <div style={{ padding: 24 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 20 }}>
                        {[
                            { label: 'Ticket Date', value: formatDate(ticket.createdAt) },
                            { label: 'Requester', value: ticket.requester.name },
                            { label: 'Category', value: ticket.category.name },
                            { label: 'Related System', value: ticket.relatedSystem.name },
                            { label: 'Ticket Owner', value: ticket.owner?.name ?? '—' },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <span style={labelStyle}>{label}</span>
                                <div style={fieldStyle}>{value}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 20, marginBottom: 20 }}>
                        <div><span style={labelStyle}>Requested Priority</span><div style={fieldStyle}><PriorityBadge value={ticket.requestedPriority} /></div></div>
                        <div><span style={labelStyle}>IT Priority</span><div style={fieldStyle}><PriorityBadge value={ticket.itPriority} /></div></div>
                        <div><span style={labelStyle}>Current Status</span><div style={fieldStyle}><span style={{ background: '#EAF6EF', color: '#006B3C', padding: '2px 10px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700 }}>{ticket.status}</span></div></div>
                        <div><span style={labelStyle}>Last Updated</span><div style={fieldStyle}>{formatDate(ticket.updatedAt)}</div></div>
                    </div>
                    <div style={{ marginBottom: 16 }}><span style={labelStyle}>Summary</span><div style={fieldStyle}>{ticket.summary}</div></div>
                    <div><span style={labelStyle}>Description</span><div style={{ ...fieldStyle, whiteSpace: 'pre-wrap', minHeight: 80 }}>{ticket.description}</div></div>
                </div>
            </div>

            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Attachments <span style={{ marginLeft: 8, background: '#F3F4F6', color: '#6B7280', fontSize: '0.75rem', padding: '2px 8px', borderRadius: 999 }}>{activeAttachments.length}/5 active</span></h3>
                    <div>
                        {atLimit ? (
                            <span style={{ fontSize: '0.8rem', color: '#DC2626', fontWeight: 600 }}>⚠ 5-attachment limit reached</span>
                        ) : (
                            <label style={{ background: uploading ? '#A7F3D0' : '#006B3C', color: 'white', padding: '7px 16px', borderRadius: 8, cursor: uploading ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'inline-block' }}>
                                {uploading ? 'Uploading…' : '+ Add Attachment'}
                                <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" style={{ display: 'none' }} onChange={handleAttachmentFile} disabled={uploading} />
                            </label>
                        )}
                    </div>
                </div>
                <div style={{ padding: '0 24px' }}>
                    {uploadError && <div style={{ margin: '12px 0', padding: '10px 14px', background: '#FEF2F2', color: '#991B1B', borderRadius: 8, fontSize: '0.875rem', border: '1px solid #FECACA' }}>{uploadError}</div>}
                    {ticket.attachments.length === 0 && <div style={{ padding: '32px 0', textAlign: 'center', color: '#9CA3AF' }}><div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📎</div><p style={{ fontSize: '0.875rem' }}>No attachments yet.</p></div>}
                    {ticket.attachments.map(att => <AttachmentRow key={att.id} att={att} onRemoved={handleRemoved} onDownload={handleDownload} />)}
                </div>
            </div>

            <CommentSection ticketId={ticket.id} />
            {isStaff && <NoteSection ticketId={ticket.id} />}
        </div>
    )
}
