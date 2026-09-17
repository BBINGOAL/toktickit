import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchStaffTickets } from '../api'
import type { TicketListItem } from '../api'

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

export default function ITStaffQueue() {
    const [tickets, setTickets] = useState<TicketListItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [priorityFilter, setPriorityFilter] = useState('')
    const [totalItems, setTotalItems] = useState(0)

    useEffect(() => {
        loadTickets()
    }, [statusFilter, priorityFilter])

    async function loadTickets() {
        setLoading(true)
        setError(null)
        try {
            const res = await fetchStaffTickets({
                search: search || undefined,
                status: statusFilter || undefined,
                priority: priorityFilter || undefined,
                page: 1,
                pageSize: 50,
            })
            setTickets(res.data)
            setTotalItems(res.meta.totalItems)
        } catch {
            setError('Failed to load tickets.')
        } finally {
            setLoading(false)
        }
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault()
        loadTickets()
    }

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', margin: 0 }}>IT Staff Ticket Queue</h1>
            </div>

            <div style={{ background: 'white', padding: 20, borderRadius: 12, border: '1px solid #E5E7EB', marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', flex: '1 1 300px', gap: 8 }}>
                    <input
                        type="text"
                        placeholder="Search ticket number or summary..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: '0.875rem' }}
                    />
                    <button type="submit" style={{ background: '#006B3C', color: 'white', border: 'none', padding: '0 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Search</button>
                </form>

                <div style={{ display: 'flex', gap: 12 }}>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: '0.875rem', background: 'white' }}
                    >
                        <option value="">All Statuses</option>
                        <option value="DRAFT">Draft</option>
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                    
                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: '0.875rem', background: 'white' }}
                    >
                        <option value="">All IT Priorities</option>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                    </select>
                </div>
            </div>

            {error && (
                <div style={{ padding: 16, background: '#FEF2F2', color: '#991B1B', borderRadius: 8, marginBottom: 24, border: '1px solid #FECACA' }}>
                    {error}
                </div>
            )}

            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, color: '#374151' }}>{totalItems} tickets found</span>
                </div>
                
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Loading tickets...</div>
                ) : tickets.length === 0 ? (
                    <div style={{ padding: 60, textAlign: 'center', color: '#6B7280' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 16 }}>📋</div>
                        <p style={{ fontSize: '1.1rem', fontWeight: 500, margin: '0 0 8px' }}>No tickets found</p>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #E5E7EB', color: '#6B7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                    <th style={{ padding: '12px 20px', fontWeight: 600 }}>Ticket</th>
                                    <th style={{ padding: '12px 20px', fontWeight: 600 }}>Category & System</th>
                                    <th style={{ padding: '12px 20px', fontWeight: 600 }}>Status & Priority</th>
                                    <th style={{ padding: '12px 20px', fontWeight: 600 }}>Owner</th>
                                    <th style={{ padding: '12px 20px', fontWeight: 600 }}>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.map(ticket => (
                                    <tr key={ticket.id} style={{ borderBottom: '1px solid #F3F4F6', transition: 'background 0.15s' }}>
                                        <td style={{ padding: '16px 20px' }}>
                                            <Link to={`/tickets/${ticket.id}`} style={{ color: '#006B3C', fontWeight: 600, textDecoration: 'none' }}>
                                                {ticket.ticketNumber}
                                            </Link>
                                            <div style={{ fontSize: '0.875rem', color: '#374151', marginTop: 4 }}>
                                                {ticket.summary.length > 50 ? ticket.summary.substring(0, 50) + '...' : ticket.summary}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 20px', fontSize: '0.875rem' }}>
                                            <div style={{ color: '#111827', fontWeight: 500 }}>{ticket.category.name}</div>
                                            <div style={{ color: '#6B7280' }}>{ticket.relatedSystem.name}</div>
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <div style={{ marginBottom: 6 }}>
                                                <span style={{ background: '#E5E7EB', color: '#374151', padding: '2px 8px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600 }}>
                                                    {ticket.status}
                                                </span>
                                            </div>
                                            <div>
                                                <PriorityBadge value={ticket.itPriority} />
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 20px', fontSize: '0.875rem', color: '#374151' }}>
                                            {ticket.owner ? ticket.owner.name : <span style={{ color: '#9CA3AF' }}>Unassigned</span>}
                                        </td>
                                        <td style={{ padding: '16px 20px', fontSize: '0.875rem', color: '#6B7280' }}>
                                            {formatDate(ticket.createdAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
