import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Login from '../pages/Login'
import * as api from '../api'
import * as authContext from '../context/AuthContext'

vi.mock('../api')
vi.mock('../context/AuthContext')

describe('Lab 3 login flow', () => {
    const setUser = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
        vi.spyOn(authContext, 'useAuth').mockReturnValue({ user: null, setUser, logout: vi.fn(), loading: false })
    })

    it('logs in an active user and routes by role', async () => {
        vi.mocked(api.login).mockResolvedValue({ id: 7, name: 'IT Staff', role: 'IT_STAFF', mustChangePassword: false })
        render(<MemoryRouter><Login /></MemoryRouter>)

        fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'staff@kmutt.ac.th' } })
        fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
        fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

        await waitFor(() => expect(api.login).toHaveBeenCalledWith({ email: 'staff@kmutt.ac.th', password: 'password123' }))
        expect(setUser).toHaveBeenCalledWith(expect.objectContaining({ role: 'IT_STAFF' }))
    })

    it('shows a validation error when credentials are missing', () => {
        render(<MemoryRouter><Login /></MemoryRouter>)
        fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))
        expect(screen.getByText('Please enter both email and password.')).toBeInTheDocument()
    })
})
