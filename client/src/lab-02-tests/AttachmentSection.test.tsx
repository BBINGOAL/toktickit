import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRequester } from '../context/RequesterContext'
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

describe('AttachmentSection', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(useRequester).mockReturnValue({
            requester: { id: 1, name: 'Test User', email: 'test@test.com', isActive: true },
            setRequester: vi.fn()
        })
    })

    function renderPage(attachments: any[] = []) {
        vi.mocked(api.fetchTicketDetail).mockResolvedValue({
            id: 1, ticketNumber: 'TKT-2026-001', summary: 'S', description: 'D',
            category: { id: 1, name: 'C' }, relatedSystem: { id: 1, name: 'RS' },
            status: 'NEW', requestedPriority: 'LOW', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
            requester: { id: 1, name: 'U' }, attachments
        })

        return render(
            <MemoryRouter initialEntries={['/tickets/1']}>
                <Routes>
                    <Route path="/tickets/:id" element={<TicketDetailPage />} />
                </Routes>
            </MemoryRouter>
        )
    }

    it('UI-08: Invalid file (e.g. size > 5MB) shows error and not uploaded', async () => {
        renderPage()
        await waitFor(() => expect(screen.getByText('S')).toBeInTheDocument())
        
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
        
        // Mock ไฟล์ที่ใหญ่กว่า 5MB
        const file = new File(['A'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
        
        fireEvent.change(fileInput, { target: { files: [file] } })
        
        expect(await screen.findByText(/File exceeds 5 MB limit/i)).toBeInTheDocument()
        expect(api.uploadAttachment).not.toHaveBeenCalled()
    })

    it('UI-09: Add button disabled when 5 active attachments exist', async () => {
        const fiveAttachments = Array.from({ length: 5 }).map((_, i) => ({
            id: i + 1, originalFilename: `file${i}.pdf`, mimeType: 'application/pdf',
            sizeBytes: 1000, isRemoved: false, createdAt: new Date().toISOString()
        }))
        
        renderPage(fiveAttachments)
        await waitFor(() => expect(screen.getByText('S')).toBeInTheDocument())
        
        expect(screen.getByText(/5-attachment limit reached/i)).toBeInTheDocument()
        expect(document.querySelector('input[type="file"]')).not.toBeInTheDocument()
    })

    it('UI-10: Soft-remove requires reason and confirms', async () => {
        const att = {
            id: 1, originalFilename: 'test.pdf', mimeType: 'application/pdf',
            sizeBytes: 1000, isRemoved: false, createdAt: new Date().toISOString()
        }
        
        renderPage([att])
        await waitFor(() => expect(screen.getByText('test.pdf')).toBeInTheDocument())
        
        // กด Remove
        fireEvent.click(screen.getByRole('button', { name: /Remove/i }))
        
        // ต้องมีกล่อง Dialog เด้งขึ้นมา
        const confirmBtn = screen.getByRole('button', { name: /Confirm Remove/i })
        expect(confirmBtn).toBeDisabled() // ตอนแรกต้องกดไม่ได้เพราะยังไม่ได้ใส่เหตุผล
        
        // ใส่เหตุผล
        fireEvent.change(screen.getByPlaceholderText(/Enter reason/i), { target: { value: 'Wrong file' } })
        expect(confirmBtn).not.toBeDisabled()
        
        // กดยืนยัน
        vi.mocked(api.removeAttachment).mockResolvedValue({ ...att, isRemoved: true, removalReason: 'Wrong file' })
        fireEvent.click(confirmBtn)
        
        // ตรวจสอบว่า API ถูกเรียกไป
        expect(api.removeAttachment).toHaveBeenCalledWith(1, 1, 'Wrong file')
    })
})
