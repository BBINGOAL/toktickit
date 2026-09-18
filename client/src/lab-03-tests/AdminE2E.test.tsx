import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import UserManagement from '../pages/UserManagement'
import * as api from '../api'
import * as authContext from '../context/AuthContext'

vi.mock('../api')
vi.mock('../context/AuthContext')

describe('Admin User Management (E2E Overview in UI)', () => {
    const mockUsers = [
        { id: 1, name: 'Admin One', email: 'admin1@test.com', role: 'ADMIN', isActive: true, mustChangePassword: false, createdAt: '', updatedAt: '' },
        { id: 2, name: 'Staff One', email: 'staff1@test.com', role: 'IT_STAFF', isActive: true, mustChangePassword: true, createdAt: '', updatedAt: '' }
    ]

    beforeEach(() => {
        vi.clearAllMocks()
        vi.spyOn(authContext, 'useAuth').mockReturnValue({ 
            user: { userId: 1, name: 'Admin One', role: 'ADMIN' },
            login: vi.fn(),
            logout: vi.fn(),
            changePassword: vi.fn(),
            loading: false
        })
        vi.mocked(api.fetchAdminUsers).mockResolvedValue(mockUsers)
    })

    it('should deny access if user is not an admin', () => {
        vi.spyOn(authContext, 'useAuth').mockReturnValue({ 
            user: { userId: 2, name: 'Staff One', role: 'IT_STAFF' },
            login: vi.fn(), logout: vi.fn(), changePassword: vi.fn(), loading: false
        })
        render(<UserManagement />)
        expect(screen.getByText(/Access Denied/i)).toBeInTheDocument()
    })

    it('should load and display users', async () => {
        render(
            <MemoryRouter>
                <UserManagement />
            </MemoryRouter>
        )
        expect(screen.getByText(/Loading users/i)).toBeInTheDocument()
        
        await waitFor(() => {
            expect(screen.getByText('Admin One')).toBeInTheDocument()
        })
        expect(screen.getByText('Staff One')).toBeInTheDocument()
        expect(screen.getByText('Needs Password Reset')).toBeInTheDocument()
    })

    it('should allow filtering and searching', async () => {
        render(<MemoryRouter><UserManagement /></MemoryRouter>)
        await waitFor(() => expect(screen.getByText('Admin One')).toBeInTheDocument())
        
        const searchInput = screen.getByPlaceholderText(/Search by name or email/i)
        fireEvent.change(searchInput, { target: { value: 'Staff' } })
        expect(api.fetchAdminUsers).toHaveBeenCalledWith('Staff', '')

        const roleSelect = screen.getByRole('combobox')
        fireEvent.change(roleSelect, { target: { value: 'IT_STAFF' } })
        expect(api.fetchAdminUsers).toHaveBeenCalledWith('Staff', 'IT_STAFF')
    })

    it('should open modal and create a new user', async () => {
        vi.mocked(api.createAdminUser).mockResolvedValue({
            id: 3, name: 'New User', email: 'new@test.com', role: 'REQUESTER', isActive: true, mustChangePassword: true, createdAt: '', updatedAt: ''
        })

        render(<MemoryRouter><UserManagement /></MemoryRouter>)
        await waitFor(() => expect(screen.getByText('Admin One')).toBeInTheDocument())

        fireEvent.click(screen.getByText('+ New User'))
        
        expect(screen.getByText('Create New User')).toBeInTheDocument()

        fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'New User' } })
        fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'new@test.com' } })
        fireEvent.change(screen.getByPlaceholderText(/password123/i), { target: { value: 'pass123' } })

        fireEvent.click(screen.getByText('Save User'))

        await waitFor(() => {
            expect(api.createAdminUser).toHaveBeenCalledWith({
                name: 'New User',
                email: 'new@test.com',
                role: 'REQUESTER',
                isActive: true,
                initialPassword: 'pass123'
            })
        })
    })

    it('should edit user and reset password', async () => {
        vi.mocked(api.updateAdminUser).mockResolvedValue(mockUsers[1])
        vi.mocked(api.resetAdminUserPassword).mockResolvedValue({ message: 'Password reset successfully' })

        render(<MemoryRouter><UserManagement /></MemoryRouter>)
        await waitFor(() => expect(screen.getByText('Admin One')).toBeInTheDocument())

        const editButtons = screen.getAllByText('Edit')
        fireEvent.click(editButtons[1]) // Edit Staff One

        expect(screen.getByText('Edit User')).toBeInTheDocument()

        fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Staff One Updated' } })
        fireEvent.click(screen.getByText('Save User'))

        await waitFor(() => {
            expect(api.updateAdminUser).toHaveBeenCalledWith(2, {
                name: 'Staff One Updated',
                email: 'staff1@test.com',
                role: 'IT_STAFF',
                isActive: true
            })
        })
        
        // Open edit again to test reset password
        fireEvent.click(screen.getAllByText('Edit')[1])
        fireEvent.change(screen.getByPlaceholderText(/password123/i), { target: { value: 'newpass' } })
        fireEvent.click(screen.getByText('Reset'))

        await waitFor(() => {
            expect(api.resetAdminUserPassword).toHaveBeenCalledWith(2, 'newpass')
            expect(screen.getByText(/Password reset successfully/i)).toBeInTheDocument()
        })
    })
})
