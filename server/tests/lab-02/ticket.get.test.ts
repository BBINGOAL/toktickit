import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import app from '../../src/app'

import { requesterFixture } from './fixtures'
const fixture = requesterFixture()
let createdTicketId: number

const validTicketBody = {
    get categoryId() { return fixture.categoryId },
    get relatedSystemId() { return fixture.relatedSystemId },
    summary: 'GET laptop Ticket Test',
    description: 'Testing retrieving tickets via GET.',
    requestedPriority: 'LOW',
}

describe('Ticket GET APIs', () => {
    beforeAll(async () => {
        // Create a ticket to test GET /api/tickets/:id
        const res = await request(app)
            .post('/api/tickets')
            .set('Cookie', fixture.cookie)
            .send(validTicketBody)
        createdTicketId = res.body.id
    })

    describe('GET /api/tickets', () => {
        it('should return 401 if session cookie is missing', async () => {
            const res = await request(app).get('/api/tickets')
            expect(res.status).toBe(401)
        })

        it('should return paginated tickets for the requester', async () => {
            const res = await request(app)
                .get('/api/tickets')
                .set('Cookie', fixture.cookie)
            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty('data')
            expect(res.body).toHaveProperty('meta')
            expect(Array.isArray(res.body.data)).toBe(true)
            expect(res.body.meta).toHaveProperty('totalItems')
            expect(res.body.meta).toHaveProperty('totalPages')
        })

        it('should return 400 for invalid pageSize', async () => {
            const res = await request(app)
                .get('/api/tickets?pageSize=99')
                .set('Cookie', fixture.cookie)
            expect(res.status).toBe(400)
        })

        it('should filter by search keyword', async () => {
            const res = await request(app)
                .get('/api/tickets?search=laptop')
                .set('Cookie', fixture.cookie)
            expect(res.status).toBe(200)
            expect(res.body.data.length).toBeGreaterThan(0)
            res.body.data.forEach((t: { summary: string; ticketNumber: string }) => {
                const match = t.summary.toLowerCase().includes('laptop') ||
                    t.ticketNumber.toLowerCase().includes('laptop')
                expect(match).toBe(true)
            })
        })
    })

    describe('GET /api/tickets/:id', () => {
        it('should return full ticket detail with attachments array', async () => {
            const res = await request(app)
                .get(`/api/tickets/${createdTicketId}`)
                .set('Cookie', fixture.cookie)
            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty('attachments')
            expect(Array.isArray(res.body.attachments)).toBe(true)
            expect(res.body).toHaveProperty('requester')
            expect(res.body).toHaveProperty('category')
        })

        it('should return 404 for non-existent ticket', async () => {
            const res = await request(app)
                .get('/api/tickets/999999')
                .set('Cookie', fixture.cookie)
            expect(res.status).toBe(404)
        })

        it('should return 403 for another requester\'s ticket', async () => {
            const res = await request(app)
                .get(`/api/tickets/${createdTicketId}`)
                .set('Cookie', fixture.otherCookie)
            expect(res.status).toBe(403)
        })
    })
})
