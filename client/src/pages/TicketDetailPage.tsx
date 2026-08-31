import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { fetchTicketDetail, uploadAttachment, downloadAttachment, removeAttachment } from '../api'
import type { TicketDetail, Attachment } from '../api'
import { useRequester } from '../context/RequesterContext'

const PRIORITY_COLORS: Record<string, { bg: string; color: string }> = {
    LOW: { bg: '#EAF6EF', color: '#006B3C' },
    MEDIUM: { bg: '#FEF3C7', color: '#92400E' },
    HIGH: { bg: '#FEE2E2', color: '#991B1B' },
}

function PriorityBadge({ value }: { value?: string | null }) {
    if (!value) return <span style={{ color: '#9CA3AF' }}>—</span>
    const c = PRIORITY_COLORS[value] ?? { bg: '#F3F4F6', color: '#374151' }
    return (
        <span style={{ background: c.bg, color: c.color, padding: '3px 12px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700 }}>
            {value}
        </span>
    )
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_SIZE = 5 * 1024 * 1024

// ─── Remove Dialog ────────────────────────────────────────
function RemoveDialog({ attachment, onConfirm, onCancel, loading }: {
    attachment: Attachment
    onConfirm: (reason: string) => void
    onCancel: () => void
    loading: boolean
}) {
    const [reason, setReason] = useState('')
    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
            <div style={{
                background: 'white', borderRadius: 12, padding: 28,
                width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            }}>
                <h3 style={{ margin: '0 0 8px', color: '#991B1B', fontSize: '1.1rem' }}>Remove Attachment</h3>
                <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: 16 }}>
                    Removing <strong>"{attachment.originalFilename}"</strong>. This action cannot be undone. The file record will be retained but the file will no longer be downloadable.
                </p>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    Removal Reason <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Enter reason for removal…"
                    rows={3}
                    style={{
                        width: '100%', boxSizing: 'border-box', padding: '8px 12px',
                        border: '1px solid #D1D5DB', borderRadius: 8, fontSize: '0.875rem',
                        resize: 'vertical', outline: 'none', fontFamily: 'inherit',
                    }}
                />
                <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
                    <button onClick={onCancel} disabled={loading} style={{
                        padding: '8px 16px', borderRadius: 8, border: '1px solid #D1D5DB',
                        background: 'white', cursor: 'pointer', fontSize: '0.875rem', color: '#374151',
                    }}>Cancel</button>
                    <button
                        onClick={() => onConfirm(reason)}
                        disabled={!reason.trim() || loading}
                        style={{
                            padding: '8px 16px', borderRadius: 8, border: 'none',
                            background: !reason.trim() || loading ? '#FCA5A5' : '#DC2626',
                            color: 'white', cursor: !reason.trim() || loading ? 'not-allowed' : 'pointer',
                            fontWeight: 600, fontSize: '0.875rem',
                        }}
                    >
                        {loading ? 'Removing…' : 'Confirm Remove'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Attachment Row ────────────────────────────────────────
function AttachmentRow({ att, requesterId, onRemoved, onDownload }: {
    att: Attachment
    requesterId: number
    onRemoved: (id: number, updated: Attachment) => void
    onDownload: (att: Attachment) => void
}) {
    const [showDialog, setShowDialog] = useState(false)
    const [removing, setRemoving] = useState(false)

    async function handleConfirmRemove(reason: string) {
        setRemoving(true)
        try {
            const updated = await removeAttachment(requesterId, att.id, reason)
            onRemoved(att.id, updated)
        } finally {
            setRemoving(false)
            setShowDialog(false)
        }
    }

    const isRemoved = att.isRemoved

    return (
        <>
            <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0',
                borderBottom: '1px solid #F3F4F6',
                opacity: isRemoved ? 0.65 : 1,
            }}>
                {/* Icon */}
                <div style={{
                    width: 36, height: 36, flexShrink: 0, borderRadius: 8,
                    background: isRemoved ? '#F3F4F6' : '#EAF6EF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1rem', color: isRemoved ? '#9CA3AF' : '#006B3C',
                }}>
                    {att.mimeType === 'application/pdf' ? '📄' : '🖼️'}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontWeight: 600, fontSize: '0.875rem',
                        color: isRemoved ? '#9CA3AF' : '#111827',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        {att.originalFilename}
                        {isRemoved && (
                            <span style={{ marginLeft: 8, background: '#FEE2E2', color: '#991B1B', fontSize: '0.7rem', padding: '1px 8px', borderRadius: 999, fontWeight: 700 }}>
                                REMOVED
                            </span>
                        )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: 2 }}>
                        {formatSize(att.sizeBytes)} · {formatDate(att.createdAt)}
                    </div>
                    {isRemoved && att.removalReason && (
                        <div style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: 4, fontStyle: 'italic' }}>
                            Removal reason: {att.removalReason}
                        </div>
                    )}
                </div>

                {/* Actions */}
                {!isRemoved && (
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button
                            onClick={() => onDownload(att)}
                            title="Download"
                            style={{
                                padding: '5px 12px', borderRadius: 6, border: '1px solid #D1D5DB',
                                background: 'white', cursor: 'pointer', fontSize: '0.8rem', color: '#374151',
                            }}
                        >
                            ⬇ Download
                        </button>
                        <button
                            onClick={() => setShowDialog(true)}
                            title="Remove"
                            style={{
                                padding: '5px 12px', borderRadius: 6, border: '1px solid #FCA5A5',
                                background: '#FFF5F5', cursor: 'pointer', fontSize: '0.8rem', color: '#DC2626',
                            }}
                        >
                            🗑 Remove
                        </button>
                    </div>
                )}
            </div>

            {showDialog && (
                <RemoveDialog
                    attachment={att}
                    onConfirm={handleConfirmRemove}
                    onCancel={() => setShowDialog(false)}
                    loading={removing}
                />
            )}
        </>
    )
}

