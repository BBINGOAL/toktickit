import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Login from '../pages/Login'
import * as api from '../api'
import * as authContext from '../context/AuthContext'

vi.mock('../api')
vi.mock('../context/AuthContext')

describe('Lab 3 first-login password change', () => {
    const setUser = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
        vi.spyOn(authContext, 'useAuth').mockReturnValue({ user: null, setUser, logout: vi.fn(), loading: false })
        vi.mocked(api.login).mockResolvedValue({ id: 8, name: 'New User', role: 'REQUESTER', mustChangePassword: true })
        vi.mocked(api.changePassword).mockResolvedValue({ message: 'Password changed successfully' })
    })

    async function reachPasswordChangeForm() {
        render(<MemoryRouter><Login /></MemoryRouter>)
        fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'new@kmutt.ac.th' } })
        fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
        fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))
        await waitFor(() => expect(screen.getByLabelText('New Password')).toBeInTheDocument())
    }

    it('requires matching confirmation before submitting', async () => {
        await reachPasswordChangeForm()
        fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'newpass1' } })
        fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'different' } })
        fireEvent.click(screen.getByRole('button', { name: 'Set Password and Login' }))
        expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
        expect(api.changePassword).not.toHaveBeenCalled()
    })

    it('submits both password fields and clears first-login state', async () => {
        await reachPasswordChangeForm()
        fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'newpass1' } })
        fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'newpass1' } })
        fireEvent.click(screen.getByRole('button', { name: 'Set Password and Login' }))
        await waitFor(() => expect(api.changePassword).toHaveBeenCalledWith('newpass1', 'newpass1'))
        expect(setUser).toHaveBeenCalledWith(expect.objectContaining({ mustChangePassword: false }))
    })
})
