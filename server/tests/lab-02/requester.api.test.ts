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

describe('Removed development authentication', () => {
    it('does not expose the old requester directory', async () => {
        expect((await request(app).get('/api/requesters')).status).toBe(404)
    })
    it('does not accept an impersonated requester header', async () => {
        expect((await request(app).get('/api/tickets').set('X-Requester-Id', '1')).status).toBe(401)
    })
    it('requires a session for current-user identity', async () => {
        expect((await request(app).get('/api/auth/me')).status).toBe(401)
    })
})
