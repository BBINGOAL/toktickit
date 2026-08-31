import { NavLink, useNavigate } from 'react-router-dom'
import { useRequester } from '../context/RequesterContext'

export default function AppShell({ children }: { children: React.ReactNode }) {
    const { requester, setRequester } = useRequester()
    const navigate = useNavigate()

    function handleChange() {
        setRequester(null)
        navigate('/')
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* ─── Nav Bar ─── */}
            <nav style={{
                background: 'var(--color-primary)',
                height: 56,
                display: 'flex',
                alignItems: 'center',
                padding: '0 var(--space-6)',
                gap: 'var(--space-6)',
                position: 'sticky',
                top: 0,
                zIndex: 100,
            }}>
                {/* Logo */}
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', marginRight: 'auto' }}>
                    TokTickIT
                </span>

                {/* Nav links — only shown when requester is selected */}
                {requester && (
                    <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                        <NavLink
                            to="/tickets"
                            style={({ isActive }) => ({
                                color: isActive ? 'var(--color-pale-green)' : '#fff',
                                textDecoration: isActive ? 'underline' : 'none',
                                fontWeight: 500,
                                fontSize: 14,
                            })}
                        >
                            My Tickets
                        </NavLink>
                        <NavLink
                            to="/create"
                            style={({ isActive }) => ({
                                color: isActive ? 'var(--color-pale-green)' : '#fff',
                                textDecoration: isActive ? 'underline' : 'none',
                                fontWeight: 500,
                                fontSize: 14,
                            })}
                        >
                            Create Ticket
                        </NavLink>
                    </div>
                )}

                {/* Requester info */}
                {requester ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <span style={{ color: '#fff', fontSize: 14 }}>{requester.name}</span>
                        <button
                            onClick={handleChange}
                            style={{
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.5)',
                                color: '#fff',
                                borderRadius: 6,
                                padding: '4px 12px',
                                fontSize: 13,
                                cursor: 'pointer',
                            }}
                        >
                            Change Requester
                        </button>
                    </div>
                ) : (
                    <NavLink
                        to="/"
                        style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}
                    >
                        Select Requester
                    </NavLink>
                )}
            </nav>

            {/* ─── Page Content ─── */}
            <main style={{
                flex: 1,
                maxWidth: 1200,
                width: '100%',
                margin: '0 auto',
                padding: 'var(--space-8) var(--space-6)',
                boxSizing: 'border-box',
            }}>
                {children}
            </main>
        </div>
    )
}
