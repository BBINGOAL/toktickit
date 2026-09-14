import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppShell from './components/AppShell'
import Login from './pages/Login'
import CreateTicketPage from './pages/CreateTicketPage'
import MyTicketsPage from './pages/MyTicketsPage'
import TicketDetailPage from './pages/TicketDetailPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user } = useAuth()
    if (!user) return <Navigate to="/" replace />
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
                        <ProtectedRoute>
                            <CreateTicketPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/tickets"
                    element={
                        <ProtectedRoute>
                            <MyTicketsPage />
                        </ProtectedRoute>
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
