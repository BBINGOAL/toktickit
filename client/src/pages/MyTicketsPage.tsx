import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { fetchTickets, fetchCategories } from '../api'
import type { TicketListItem, Category } from '../api'
import { useRequester } from '../context/RequesterContext'

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
    const { requester } = useRequester()

    // filter / sort / pagination state
    const [search, setSearch] = useState('')
    const [searchInput, setSearchInput] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [priority, setPriority] = useState('')
    const [sort, setSort] = useState('createdAt')
    const [order, setOrder] = useState('desc')
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

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
        if (!requester) return
        setLoading(true)
        setError(null)
        try {
            const res = await fetchTickets(requester.id, {
                search: search || undefined,
                categoryId: categoryId ? Number(categoryId) : undefined,
                requestedPriority: priority || undefined,
                sort,
                order,
                page,
                pageSize,
            })
            setTickets(res.data)
            setTotalPages(res.pagination.totalPages)
            setTotalItems(res.pagination.totalItems)
        } catch {
            setError('Failed to load tickets. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [requester, search, categoryId, priority, sort, order, page, pageSize])

    useEffect(() => { load() }, [load])

    // reset to page 1 when filters change
    useEffect(() => { setPage(1) }, [search, categoryId, priority, sort, order, pageSize])

    function handleSearch(e: React.FormEvent) {
        e.preventDefault()
        setSearch(searchInput)
    }

    function clearFilters() {
        setSearchInput('')
        setSearch('')
        setCategoryId('')
        setPriority('')
        setSort('createdAt')
        setOrder('desc')
        setPageSize(10)
        setPage(1)
    }

    function toggleSort(field: string) {
        if (sort === field) {
            setOrder(prev => prev === 'asc' ? 'desc' : 'asc')
        } else {
            setSort(field)
            setOrder('desc')
        }
    }

    const SortIcon = ({ field }: { field: string }) => {
        if (sort !== field) return <span style={{ opacity: 0.3, marginLeft: 4 }}>↕</span>
        return <span style={{ marginLeft: 4, color: 'var(--color-primary)' }}>{order === 'asc' ? '↑' : '↓'}</span>
    }

    const hasFilters = search || categoryId || priority

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
        <div style={containerStyle}>
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
            <div style={{ ...cardStyle, marginBottom: 'var(--space-4)', padding: 'var(--space-4)' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    {/* Search */}
                    <div style={{ flex: '1 1 220px' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Search</label>
                        <input
                            type="text"
                            placeholder="Ticket No. or Summary…"
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>
                    {/* Category */}
                    <div style={{ flex: '1 1 160px' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Category</label>
                        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}>
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    {/* Priority */}
                    <div style={{ flex: '1 1 140px' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Requested Priority</label>
                        <select value={priority} onChange={e => setPriority(e.target.value)} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}>
                            <option value="">All Priorities</option>
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                        </select>
                    </div>
                    {/* Buttons */}
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
                    <div style={{ overflowX: 'auto' }}>
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
                                            onClick={field ? () => toggleSort(field) : undefined}
                                            style={{
                                                padding: '10px 14px', textAlign: 'left', fontWeight: 600,
                                                color: 'var(--color-text-secondary)', whiteSpace: 'nowrap',
                                                cursor: field ? 'pointer' : 'default',
                                                userSelect: 'none',
                                            }}
                                        >
                                            {label}{field && <SortIcon field={field} />}
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
                                        <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{t.ticketOwner ?? '—'}</td>
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
                            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} of {totalItems} tickets
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
                                <button onClick={() => setPage(1)} disabled={page === 1} style={pageBtnStyle(page === 1)}>«</button>
                                <button onClick={() => setPage(p => p - 1)} disabled={page === 1} style={pageBtnStyle(page === 1)}>‹</button>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    const start = Math.max(1, Math.min(page - 2, totalPages - 4))
                                    const p = start + i
                                    return (
                                        <button key={p} onClick={() => setPage(p)} style={pageBtnStyle(false, p === page)}>
                                            {p}
                                        </button>
                                    )
                                })}
                                <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} style={pageBtnStyle(page === totalPages)}>›</button>
                                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={pageBtnStyle(page === totalPages)}>»</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
