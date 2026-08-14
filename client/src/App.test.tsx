import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from './App'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockClear()
})

// UI-01: TokTickIT heading renders
describe('UI-01: App renders', () => {
  it('renders TokTickIT heading', () => {
    render(<App />)
    expect(screen.getByText('TokTickIT')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /check system/i })).toBeInTheDocument()
  })
})

// UI-02: Loading state → category list
describe('UI-02: Check System success', () => {
  it('shows loading then displays categories', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok', service: 'TokTickIT API' }),
    })

    // Mock ครั้งที่ 2 สำหรับ categories
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok' }),
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, name: 'Account and Access' },
        { id: 2, name: 'Hardware' },
        { id: 3, name: 'Software' },
        { id: 4, name: 'Network' },
      ],
    })

    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /check system/i }))

    // เห็น loading ก่อน
    expect(screen.getByText(/loading/i)).toBeInTheDocument()

    // รอจนเห็น Online
    await waitFor(() => {
      expect(screen.getByText(/online/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/Hardware/)).toBeInTheDocument()
  })
})

// UI-03: Error state
describe('UI-03: Check System failure', () => {
  it('shows error message when API fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /check system/i }))

    await waitFor(() => {
      expect(screen.getByText(/offline/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/unable to connect/i)).toBeInTheDocument()
  })
})
