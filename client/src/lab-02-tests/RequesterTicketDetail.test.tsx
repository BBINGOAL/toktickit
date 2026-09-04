import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { RequesterProvider, useRequester } from '../context/RequesterContext'
import TicketDetailPage from '../pages/TicketDetailPage'
import * as api from '../api'

vi.mock('../api', () => ({
    fetchTicketDetail: vi.fn(),
    uploadAttachment: vi.fn(),
    removeAttachment: vi.fn(),
    downloadAttachment: vi.fn()
}))

vi.mock('../context/RequesterContext', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../context/RequesterContext')>()
    return { ...actual, useRequester: vi.fn() }
})

describe('RequesterTicketDetail', () => {
    it('UI-14: All fields in ticket header are read-only (no inputs)', async () => {
        vi.mocked(useRequester).mockReturnValue({
            requester: { id: 1, name: 'Test User', email: 'test@test.com', isActive: true },
            setRequester: vi.fn()
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
        // ยกเว้น input file สำหรับ attachment
        const inputs = document.querySelectorAll('input:not([type="file"]), textarea, select')
        expect(inputs.length).toBe(0)
    })
})
