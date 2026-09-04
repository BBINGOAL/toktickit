import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RequesterProvider, useRequester } from '../context/RequesterContext'
import CreateTicketPage from '../pages/CreateTicketPage'
import * as api from '../api'

vi.mock('../api', () => ({
    fetchCategories: vi.fn(),
    fetchRelatedSystems: vi.fn(),
    createTicket: vi.fn()
}))

// Mock context เพื่อจำลองว่าล็อกอินแล้ว
vi.mock('../context/RequesterContext', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../context/RequesterContext')>()
    return {
        ...actual,
        useRequester: vi.fn()
    }
})

describe('CreateTicketPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(useRequester).mockReturnValue({
            requester: { id: 1, name: 'Test User', email: 'test@test.com', isActive: true },
            setRequester: vi.fn()
        })
        vi.mocked(api.fetchCategories).mockResolvedValue([{ id: 1, name: 'Hardware' }])
        vi.mocked(api.fetchRelatedSystems).mockResolvedValue([{ id: 1, name: 'Laptop' }])
    })

    function renderPage() {
        return render(
            <MemoryRouter>
                <CreateTicketPage />
            </MemoryRouter>
        )
    }

    it('UI-03, STYLE-03: Submit with empty Summary shows field error below input, no API call', async () => {
        const { container } = renderPage()
        
        // รอให้ dropdown โหลดเสร็จ
        await waitFor(() => expect(screen.getByText('Hardware')).toBeInTheDocument())
        
        const selects = container.querySelectorAll('select')
        
        // เลือก Category, System, Priority และกรอกแค่ Description
        fireEvent.change(selects[0], { target: { value: '1' } })
        fireEvent.change(selects[1], { target: { value: '1' } })
        fireEvent.change(selects[2], { target: { value: 'LOW' } })
        fireEvent.change(screen.getByPlaceholderText(/Detailed description/i), { target: { value: 'This is a valid description.' } })
        
        // ปล่อย Summary ว่างไว้ แล้วกด Submit
        const submitBtn = screen.getByRole('button', { name: /Submit Ticket/i })
        fireEvent.click(submitBtn)
        
        // ตรวจสอบ error message ว่าแสดงใต้ field
        expect(await screen.findByText(/Summary is required/i)).toBeInTheDocument()
        expect(api.createTicket).not.toHaveBeenCalled()
    })

    it('UI-04: Submit with Summary > 200 chars shows error', async () => {
        renderPage()
        await waitFor(() => expect(screen.getByText('Hardware')).toBeInTheDocument())
        
        const longSummary = 'A'.repeat(201)
        fireEvent.change(screen.getByPlaceholderText(/Brief description/i), { target: { value: longSummary } })
        fireEvent.click(screen.getByRole('button', { name: /Submit Ticket/i }))
        
        expect(await screen.findByText(/Summary must be at most 200 characters/i)).toBeInTheDocument()
        expect(api.createTicket).not.toHaveBeenCalled()
    })

    it('UI-05, UI-06: Successful submission shows loading state then Ticket Number', async () => {
        vi.mocked(api.createTicket).mockImplementation(
            () => new Promise(resolve => setTimeout(() => resolve({ 
                id: 1, ticketNumber: 'TKT-2026-000001', summary: 'Test', 
                status: 'NEW', requestedPriority: 'LOW', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
            }), 100))
        )
        
        const { container } = renderPage()
        await waitFor(() => expect(screen.getByText('Hardware')).toBeInTheDocument())
        
        const selects = container.querySelectorAll('select')
        // Fill form
        fireEvent.change(selects[0], { target: { value: '1' } })
        fireEvent.change(selects[1], { target: { value: '1' } })
        fireEvent.change(selects[2], { target: { value: 'LOW' } })
        fireEvent.change(screen.getByPlaceholderText(/Brief description/i), { target: { value: 'Test Summary' } })
        fireEvent.change(screen.getByPlaceholderText(/Detailed description/i), { target: { value: 'Test Description' } })
        
        const submitBtn = screen.getByRole('button', { name: /Submit Ticket/i })
        fireEvent.click(submitBtn)
        
        // UI-06: Button should be disabled and show loading state
        expect(submitBtn).toBeDisabled()
        expect(submitBtn).toHaveTextContent(/Submitting/i)
        
        // UI-05: Success message with ticket number
        expect(await screen.findByText('TKT-2026-000001')).toBeInTheDocument()
        expect(screen.getByText(/Ticket Created!/i)).toBeInTheDocument()
    })

    it('UI-07: Backend failure preserves form values and shows error', async () => {
        vi.mocked(api.createTicket).mockRejectedValue(new Error('Server Error 500'))
        
        const { container } = renderPage()
        await waitFor(() => expect(screen.getByText('Hardware')).toBeInTheDocument())
        
        const selects = container.querySelectorAll('select')
        fireEvent.change(selects[0], { target: { value: '1' } })
        fireEvent.change(selects[1], { target: { value: '1' } })
        fireEvent.change(selects[2], { target: { value: 'LOW' } })
        fireEvent.change(screen.getByPlaceholderText(/Brief description/i), { target: { value: 'Test Summary' } })
        fireEvent.change(screen.getByPlaceholderText(/Detailed description/i), { target: { value: 'Test Description' } })
        
        fireEvent.click(screen.getByRole('button', { name: /Submit Ticket/i }))
        
        // ควรมี banner error แต่ค่าที่พิมพ์ต้องยังอยู่
        expect(await screen.findByText(/Server Error 500/i)).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/Brief description/i)).toHaveValue('Test Summary')
    })

    it('STYLE-02: Required field asterisks present', async () => {
        const { container } = renderPage()
        await waitFor(() => expect(screen.getByText('Hardware')).toBeInTheDocument())
        const requiredLabels = ['Category', 'Related System', 'Requested Priority', 'Summary', 'Description']
        const labels = Array.from(container.querySelectorAll('label.form-label'))
        requiredLabels.forEach(label => {
            const hasLabel = labels.some(el => el.textContent?.includes(label) && el.textContent?.includes('*'))
            expect(hasLabel).toBe(true)
        })
    })
})
