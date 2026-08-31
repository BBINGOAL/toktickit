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
        
        const header = screen.getByRole('banner')
        // ตรวจสอบว่ามี backgroundColor เป็น #006B3C หรือคล้ายคลึง
        expect(header).toHaveStyle({ backgroundColor: '#006B3C' })
    })
})
