import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppShell from './components/AppShell'
import Login from './pages/Login'
import CreateTicketPage from './pages/CreateTicketPage'
import MyTicketsPage from './pages/MyTicketsPage'
import TicketDetailPage from './pages/TicketDetailPage'
import ITStaffQueue from './pages/ITStaffQueue'
import UserManagement from './pages/UserManagement'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth()
    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading session...</div>
    if (!user) return <Navigate to="/" replace />
    return <>{children}</>
}

function RoleRoute({ roles, children }: { roles: string[]; children: React.ReactNode }) {
    const { user, loading } = useAuth()
    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading session...</div>
    if (!user) return <Navigate to="/" replace />
    if (!roles.includes(user.role)) return <Navigate to="/" replace />
    return <>{children}</>
}

function AppRoutes() {
    return (
        <AppShell>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route
                    path="/create"
                    element={
                        <RoleRoute roles={['REQUESTER']}>
                            <CreateTicketPage />
                        </RoleRoute>
                    }
                />
                <Route
                    path="/tickets"
                    element={
                        <RoleRoute roles={['REQUESTER']}>
                            <MyTicketsPage />
                        </RoleRoute>
                    }
                />
                <Route
                    path="/tickets/:id"
                    element={
                        <ProtectedRoute>
                            <TicketDetailPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/staff/tickets"
                    element={
                        <RoleRoute roles={['IT_STAFF', 'ADMIN']}>
                            <ITStaffQueue />
                        </RoleRoute>
                    }
                />
                <Route
                    path="/admin/users"
                    element={
                        <RoleRoute roles={['ADMIN']}>
                            <UserManagement />
                        </RoleRoute>
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AppShell>
    )
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    )
}
