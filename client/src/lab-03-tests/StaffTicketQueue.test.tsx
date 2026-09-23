import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ITStaffQueue from '../pages/ITStaffQueue'
import * as api from '../api'
import * as authContext from '../context/AuthContext'

vi.mock('../api')
vi.mock('../context/AuthContext')

describe('Lab 3 staff ticket queue', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.spyOn(authContext, 'useAuth').mockReturnValue({ user: { id: 2, name: 'Staff', role: 'IT_STAFF' }, setUser: vi.fn(), logout: vi.fn(), loading: false })
        vi.mocked(api.fetchStaffTickets).mockResolvedValue({
            data: [{ id: 1, ticketNumber: 'TKT-001', summary: 'Network issue', category: { id: 1, name: 'Network' }, relatedSystem: { id: 1, name: 'VPN' }, requestedPriority: 'HIGH', itPriority: 'HIGH', status: 'OPEN', owner: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
            meta: { page: 1, pageSize: 50, totalItems: 1, totalPages: 1 },
        })
    })

    it('loads queue rows and supports search/filter controls', async () => {
        render(<MemoryRouter><ITStaffQueue /></MemoryRouter>)
        await waitFor(() => expect(screen.getByText('TKT-001')).toBeInTheDocument())
        expect(screen.getByText('1 tickets found')).toBeInTheDocument()

        fireEvent.change(screen.getByPlaceholderText(/Search ticket number/i), { target: { value: 'VPN' } })
        fireEvent.click(screen.getByRole('button', { name: 'Search' }))
        await waitFor(() => expect(api.fetchStaffTickets).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'VPN' })))
    })
})
