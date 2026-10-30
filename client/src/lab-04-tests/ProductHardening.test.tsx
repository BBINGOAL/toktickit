import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import UserManagement from '../pages/UserManagement'
import { useAuth } from '../context/AuthContext'
import * as api from '../api'

vi.mock('../api')
vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }))
const admin = { id: 1, name: 'Existing admin', email: 'admin@example.test', role: 'ADMIN', isActive: true, mustChangePassword: false, createdAt: '', updatedAt: '' }
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(useAuth).mockReturnValue({ user: admin, loading: false, setUser: vi.fn(), logout: vi.fn() })
  vi.mocked(api.fetchAdminUsers).mockResolvedValue([admin])
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})
function page() { return render(<MemoryRouter><UserManagement /></MemoryRouter>) }

it('labels user filters and ignores a slower previous search', async () => {
  let finish!: (users: typeof admin[]) => void
  vi.mocked(api.fetchAdminUsers).mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    .mockResolvedValueOnce([{ ...admin, id: 2, name: 'Latest matching user' }])
  page()
  fireEvent.change(screen.getByRole('textbox', { name: 'Search users' }), { target: { value: 'Latest' } })
  await screen.findByText('Latest matching user')
  await act(async () => finish([admin]))
  expect(screen.queryByText('Existing admin', { exact: true })).not.toBeInTheDocument()
  expect(screen.getByRole('combobox', { name: 'Filter users by role' })).toBeVisible()
})
it('shows safe list failure with retry instead of a false empty result', async () => {
  vi.mocked(api.fetchAdminUsers).mockRejectedValueOnce(new Error('SQL PRIVATE'))
  page()
  expect(await screen.findByRole('alert')).not.toHaveTextContent('PRIVATE')
  expect(screen.queryByText('No users found.')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Retry users' }))
  expect(await screen.findByText('Existing admin', { exact: true })).toBeVisible()
})
it('traps user-dialog focus, confirms a dirty close and restores the opener', async () => {
  page(); await screen.findByText('Existing admin', { exact: true })
  const trigger = screen.getByRole('button', { name: '+ New User' })
  trigger.focus(); fireEvent.click(trigger)
  const dialog = screen.getByRole('dialog', { name: 'Create New User' })
  expect(dialog).toHaveFocus()
  fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Keep my draft' } })
  fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'draft@example.test' } })
  dialog.focus()
  fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true })
  expect(within(dialog).getByRole('button', { name: 'Save User' })).toHaveFocus()
  fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Keep my draft' } })
  vi.mocked(window.confirm).mockReturnValueOnce(false)
  fireEvent.keyDown(dialog, { key: 'Escape' })
  expect(dialog).toBeInTheDocument()
  fireEvent.keyDown(dialog, { key: 'Escape' })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(trigger).toHaveFocus()
})
it('retains user fields on save failure and prevents repeated saves while pending', async () => {
  let fail!: (reason: unknown) => void
  vi.mocked(api.createAdminUser).mockImplementation(() => new Promise((_, reject) => { fail = reject }))
  page(); await screen.findByText('Existing admin', { exact: true })
  fireEvent.click(screen.getByRole('button', { name: '+ New User' }))
  fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Preserved name' } })
  fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'preserved@example.test' } })
  fireEvent.change(screen.getByLabelText('Initial Password'), { target: { value: 'password123' } })
  const save = screen.getByRole('button', { name: 'Save User' })
  fireEvent.click(save); fireEvent.click(save)
  expect(api.createAdminUser).toHaveBeenCalledOnce()
  await act(async () => fail(new TypeError('Network failed')))
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to save user')
  expect(screen.getByLabelText('Full Name')).toHaveValue('Preserved name')
  expect(screen.getByLabelText('Initial Password')).toHaveValue('password123')
  await waitFor(() => expect(screen.getByRole('button', { name: 'Save User' })).toBeEnabled())
})