// ─── Main Page ─────────────────────────────────────────────
export default function TicketDetailPage() {
    const { id } = useParams<{ id: string }>()
    const { requester } = useRequester()
    const navigate = useNavigate()

    const [ticket, setTicket] = useState<TicketDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // upload state
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        if (!requester || !id) return
        setLoading(true)
        setError(null)
        fetchTicketDetail(requester.id, parseInt(id))
            .then(setTicket)
            .catch(() => setError('Failed to load ticket. It may not exist or you may not have access.'))
            .finally(() => setLoading(false))
    }, [requester, id])

    function handleAttachmentFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return
        if (!ALLOWED_TYPES.includes(file.type)) {
            setUploadError('Invalid file type. Allowed: JPG, PNG, WEBP, PDF.')
            return
        }
        if (file.size > MAX_SIZE) {
            setUploadError('File exceeds 5 MB limit.')
            return
        }
        handleUpload(file)
    }

    async function handleUpload(file: File) {
        if (!requester || !ticket) return
        setUploading(true)
        setUploadError(null)
        try {
            const newAtt = await uploadAttachment(requester.id, ticket.id, file)
            setTicket(prev => prev ? { ...prev, attachments: [...prev.attachments, newAtt] } : prev)
        } catch (err: unknown) {
            setUploadError(err instanceof Error ? err.message : 'Failed to upload file.')
        } finally {
            setUploading(false)
        }
    }

    function handleRemoved(id: number, updated: Attachment) {
        setTicket(prev => {
            if (!prev) return prev
            return { ...prev, attachments: prev.attachments.map(a => a.id === id ? updated : a) }
        })
    }

    async function handleDownload(att: Attachment) {
        if (!requester) return
        try {
            await downloadAttachment(requester.id, att.id, att.originalFilename)
        } catch {
            alert('Failed to download file.')
        }
    }

    const activeAttachments = ticket?.attachments.filter(a => !a.isRemoved) ?? []
    const atLimit = activeAttachments.length >= 5

    const fieldStyle: React.CSSProperties = {
        background: '#F9FAF9',
        border: '1px solid #E5E7EB',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: '0.875rem',
        color: '#374151',
        minHeight: 36,
    }

    const labelStyle: React.CSSProperties = {
        fontSize: '0.75rem',
        fontWeight: 700,
        color: '#6B7280',
        marginBottom: 4,
        display: 'block',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    }

    if (loading) return (
        <div style={{ padding: 48, textAlign: 'center', color: '#9CA3AF' }}>
            <div style={{ display: 'inline-block', width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#006B3C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ marginTop: 12 }}>Loading ticket…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )

    if (error || !ticket) return (
        <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>⚠️</div>
            <h3 style={{ color: '#991B1B', marginBottom: 8 }}>Access Denied or Not Found</h3>
            <p style={{ color: '#9CA3AF', marginBottom: 24 }}>{error}</p>
            <button onClick={() => navigate('/tickets')} style={{
                background: '#006B3C', color: 'white', border: 'none',
                padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600,
            }}>← Back to My Tickets</button>
        </div>
    )

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
            {/* Breadcrumb */}
            <div style={{ marginBottom: 20, fontSize: '0.875rem', color: '#9CA3AF' }}>
                <Link to="/tickets" style={{ color: '#006B3C', textDecoration: 'none', fontWeight: 600 }}>My Tickets</Link>
                <span style={{ margin: '0 8px' }}>›</span>
                <span>Ticket Detail</span>
            </div>

            {/* Header card */}
            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: 20 }}>
                {/* Title bar */}
                <div style={{ background: '#006B3C', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                        <div style={{ color: '#A7F3D0', fontSize: '0.75rem', fontWeight: 600, marginBottom: 4 }}>TICKET DETAIL</div>
                        <div style={{ color: 'white', fontWeight: 800, fontSize: '1.25rem' }}>{ticket.ticketNumber}</div>
                    </div>
                    <span style={{ background: '#EAF6EF', color: '#006B3C', padding: '4px 16px', borderRadius: 999, fontWeight: 700, fontSize: '0.8rem' }}>
                        {ticket.status}
                    </span>
                </div>

                {/* Fields grid */}
                <div style={{ padding: 24 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 20 }}>
                        {[
                            { label: 'Ticket No.', value: ticket.ticketNumber },
                            { label: 'Ticket Date', value: formatDate(ticket.createdAt) },
                            { label: 'Requester', value: ticket.requester.name },
                            { label: 'Category', value: ticket.category.name },
                            { label: 'Related System', value: ticket.relatedSystem.name },
                            { label: 'Ticket Owner', value: ticket.ticketOwner ?? '—' },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <span style={labelStyle}>{label}</span>
                                <div style={fieldStyle}>{value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Priority row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 20, marginBottom: 20 }}>
                        <div>
                            <span style={labelStyle}>Requested Priority</span>
                            <div style={fieldStyle}><PriorityBadge value={ticket.requestedPriority} /></div>
                        </div>
                        <div>
                            <span style={labelStyle}>IT Priority</span>
                            <div style={fieldStyle}><PriorityBadge value={ticket.itPriority} /></div>
                        </div>
                        <div>
                            <span style={labelStyle}>Current Status</span>
                            <div style={fieldStyle}>
                                <span style={{ background: '#EAF6EF', color: '#006B3C', padding: '2px 10px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700 }}>
                                    {ticket.status}
                                </span>
                            </div>
                        </div>
                        <div>
                            <span style={labelStyle}>Last Updated</span>
                            <div style={fieldStyle}>{formatDate(ticket.updatedAt)}</div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div style={{ marginBottom: 16 }}>
                        <span style={labelStyle}>Summary</span>
                        <div style={fieldStyle}>{ticket.summary}</div>
                    </div>

                    {/* Description */}
                    <div>
                        <span style={labelStyle}>Description</span>
                        <div style={{ ...fieldStyle, whiteSpace: 'pre-wrap', minHeight: 80 }}>{ticket.description}</div>
                    </div>
                </div>
            </div>

            {/* Attachments card */}
            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
                            Attachments
                            <span style={{ marginLeft: 8, background: '#F3F4F6', color: '#6B7280', fontSize: '0.75rem', padding: '2px 8px', borderRadius: 999 }}>
                                {activeAttachments.length}/5 active
                            </span>
                        </h3>
                    </div>
                    <div>
                        {atLimit ? (
                            <span style={{ fontSize: '0.8rem', color: '#DC2626', fontWeight: 600 }}>
                                ⚠ 5-attachment limit reached
                            </span>
                        ) : (
                            <label style={{
                                background: uploading ? '#A7F3D0' : '#006B3C', color: 'white',
                                padding: '7px 16px', borderRadius: 8, cursor: uploading ? 'not-allowed' : 'pointer',
                                fontSize: '0.85rem', fontWeight: 600, display: 'inline-block',
                            }}>
                                {uploading ? 'Uploading…' : '+ Add Attachment'}
                                <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" style={{ display: 'none' }} onChange={handleAttachmentFile} disabled={uploading} />
                            </label>
                        )}
                    </div>
                </div>

                <div style={{ padding: '0 24px' }}>
                    {uploadError && (
                        <div style={{ margin: '12px 0', padding: '10px 14px', background: '#FEF2F2', color: '#991B1B', borderRadius: 8, fontSize: '0.875rem', border: '1px solid #FECACA' }}>
                            {uploadError}
                        </div>
                    )}

                    {ticket.attachments.length === 0 && (
                        <div style={{ padding: '32px 0', textAlign: 'center', color: '#9CA3AF' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📎</div>
                            <p style={{ fontSize: '0.875rem' }}>No attachments yet.</p>
                        </div>
                    )}

                    {ticket.attachments.map(att => (
                        <AttachmentRow
                            key={att.id}
                            att={att}
                            requesterId={requester!.id}
                            onRemoved={handleRemoved}
                            onDownload={handleDownload}
                        />
                    ))}
                </div>

                {ticket.attachments.length > 0 && (
                    <div style={{ padding: '12px 24px', borderTop: '1px solid #F3F4F6', fontSize: '0.75rem', color: '#9CA3AF' }}>
                        Allowed: JPG, PNG, WEBP, PDF · Max 5 MB per file · Max 5 active attachments
                    </div>
                )}
            </div>
        </div>
    )
}
