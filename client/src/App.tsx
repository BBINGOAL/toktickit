import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { RequesterProvider } from './context/RequesterContext'
import AppShell from './components/AppShell'
import RequesterSelectionPage from './pages/RequesterSelectionPage'
import CreateTicketPage from './pages/CreateTicketPage'
import MyTicketsPage from './pages/MyTicketsPage'
import TicketDetailPage from './pages/TicketDetailPage'
import { useRequester } from './context/RequesterContext'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { requester } = useRequester()
    if (!requester) return <Navigate to="/" replace />
    return <>{children}</>
}

function AppRoutes() {
    return (
        <AppShell>
            <Routes>
                <Route path="/" element={<RequesterSelectionPage />} />
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
            <RequesterProvider>
                <AppRoutes />
            </RequesterProvider>
        </BrowserRouter>
    )
}
