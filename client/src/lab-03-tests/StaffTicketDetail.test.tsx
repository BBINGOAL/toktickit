import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TicketDetailPage from '../pages/TicketDetailPage'
import * as api from '../api'
import * as authContext from '../context/AuthContext'

vi.mock('../api')
vi.mock('../context/AuthContext')

const detail = {
    id: 1, ticketNumber: 'TKT-DETAIL', summary: 'Printer issue', description: 'Cannot print', requestedPriority: 'MEDIUM', itPriority: 'MEDIUM', status: 'OPEN', requesterResolved: false,
    category: { id: 1, name: 'Hardware' }, relatedSystem: { id: 1, name: 'Campus Wi-Fi' }, requester: { id: 10, name: 'Requester' }, owner: { id: 2, name: 'Staff' }, attachments: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
}

describe('Lab 3 staff ticket detail', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.spyOn(authContext, 'useAuth').mockReturnValue({ user: { id: 2, name: 'Staff', role: 'IT_STAFF' }, setUser: vi.fn(), logout: vi.fn(), loading: false })
        vi.mocked(api.fetchTicketDetail).mockResolvedValue(detail)
        vi.mocked(api.fetchComments).mockResolvedValue([])
        vi.mocked(api.fetchNotes).mockResolvedValue([])
    })

    it('shows staff controls and allows status updates', async () => {
        vi.mocked(api.updateTicketStatus).mockResolvedValue({ ...detail, status: 'IN_PROGRESS' })
        render(<MemoryRouter initialEntries={['/tickets/1']}><Routes><Route path="/tickets/:id" element={<TicketDetailPage />} /></Routes></MemoryRouter>)
        await waitFor(() => expect(screen.getByText('TKT-DETAIL')).toBeInTheDocument())
        fireEvent.change(screen.getByDisplayValue('OPEN'), { target: { value: 'IN_PROGRESS' } })
        await waitFor(() => expect(api.updateTicketStatus).toHaveBeenCalledWith(1, 'IN_PROGRESS'))
    })
})
