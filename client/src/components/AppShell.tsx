import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logout as apiLogout } from '../api'

export default function AppShell({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    async function handleLogout() {
        try {
            await apiLogout()
        } catch (e) {
            console.error(e)
        }
        logout()
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

                {/* Nav links */}
                {user && (
                    <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                        {user.role === 'REQUESTER' && (
                            <>
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
                            </>
                        )}
                        {(user.role === 'IT_STAFF' || user.role === 'ADMIN') && (
                            <NavLink
                                to="/staff/tickets"
                                style={({ isActive }) => ({
                                    color: isActive ? 'var(--color-pale-green)' : '#fff',
                                    textDecoration: isActive ? 'underline' : 'none',
                                    fontWeight: 500,
                                    fontSize: 14,
                                })}
                            >
                                Ticket Queue
                            </NavLink>
                        )}
                        {user.role === 'ADMIN' && (
                            <NavLink
                                to="/admin/users"
                                style={({ isActive }) => ({
                                    color: isActive ? 'var(--color-pale-green)' : '#fff',
                                    textDecoration: isActive ? 'underline' : 'none',
                                    fontWeight: 500,
                                    fontSize: 14,
                                })}
                            >
                                User Management
                            </NavLink>
                        )}
                    </div>
                )}

                {/* User info */}
                {user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <span style={{ 
                            background: '#7b9c7b', 
                            color: '#fff', 
                            fontSize: 11, 
                            padding: '2px 6px', 
                            borderRadius: 4, 
                            fontWeight: 600 
                        }}>
                            {user.role}
                        </span>
                        <span style={{ color: '#fff', fontSize: 14 }}>{user.name}</span>
                        <button
                            onClick={handleLogout}
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
                            Logout
                        </button>
                    </div>
                ) : (
                    <span style={{ color: '#fff', fontSize: 14 }}>Not logged in</span>
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
