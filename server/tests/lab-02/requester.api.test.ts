import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../../src/app'

describe('GET /api/categories', () => {
    it('should return only active categories', async () => {
        const res = await request(app).get('/api/categories')
        expect(res.status).toBe(200)
        expect(Array.isArray(res.body)).toBe(true)
        expect(res.body.length).toBeGreaterThanOrEqual(4)
        res.body.forEach((cat: { id: number; name: string }) => {
            expect(cat).toHaveProperty('id')
            expect(cat).toHaveProperty('name')
        })
    })

    it('should include the 4 required categories', async () => {
        const res = await request(app).get('/api/categories')
        const names = res.body.map((c: { name: string }) => c.name)
        expect(names).toContain('Account and Access')
        expect(names).toContain('Hardware')
        expect(names).toContain('Software')
        expect(names).toContain('Network')
    })
})

describe('GET /api/related-systems', () => {
    it('should return only active related systems', async () => {
        const res = await request(app).get('/api/related-systems')
        expect(res.status).toBe(200)
        expect(Array.isArray(res.body)).toBe(true)
        expect(res.body.length).toBeGreaterThanOrEqual(6)
    })

    it('should include required systems', async () => {
        const res = await request(app).get('/api/related-systems')
        const names = res.body.map((s: { name: string }) => s.name)
        expect(names).toContain('Email')
        expect(names).toContain('Campus Wi-Fi')
        expect(names).toContain('VPN')
    })
})

describe('GET /api/requesters', () => {
    it('should return only active dev requesters', async () => {
        const res = await request(app).get('/api/requesters')
        expect(res.status).toBe(200)
        expect(Array.isArray(res.body)).toBe(true)
        expect(res.body.length).toBeGreaterThanOrEqual(4)
    })

    it('should not include inactive requester', async () => {
        const res = await request(app).get('/api/requesters')
        const emails = res.body.map((r: { email: string }) => r.email)
        expect(emails).not.toContain('inactive.user@kmutt.ac.th')
    })

    it('each requester should have id, name, and email', async () => {
        const res = await request(app).get('/api/requesters')
        res.body.forEach((r: { id: number; name: string; email: string }) => {
            expect(r).toHaveProperty('id')
            expect(r).toHaveProperty('name')
            expect(r).toHaveProperty('email')
        })
    })
})
