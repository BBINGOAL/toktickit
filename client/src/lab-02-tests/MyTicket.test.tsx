import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuth } from '../context/AuthContext'
import MyTicketsPage from '../pages/MyTicketsPage'
import * as api from '../api'

vi.mock('../api', () => ({
    fetchTickets: vi.fn(),
    fetchCategories: vi.fn()
}))

vi.mock('../context/AuthContext', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../context/AuthContext')>()
    return { ...actual, useAuth: vi.fn() }
})

describe('MyTicketsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(api.fetchCategories).mockResolvedValue([])
    })

    function renderPage(requesterId = 1) {
        vi.mocked(useAuth).mockReturnValue({
            user: { id: requesterId, name: 'Test User', role: 'REQUESTER' },
            setUser: vi.fn(), logout: vi.fn(), loading: false
        })
        return render(
            <MemoryRouter>
                <MyTicketsPage />
            </MemoryRouter>
        )
    }

    it('UI-11: Shows empty state message when there are no tickets', async () => {
        vi.mocked(api.fetchTickets).mockResolvedValue({ data: [], meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 } })
        
        renderPage()
        
        expect(await screen.findByText(/No tickets yet/i)).toBeInTheDocument()
        expect(screen.getByText(/You haven't submitted any support requests/i)).toBeInTheDocument()
    })

    it('UI-12: Shows no-results state distinct from empty state when search fails', async () => {
        // จำลองให้มีการค้นหา/กรอง (เช่น search="NotFound") และ API คืนค่าว่าง
        vi.mocked(api.fetchTickets).mockResolvedValue({ data: [], meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 } })
        
        const { container } = renderPage()
        
        // รอให้โหลดเสร็จ
        await waitFor(() => expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument())
        
        // บังคับเปลี่ยน state ของ component ว่ามี filter
        // (ในการทดสอบจริงอาจจะต้องจำลองการพิมพ์ช่องค้นหาแทน)
        const searchInput = screen.getByPlaceholderText(/Ticket No. or Summary…/i)
        import('@testing-library/react').then(({ fireEvent }) => {
            fireEvent.change(searchInput, { target: { value: 'NotFound' } })
            fireEvent.submit(searchInput.closest('form')!)
        })
        
        expect(await screen.findByText(/No results found/i)).toBeInTheDocument()
    })

    it('UI-13: Changing requester reloads tickets', async () => {
        vi.mocked(api.fetchTickets).mockResolvedValue({ data: [], meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 } })
        
        const { rerender } = renderPage(1)
        await waitFor(() => expect(api.fetchTickets).toHaveBeenCalledWith(expect.any(Object)))
        vi.mocked(api.fetchTickets).mockClear()
        
        vi.mocked(useAuth).mockReturnValue({
            user: { id: 2, name: 'User 2', role: 'REQUESTER' },
            setUser: vi.fn(), logout: vi.fn(), loading: false
        })
        
        rerender(
            <MemoryRouter>
                <MyTicketsPage />
            </MemoryRouter>
        )
        
        await waitFor(() => expect(api.fetchTickets).toHaveBeenCalledWith(expect.any(Object)))
    })

    it('STYLE-04: Priority and Status badges rendered with correct classes/styles', async () => {
        vi.mocked(api.fetchTickets).mockResolvedValue({ 
            data: [{ 
                id: 1, ticketNumber: 'TKT-2026-000001', summary: 'Test', 
                category: { id: 1, name: 'HW' }, relatedSystem: { id: 1, name: 'Sys' },
                status: 'NEW', requestedPriority: 'HIGH', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
            }], 
            meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 }
        })
        
        renderPage()
        
        // รอให้โหลด Ticket ขึ้นมา
        await waitFor(() => expect(screen.getByText('TKT-2026-000001')).toBeInTheDocument())
        
        // ตรวจสอบ Badge High Priority ว่ามีสีแดง
        const priorityBadge = screen.getByText('HIGH')
        expect(priorityBadge).toHaveStyle({ color: '#991B1B' }) // แดงตาม Zen Green 
        
        // ตรวจสอบ Status Badge
        const statusBadge = screen.getByText('NEW')
        expect(statusBadge).toHaveStyle({ color: '#006B3C' }) // เขียวเข้ม
    })
})
