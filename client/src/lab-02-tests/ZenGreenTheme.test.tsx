import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import { RequesterProvider } from '../context/RequesterContext'
import AppShell from '../components/AppShell'

describe('ZenGreenTheme', () => {
    it('STYLE-01: Zen Green primary color applied to app header', () => {
        render(
            <MemoryRouter>
                <RequesterProvider>
                    <AppShell>
                        <div>Content</div>
                    </AppShell>
                </RequesterProvider>
            </MemoryRouter>
        )
        
        const header = screen.getByRole('navigation')
        // ตรวจสอบว่ามี background เป็น var(--color-primary) เนื่องจาก JSDOM ไม่ทำการแปลง CSS Variable
        expect(header).toHaveStyle({ background: 'var(--color-primary)' })
    })
})
