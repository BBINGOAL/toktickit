import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import Login from '../pages/Login'
import { login } from '../api'
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: null, setUser: vi.fn(), loading: false, logout: vi.fn() }) }))
vi.mock('../api', () => ({ login: vi.fn(), changePassword: vi.fn() }))
describe('Replacement of development requester selector', () => {
  it('renders credential login, not an impersonation selector', () => {
    render(<MemoryRouter><Login /></MemoryRouter>)
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeVisible()
    expect(screen.queryByText(/Development Requester Selection/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })
  it('does not admit an inactive account when API rejects login', async () => {
    vi.mocked(login).mockRejectedValue(new Error('Invalid credentials'))
    render(<MemoryRouter><Login /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'inactive@example.test' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))
    expect(await screen.findByText('Invalid credentials')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })
})
