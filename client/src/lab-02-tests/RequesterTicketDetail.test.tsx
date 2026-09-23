import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { useAuth } from '../context/AuthContext'
import TicketDetailPage from '../pages/TicketDetailPage'
import * as api from '../api'

vi.mock('../api', () => ({
    fetchComments: vi.fn().mockResolvedValue([]),
    fetchTicketDetail: vi.fn(),
    uploadAttachment: vi.fn(),
    removeAttachment: vi.fn(),
    downloadAttachment: vi.fn()
}))

vi.mock('../context/AuthContext', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../context/AuthContext')>()
    return { ...actual, useAuth: vi.fn() }
})

describe('RequesterTicketDetail', () => {
    it('UI-14: All fields in ticket header are read-only (no inputs)', async () => {
        vi.mocked(useAuth).mockReturnValue({
            user: { id: 1, name: 'Test User', role: 'REQUESTER' },
            setUser: vi.fn(), logout: vi.fn(), loading: false
        })
        vi.mocked(api.fetchTicketDetail).mockResolvedValue({
            id: 1, ticketNumber: 'TKT-2026-000001', summary: 'Test Summary', description: 'Test Desc',
            category: { id: 1, name: 'HW' }, relatedSystem: { id: 1, name: 'Sys' },
            status: 'NEW', requestedPriority: 'LOW', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
            requester: { id: 1, name: 'Test User' }, attachments: []
        })

        render(
            <MemoryRouter initialEntries={['/tickets/1']}>
                <Routes>
                    <Route path="/tickets/:id" element={<TicketDetailPage />} />
                </Routes>
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('Test Summary')).toBeInTheDocument())
        
        // ตรวจสอบว่าไม่มี input field ชนิด text หรือ textarea โผล่มา
        // Exclude the public-comment textarea and file input, which remain editable.
        const inputs = document.querySelectorAll('input:not([type="file"]), select')
        expect(inputs.length).toBe(0)
    })
})
