import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../../src/app'

describe('Reference Data APIs', () => {
    describe('GET /api/categories', () => {
        it('should return a list of categories', async () => {
            const res = await request(app).get('/api/categories')
            expect(res.status).toBe(200)
            expect(Array.isArray(res.body)).toBe(true)
            if (res.body.length > 0) {
                expect(res.body[0]).toHaveProperty('id')
                expect(res.body[0]).toHaveProperty('name')
            }
        })
    })

    describe('GET /api/related-systems', () => {
        it('should return a list of related systems', async () => {
            const res = await request(app).get('/api/related-systems')
            expect(res.status).toBe(200)
            expect(Array.isArray(res.body)).toBe(true)
            if (res.body.length > 0) {
                expect(res.body[0]).toHaveProperty('id')
                expect(res.body[0]).toHaveProperty('name')
            }
        })
    })
})
