import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { RequesterProvider } from '../context/RequesterContext'
import RequesterSelectionPage from '../pages/RequesterSelectionPage'
import * as api from '../api'

vi.mock('../api', () => ({
    fetchRequesters: vi.fn()
}))

describe('RequesterSelector', () => {
    it('UI-01: Renders selector when no requester selected', async () => {
        vi.mocked(api.fetchRequesters).mockResolvedValue([])
        
        render(
            <MemoryRouter initialEntries={['/']}>
                <RequesterProvider>
                    <RequesterSelectionPage />
                </RequesterProvider>
            </MemoryRouter>
        )
        
        expect(screen.getByText(/Select Development Requester/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Select Requester/i })).toBeDisabled()
    })

    it('UI-02: Only shows active requesters in dropdown', async () => {
        vi.mocked(api.fetchRequesters).mockResolvedValue([
            { id: 1, name: 'Active User', email: 'active@test.com', isActive: true },
            { id: 2, name: 'Inactive User', email: 'inactive@test.com', isActive: false }
        ])
        
        render(
            <MemoryRouter initialEntries={['/']}>
                <RequesterProvider>
                    <RequesterSelectionPage />
                </RequesterProvider>
            </MemoryRouter>
        )
        
        await waitFor(() => {
            const options = screen.getAllByRole('option')
            expect(options.map(o => o.textContent)).toContain('Active User')
            expect(options.map(o => o.textContent)).not.toContain('Inactive User')
        })
    })
})
