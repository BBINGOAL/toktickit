import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from './App'
import { getCurrentUser } from './api'
vi.mock('./api', () => ({ getCurrentUser: vi.fn() }))
beforeEach(() => {
  vi.mocked(getCurrentUser).mockRejectedValue(new Error('Unauthorized'))
  window.history.replaceState({}, '', '/')
})
describe('Application authentication regression', () => {
  it('renders sign-in instead of the retired system-check screen', async () => {
    render(<App />)
    expect(await screen.findByRole('button', { name: 'Sign In' })).toBeVisible()
    expect(screen.queryByRole('button', { name: /check system/i })).not.toBeInTheDocument()
    await waitFor(() => expect(getCurrentUser).toHaveBeenCalled())
  })
  it('redirects unauthenticated ticket access to login', async () => {
    window.history.replaceState({}, '', '/tickets')
    render(<App />)
    expect(await screen.findByRole('button', { name: 'Sign In' })).toBeVisible()
    expect(window.location.pathname).toBe('/')
  })
  it('keeps login available when session lookup fails', async () => {
    vi.mocked(getCurrentUser).mockRejectedValue(new Error('Network error'))
    render(<App />)
    expect(await screen.findByLabelText('Email Address')).toBeVisible()
    await waitFor(() => expect(screen.queryByText('Loading session...')).not.toBeInTheDocument())
  })
})
