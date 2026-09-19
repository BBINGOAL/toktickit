import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import UserManagement from '../pages/UserManagement'
import * as api from '../api'
import * as authContext from '../context/AuthContext'

vi.mock('../api')
vi.mock('../context/AuthContext')

describe('Lab 3 admin user management', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.spyOn(authContext, 'useAuth').mockReturnValue({ user: { id: 1, name: 'Admin', role: 'ADMIN' }, setUser: vi.fn(), logout: vi.fn(), loading: false })
        vi.mocked(api.fetchAdminUsers).mockResolvedValue([{ id: 1, name: 'Admin', email: 'admin@kmutt.ac.th', role: 'ADMIN', isActive: true, mustChangePassword: false, createdAt: '', updatedAt: '' }])
    })

    it('loads users and opens the create-user form', async () => {
        render(<MemoryRouter><UserManagement /></MemoryRouter>)
        await waitFor(() => expect(screen.getByText('Admin')).toBeInTheDocument())
        fireEvent.click(screen.getByText('+ New User'))
        expect(screen.getByText('Create New User')).toBeInTheDocument()
        expect(screen.getAllByRole('textbox').length).toBeGreaterThanOrEqual(4)
        expect(screen.getByPlaceholderText('e.g. password123')).toBeInTheDocument()
    })
})
