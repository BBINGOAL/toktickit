import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 1, name: 'Requester', role: 'REQUESTER' }, logout: vi.fn() }) }))
import AppShell from '../components/AppShell'

describe('ZenGreenTheme', () => {
    it('STYLE-01: Zen Green primary color applied to app header', () => {
        render(
            <MemoryRouter>

                    <AppShell>
                        <div>Content</div>
                    </AppShell>

            </MemoryRouter>
        )
        
        const header = screen.getByRole('navigation')
        // ตรวจสอบว่ามี background เป็น var(--color-primary) เนื่องจาก JSDOM ไม่ทำการแปลง CSS Variable
        expect(header).toHaveStyle({ background: 'var(--color-primary)' })
    })
})
