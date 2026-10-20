import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TicketDetailPage from '../pages/TicketDetailPage'
import * as api from '../api'
import * as workflow from '../api/workflow'
import * as authContext from '../context/AuthContext'

vi.mock('../api')
vi.mock('../api/workflow')
vi.mock('../context/AuthContext')

const detail = {
    version: 0, workCycle: 1, allowedNextStatuses: ['IN_PROGRESS','WAITING_FOR_REQUESTER','CANCELLED'],
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
        vi.mocked(workflow.changeWorkflow).mockResolvedValue({ ...detail, status: 'IN_PROGRESS', version: 1 })
        vi.mocked(workflow.fetchWorkflowHistory).mockResolvedValue({data:[],meta:{page:1,pageSize:10,totalItems:0,totalPages:0}})
        render(<MemoryRouter initialEntries={['/tickets/1']}><Routes><Route path="/tickets/:id" element={<TicketDetailPage />} /></Routes></MemoryRouter>)
        await waitFor(() => expect(screen.getByText('TKT-DETAIL')).toBeInTheDocument())
        fireEvent.change(screen.getByDisplayValue('OPEN'), { target: { value: 'IN_PROGRESS' } })
        fireEvent.click(screen.getByRole('button',{name:'Apply status'}))
        await waitFor(() => expect(workflow.changeWorkflow).toHaveBeenCalledWith(1, 'status', {status:'IN_PROGRESS',expectedVersion:0}, expect.any(String)))
    })
})
