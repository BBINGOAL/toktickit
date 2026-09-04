import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchCategories, fetchRelatedSystems, createTicket, uploadAttachment } from '../api'
import type { Category, RelatedSystem } from '../api'
import { useRequester } from '../context/RequesterContext'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_SIZE = 5 * 1024 * 1024

interface FileEntry {
    file: File
    error?: string
}

interface FormErrors {
    categoryId?: string
    relatedSystemId?: string
    requestedPriority?: string
    summary?: string
    description?: string
}

export default function CreateTicketPage() {
    const { requester } = useRequester()
    const navigate = useNavigate()

    // Reference data
    const [categories, setCategories] = useState<Category[]>([])
    const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([])
    const [refLoading, setRefLoading] = useState(true)
    const [refError, setRefError] = useState<string | null>(null)

    // Form fields
    const [categoryId, setCategoryId] = useState('')
    const [relatedSystemId, setRelatedSystemId] = useState('')
    const [priority, setPriority] = useState('')
    const [summary, setSummary] = useState('')
    const [description, setDescription] = useState('')
    const [files, setFiles] = useState<FileEntry[]>([])

    // Form state
    const [errors, setErrors] = useState<FormErrors>({})
    const [submitting, setSubmitting] = useState(false)
    const [apiError, setApiError] = useState<string | null>(null)
    const [createdTicketNumber, setCreatedTicketNumber] = useState<string | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)

    // Redirect if no requester
    useEffect(() => {
        if (!requester) navigate('/')
    }, [requester, navigate])

    // Load categories and related systems
    useEffect(() => {
        async function loadRef() {
            setRefLoading(true)
            setRefError(null)
            try {
                const [cats, systems] = await Promise.all([
                    fetchCategories(),
                    fetchRelatedSystems(),
                ])
                setCategories(cats)
                setRelatedSystems(systems)
            } catch {
                setRefError('Failed to load form options. Please refresh.')
            } finally {
                setRefLoading(false)
            }
        }
        loadRef()
    }, [])

    function validate(): FormErrors {
        const e: FormErrors = {}
        if (!categoryId) e.categoryId = 'Category is required'
        if (!relatedSystemId) e.relatedSystemId = 'Related System is required'
        if (!priority) e.requestedPriority = 'Priority is required'
        const trimSum = summary.trim()
        if (!trimSum) e.summary = 'Summary is required'
        else if (trimSum.length < 5) e.summary = 'Summary must be at least 5 characters'
        else if (trimSum.length > 200) e.summary = 'Summary must be at most 200 characters'
        const trimDesc = description.trim()
        if (!trimDesc) e.description = 'Description is required'
        else if (trimDesc.length < 10) e.description = 'Description must be at least 10 characters'
        else if (trimDesc.length > 2000) e.description = 'Description must be at most 2000 characters'
        return e
    }

    function handleFileAdd(e: React.ChangeEvent<HTMLInputElement>) {
        const selected = Array.from(e.target.files ?? [])
        const newEntries: FileEntry[] = selected.map(file => {
            if (!ALLOWED_TYPES.includes(file.type))
                return { file, error: 'Invalid file type. Allowed: JPG, PNG, WEBP, PDF' }
            if (file.size > MAX_SIZE)
                return { file, error: 'File exceeds 5 MB limit' }
            return { file }
        })
        setFiles(prev => [...prev, ...newEntries].slice(0, 10))
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    function removeFile(index: number) {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const validFiles = files.filter(f => !f.error)
    const atLimit = validFiles.length >= 5

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        const errs = validate()
        setErrors(errs)
        if (Object.keys(errs).length > 0) return

        setSubmitting(true)
        setApiError(null)

        try {
            const ticket = await createTicket(requester!.id, {
                categoryId: parseInt(categoryId),
                relatedSystemId: parseInt(relatedSystemId),
                summary: summary.trim(),
                description: description.trim(),
                requestedPriority: priority as 'LOW' | 'MEDIUM' | 'HIGH',
            })

            // Upload attachments (best-effort: ticket survives even if upload fails)
            const uploadErrors: string[] = []
            for (const entry of validFiles) {
                try {
                    await uploadAttachment(requester!.id, ticket.id, entry.file)
                } catch (err: unknown) {
                    uploadErrors.push(
                        `${entry.file.name}: ${err instanceof Error ? err.message : 'Upload failed'}`
                    )
                }
            }

            setCreatedTicketNumber(ticket.ticketNumber)
            if (uploadErrors.length > 0) {
                setApiError(`Ticket created, but some files failed to upload:\n${uploadErrors.join('\n')}`)
            }
        } catch (err: unknown) {
            setApiError(err instanceof Error ? err.message : 'Failed to create ticket')
        } finally {
            setSubmitting(false)
        }
    }

    // ── SUCCESS STATE ──────────────────────────────────────
    if (createdTicketNumber && !apiError) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
                <div className="card callout-success" style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 'var(--space-4)' }}>✅</div>
                    <h2 style={{ marginBottom: 'var(--space-2)', color: 'var(--color-success)' }}>
                        Ticket Created!
                    </h2>
                    <p style={{ marginBottom: 'var(--space-4)', color: 'var(--color-text-secondary)' }}>
                        Your ticket number is:
                    </p>
                    <div style={{
                        background: 'var(--color-pale-green)',
                        border: '2px solid var(--color-secondary)',
                        borderRadius: 8,
                        padding: 'var(--space-4)',
                        fontWeight: 700,
                        fontSize: '1.25rem',
                        color: 'var(--color-primary)',
                        letterSpacing: 1,
                        marginBottom: 'var(--space-6)',
                    }}>
                        {createdTicketNumber}
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/tickets')}
                        style={{ width: '100%' }}
                    >
                        View My Tickets
                    </button>
                </div>
            </div>
        )
    }

    // ── FORM ──────────────────────────────────────────────
    const today = new Date().toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
    })

    return (
        <div>
            <h2 style={{ marginBottom: 'var(--space-6)' }}>Create New Ticket</h2>

            {refLoading && (
                <div style={{ textAlign: 'center', padding: 'var(--space-12) 0' }}>
                    <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
                    <p style={{ marginTop: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>
                        Loading form options...
                    </p>
                </div>
            )}

            {refError && (
                <div className="callout callout-error">{refError}</div>
            )}

            {!refLoading && !refError && (
                <form onSubmit={handleSubmit} noValidate>
                    {/* ── API Error Banner ── */}
                    {apiError && (
                        <div className="callout callout-error" style={{ marginBottom: 'var(--space-5)', whiteSpace: 'pre-line' }}>
                            {apiError}
                        </div>
                    )}

                    {/* ── Read-only Header Section ── */}
                    <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
                        <h3 style={{ marginBottom: 'var(--space-4)', color: 'var(--color-text-secondary)' }}>
                            Ticket Information
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                            <div>
                                <label className="form-label">Ticket Number</label>
                                <input type="text" value="—" readOnly />
                            </div>
                            <div>
                                <label className="form-label">Ticket Date</label>
                                <input type="text" value={today} readOnly />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label className="form-label">Requester</label>
                                <input type="text" value={requester?.name ?? ''} readOnly />
                            </div>
                        </div>
                    </div>

                    {/* ── Category / Related System / Priority ── */}
                    <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                            <div>
                                <label className="form-label">
                                    Category <span className="required-star">*</span>
                                </label>
                                <select
                                    value={categoryId}
                                    onChange={e => { setCategoryId(e.target.value); setErrors(p => ({ ...p, categoryId: undefined })) }}
                                    className={errors.categoryId ? 'error' : ''}
                                    disabled={submitting}
                                >
                                    <option value="">— Select category —</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                {errors.categoryId && <p className="field-error">{errors.categoryId}</p>}
                            </div>

                            <div>
                                <label className="form-label">
                                    Related System <span className="required-star">*</span>
                                </label>
                                <select
                                    value={relatedSystemId}
                                    onChange={e => { setRelatedSystemId(e.target.value); setErrors(p => ({ ...p, relatedSystemId: undefined })) }}
                                    className={errors.relatedSystemId ? 'error' : ''}
                                    disabled={submitting}
                                >
                                    <option value="">— Select system —</option>
                                    {relatedSystems.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                {errors.relatedSystemId && <p className="field-error">{errors.relatedSystemId}</p>}
                            </div>

                            <div style={{ gridColumn: '1 / -1' }}>
                                <label className="form-label">
                                    Requested Priority <span className="required-star">*</span>
                                </label>
                                <select
                                    value={priority}
                                    onChange={e => { setPriority(e.target.value); setErrors(p => ({ ...p, requestedPriority: undefined })) }}
                                    className={errors.requestedPriority ? 'error' : ''}
                                    disabled={submitting}
                                    style={{ maxWidth: 200 }}
                                >
                                    <option value="">— Select priority —</option>
                                    <option value="LOW">LOW</option>
                                    <option value="MEDIUM">MEDIUM</option>
                                    <option value="HIGH">HIGH</option>
                                </select>
                                {errors.requestedPriority && <p className="field-error">{errors.requestedPriority}</p>}
                            </div>
                        </div>
                    </div>

                    {/* ── Summary & Description ── */}
                    <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            <div>
                                <label className="form-label">
                                    Summary <span className="required-star">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={summary}
                                    onChange={e => { setSummary(e.target.value); setErrors(p => ({ ...p, summary: undefined })) }}
                                    className={errors.summary ? 'error' : ''}
                                    disabled={submitting}
                                    placeholder="Brief description of the issue (5–200 characters)"
                                    maxLength={200}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                    {errors.summary
                                        ? <p className="field-error">{errors.summary}</p>
                                        : <span />}
                                    <span className="char-count">{summary.length}/200</span>
                                </div>
                            </div>

                            <div>
                                <label className="form-label">
                                    Description <span className="required-star">*</span>
                                </label>
                                <textarea
                                    value={description}
                                    onChange={e => { setDescription(e.target.value); setErrors(p => ({ ...p, description: undefined })) }}
                                    className={errors.description ? 'error' : ''}
                                    disabled={submitting}
                                    placeholder="Detailed description of the issue (10–2000 characters)"
                                    maxLength={2000}
                                    rows={5}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                    {errors.description
                                        ? <p className="field-error">{errors.description}</p>
                                        : <span />}
                                    <span className="char-count">{description.length}/2000</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Attachments ── */}
                    <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
                        <h3 style={{ marginBottom: 'var(--space-3)' }}>Attachments (optional)</h3>

                        {files.length > 0 && (
                            <div style={{ marginBottom: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                {files.map((entry, i) => (
                                    <div key={i} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-3)',
                                        padding: 'var(--space-2) var(--space-3)',
                                        background: entry.error ? 'var(--color-error-bg)' : 'var(--color-pale-green)',
                                        borderRadius: 6,
                                        fontSize: 13,
                                    }}>
                                        <span style={{ flex: 1 }}>
                                            {entry.file.name}
                                            {' '}
                                            <span style={{ color: 'var(--color-text-secondary)' }}>
                                                ({(entry.file.size / 1024).toFixed(0)} KB)
                                            </span>
                                            {entry.error && (
                                                <span style={{ color: 'var(--color-error)', display: 'block', fontSize: 12 }}>
                                                    ⚠ {entry.error}
                                                </span>
                                            )}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(i)}
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                color: 'var(--color-error)', fontWeight: 700, fontSize: 16,
                                            }}
                                            aria-label={`Remove ${entry.file.name}`}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp,.pdf"
                            multiple
                            onChange={handleFileAdd}
                            style={{ display: 'none' }}
                        />

                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={atLimit || submitting}
                            title={atLimit ? 'Maximum 5 attachments reached' : undefined}
                        >
                            + Add Attachment
                        </button>

                        {atLimit && (
                            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>
                                Maximum 5 active attachments reached.
                            </p>
                        )}

                        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>
                            Allowed: JPG, PNG, WEBP, PDF — Max 5 MB each
                        </p>
                    </div>

                    {/* ── Action Buttons ── */}
                    <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate('/tickets')}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <><span className="spinner" /> Submitting…</>
                            ) : (
                                'Submit Ticket'
                            )}
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}
