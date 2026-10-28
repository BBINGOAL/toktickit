import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchTickets, fetchCategories } from '../api'
import type { TicketListItem, Category } from '../api'
import { useAuth } from '../context/AuthContext'

const PRIORITY_COLORS: Record<string, { bg: string; color: string }> = {
    LOW: { bg: '#EAF6EF', color: '#006B3C' },
    MEDIUM: { bg: '#FEF3C7', color: '#92400E' },
    HIGH: { bg: '#FEE2E2', color: '#991B1B' },
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
    NEW: { bg: '#EAF6EF', color: '#006B3C' },
}

function PriorityBadge({ value }: { value?: string | null }) {
    if (!value) return <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>—</span>
    const c = PRIORITY_COLORS[value] ?? { bg: '#F3F4F6', color: '#374151' }
    return (
        <span style={{
            background: c.bg, color: c.color,
            padding: '2px 10px', borderRadius: '999px',
            fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap',
        }}>{value}</span>
    )
}

function StatusBadge({ value }: { value: string }) {
    const c = STATUS_COLORS[value] ?? { bg: '#F3F4F6', color: '#374151' }
    return (
        <span style={{
            background: c.bg, color: c.color,
            padding: '2px 10px', borderRadius: '999px',
            fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap',
        }}>{value}</span>
    )
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

export default function MyTicketsPage() {
    const { user } = useAuth()

    // URL is authoritative for filters, pagination and browser Back/Forward.
    const [params, setParams] = useSearchParams()
    const queryKey = params.toString()
    const search = params.get('search') || ''
    const [searchInput, setSearchInput] = useState('')
    const categoryId = params.get('categoryId') || ''
    const priority = params.get('requestedPriority') || ''
    const status = params.get('status') || ''
    const scope = params.get('scope') || ''
    const sort = params.get('sort') || 'createdAt'
    const order = params.get('order') || 'desc'
    const page = Number(params.get('page') || 1)
    const pageSize = Number(params.get('pageSize') || 10)
    function updateQuery(changes: Record<string, string>, reset = true) {
        const next = new URLSearchParams(params)
        for (const [key, value] of Object.entries(changes)) {
            if (value) next.set(key, value)
            else next.delete(key)
        }
        if (reset) next.set('page', '1')
        setParams(next)
    }
    const setPage = (next: number | ((old: number) => number)) => updateQuery({ page: String(typeof next === 'function' ? next(page) : next) }, false)
    const setPageSize = (next: number) => updateQuery({ pageSize: String(next) })
    const setCategoryId = (next: string) => updateQuery({ categoryId: next })
    const setPriority = (next: string) => updateQuery({ requestedPriority: next })
    useEffect(() => { setSearchInput(search) }, [search])
    const generation = useRef(0)

    // data state
    const [tickets, setTickets] = useState<TicketListItem[]>([])
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // load categories once
    useEffect(() => {
        fetchCategories().then(setCategories).catch(() => {})
    }, [])

    const load = useCallback(async () => {
        if (!user) return
        const requestId = ++generation.current
        setLoading(true)
        setError(null)
        try {
            const res = await fetchTickets(Object.fromEntries(new URLSearchParams(queryKey)))
            if (requestId !== generation.current) return
            setTickets(res.data)
            setTotalPages(res.meta.totalPages)
            setTotalItems(res.meta.totalItems)
        } catch {
            if (requestId !== generation.current) return
            setError('Failed to load tickets. Please try again.')
        } finally {
            if (requestId === generation.current) setLoading(false)
        }
    }, [user, queryKey])

    const cancelLoad = useCallback(() => { generation.current++ }, [])
    useEffect(() => { load(); return cancelLoad }, [load, cancelLoad])

    function handleSearch(e: React.FormEvent) {
        e.preventDefault()
        updateQuery({ search: searchInput })
    }

    function clearFilters() {
        setSearchInput('')
        setParams({})
    }

    function toggleSort(field: string) {
        updateQuery({ sort: field, order: sort === field && order === 'desc' ? 'asc' : 'desc' })
    }

    const SortIcon = ({ field }: { field: string }) => {
        if (sort !== field) return <span style={{ opacity: 0.3, marginLeft: 4 }}>↕</span>
        return <span style={{ marginLeft: 4, color: 'var(--color-primary)' }}>{order === 'asc' ? '↑' : '↓'}</span>
    }

    const hasFilters = search || categoryId || priority || status || scope || params.has('updatedSince') || params.has('updatedUntil') || params.has('resolvedSince') || params.has('resolvedUntil')

    const containerStyle: React.CSSProperties = {
        maxWidth: 1200, margin: '0 auto',
        padding: 'var(--space-6) var(--space-4)',
    }

    const cardStyle: React.CSSProperties = {
        background: 'white',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
    }

    const inputStyle: React.CSSProperties = {
        padding: '8px 12px',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.875rem',
        background: 'white',
        color: 'var(--color-text)',
        outline: 'none',
    }

    return (
        <div className="my-tickets-page" style={containerStyle}>
            {/* Header */}
            <div style={{ marginBottom: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>My Tickets</h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>
                        View and track all of your support requests.
                    </p>
                </div>
                <Link to="/create" style={{
                    background: 'var(--color-primary)', color: 'white',
                    padding: '8px 18px', borderRadius: 'var(--radius-md)',
                    textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                }}>
                    + Create Ticket
                </Link>
            </div>

            {/* Filters */}
            {hasFilters && <p role="status" style={{ overflowWrap: 'anywhere' }}>Current filters: {scope === 'active' ? 'Active tickets. ' : ''}{status ? `Status ${status}. ` : ''}{['updatedSince','updatedUntil','resolvedSince','resolvedUntil'].filter(key => params.has(key)).map(key => `${key}: ${params.get(key)} (UTC)`).join('; ')}</p>}
            <div style={{ ...cardStyle, marginBottom: 'var(--space-4)', padding: 'var(--space-4)' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    {/* Search */}
                    <div style={{ flex: '1 1 220px' }}>
                        <label htmlFor="ticket-search" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Search</label>
                        <input
                            id="ticket-search"
                            type="text"
                            placeholder="Ticket No. or Summary…"
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>
                    {/* Category */}
                    <div style={{ flex: '1 1 160px' }}>
                        <label htmlFor="ticket-category" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Category</label>
                        <select id="ticket-category" value={categoryId} onChange={e => setCategoryId(e.target.value)} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}>
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    {/* Priority */}
                    <div style={{ flex: '1 1 140px' }}>
                        <label htmlFor="ticket-priority" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Requested Priority</label>
                        <select id="ticket-priority" value={priority} onChange={e => setPriority(e.target.value)} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}>
                            <option value="">All Priorities</option>
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                        </select>
                    </div>
                    {/* Buttons */}
                    <div style={{ flex: '1 1 150px' }}><label htmlFor="ticket-status">Status</label><select id="ticket-status" value={status} onChange={e => updateQuery({ status: e.target.value })} style={{ ...inputStyle, width: '100%' }}><option value="">All Statuses</option>{['NEW','OPEN','IN_PROGRESS','WAITING_FOR_REQUESTER','RESOLVED','CLOSED','REOPENED','CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-end' }}>
                        <button type="submit" style={{
                            background: 'var(--color-primary)', color: 'white',
                            border: 'none', padding: '8px 16px',
                            borderRadius: 'var(--radius-md)', cursor: 'pointer',
                            fontWeight: 600, fontSize: '0.875rem',
                        }}>Search</button>
                        {hasFilters && (
                            <button type="button" onClick={clearFilters} style={{
                                background: 'transparent', color: 'var(--color-text-secondary)',
                                border: '1px solid var(--color-border)', padding: '8px 14px',
                                borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.875rem',
                            }}>Clear Filters</button>
                        )}
                    </div>
                </form>
            </div>

            {/* Table Card */}
            <div style={cardStyle}>
                {/* Error */}
                {error && (
                    <div style={{ padding: 'var(--space-4)', background: '#FEF2F2', color: '#991B1B', borderBottom: '1px solid #FECACA' }}>
                        {error}
                        <button onClick={load} style={{ marginLeft: 12, textDecoration: 'underline', background: 'none', border: 'none', color: '#991B1B', cursor: 'pointer', fontSize: '0.875rem' }}>Retry</button>
                    </div>
                )}

                {/* Loading skeleton */}
                {loading && !error && (
                    <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        <div style={{ display: 'inline-block', width: 32, height: 32, border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        <p style={{ marginTop: 'var(--space-3)' }}>Loading tickets…</p>
                    </div>
                )}

                {/* Empty state */}
                {!loading && !error && tickets.length === 0 && !hasFilters && (
                    <div style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🎫</div>
                        <h3 style={{ color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>No tickets yet</h3>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>You haven't submitted any support requests.</p>
                        <Link to="/create" style={{ background: 'var(--color-primary)', color: 'white', padding: '10px 20px', borderRadius: 'var(--radius-md)', textDecoration: 'none', fontWeight: 600 }}>
                            Create your first ticket
                        </Link>
                    </div>
                )}

                {/* No results state */}
                {!loading && !error && tickets.length === 0 && hasFilters && (
                    <div style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🔍</div>
                        <h3 style={{ color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>No results found</h3>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>Try adjusting your search or filters.</p>
                        <button onClick={clearFilters} style={{ background: 'transparent', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', padding: '8px 18px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600 }}>
                            Clear Filters
                        </button>
                    </div>
                )}

                {/* Table */}
                {!loading && !error && tickets.length > 0 && (
                    <div role="region" aria-label="My Tickets results" tabIndex={0} style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ background: '#F9FAFB', borderBottom: '2px solid var(--color-border)' }}>
                                    {[
                                        { label: 'Ticket No.', field: 'ticketNumber' },
                                        { label: 'Created Date', field: 'createdAt' },
                                        { label: 'Summary', field: null },
                                        { label: 'Category', field: null },
                                        { label: 'Req. Priority', field: null },
                                        { label: 'IT Priority', field: null },
                                        { label: 'Status', field: null },
                                        { label: 'Ticket Owner', field: null },
                                        { label: 'Last Updated', field: 'updatedAt' },
                                    ].map(({ label, field }) => (
                                        <th
                                            key={label}
                                            aria-sort={field && sort === field ? order === 'asc' ? 'ascending' : 'descending' : undefined}
                                            style={{
                                                padding: '10px 14px', textAlign: 'left', fontWeight: 600,
                                                color: 'var(--color-text-secondary)', whiteSpace: 'nowrap',
                                                cursor: field ? 'pointer' : 'default',
                                                userSelect: 'none',
                                            }}
                                        >
                                            {field ? <button onClick={() => toggleSort(field)} style={{ background: 'none', border: 0, color: 'inherit', font: 'inherit', padding: 0, cursor: 'pointer' }}>{label}<SortIcon field={field} /></button> : label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.map((t, i) => (
                                    <tr key={t.id} style={{ borderBottom: '1px solid var(--color-border)', background: i % 2 === 0 ? 'white' : '#FAFAFA' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = '#F0FBF5')}
                                        onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#FAFAFA')}
                                    >
                                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                                            <Link to={`/tickets/${t.id}`} style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
                                                {t.ticketNumber}
                                            </Link>
                                        </td>
                                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>{formatDate(t.createdAt)}</td>
                                        <td style={{ padding: '10px 14px', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.summary}</td>
                                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>{t.category.name}</td>
                                        <td style={{ padding: '10px 14px' }}><PriorityBadge value={t.requestedPriority} /></td>
                                        <td style={{ padding: '10px 14px' }}><PriorityBadge value={t.itPriority} /></td>
                                        <td style={{ padding: '10px 14px' }}><StatusBadge value={t.status} /></td>
                                        <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{t.owner?.name ?? '—'}</td>
                                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>{formatDate(t.updatedAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && !error && totalItems > 0 && (
                    <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                            {tickets.length ? `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, totalItems)} of ${totalItems} tickets` : `No tickets on page ${page}. ${totalItems} matching tickets; choose an earlier page.`}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                Per page:&nbsp;
                                <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} style={{ ...inputStyle, padding: '4px 8px' }}>
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </select>
                            </label>
                            <div style={{ display: 'flex', gap: 4 }}>
                                <button aria-label="First page" onClick={() => setPage(1)} disabled={page <= 1} style={pageBtnStyle(page <= 1)}>«</button>
                                <button aria-label="Previous page" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={pageBtnStyle(page <= 1)}>‹</button>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    const start = Math.max(1, Math.min(page - 2, totalPages - 4))
                                    const p = start + i
                                    return (
                                        <button key={p} onClick={() => setPage(p)} style={pageBtnStyle(false, p === page)}>
                                            {p}
                                        </button>
                                    )
                                })}
                                <button aria-label="Next page" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} style={pageBtnStyle(page >= totalPages)}>›</button>
                                <button aria-label="Last page" onClick={() => setPage(Math.max(1,totalPages))} disabled={page >= totalPages} style={pageBtnStyle(page >= totalPages)}>»</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } } .my-tickets-page input:focus-visible, .my-tickets-page select:focus-visible, .my-tickets-page button:focus-visible, .my-tickets-page a:focus-visible, .my-tickets-page [tabindex]:focus-visible { outline: 3px solid #925c00 !important; outline-offset: 2px; }`}</style>
        </div>
    )
}

function pageBtnStyle(disabled: boolean, active = false): React.CSSProperties {
    return {
        padding: '4px 10px',
        border: active ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        background: active ? 'var(--color-primary)' : 'white',
        color: active ? 'white' : disabled ? '#9CA3AF' : 'var(--color-text)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: active ? 700 : 400,
        fontSize: '0.85rem',
        opacity: disabled ? 0.5 : 1,
    }
}
