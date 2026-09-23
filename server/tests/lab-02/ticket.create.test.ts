import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../../src/app'

import { requesterFixture } from './fixtures'
const fixture = requesterFixture()

const validBody = {
    get categoryId() { return fixture.categoryId },
    get relatedSystemId() { return fixture.relatedSystemId },
    summary: 'My laptop battery drains quickly',
    description: 'The battery drains much faster than usual even when idle. Started after last update.',
    requestedPriority: 'MEDIUM',
}

describe('POST /api/tickets', () => {

    describe('Session validation', () => {
        it('should return 401 if session cookie is missing', async () => {
            const res = await request(app).post('/api/tickets').send(validBody)
            expect(res.status).toBe(401)
            expect(res.body.error).toBe('Unauthorized')
        })

        it('should return 401 if requester is inactive', async () => {
            const res = await request(app)
                .post('/api/tickets')
                .set('Cookie', fixture.inactiveCookie)
                .send(validBody)
            expect(res.status).toBe(401)
            expect(res.body.error).toBe('Unauthorized')
        })
    })

    describe('Body validation', () => {
        it('should return 400 if summary is too short', async () => {
            const res = await request(app)
                .post('/api/tickets')
                .set('Cookie', fixture.cookie)
                .send({ ...validBody, summary: 'Hi' })
            expect(res.status).toBe(400)
            expect(res.body.details?.summary).toBeDefined()
        })

        it('should return 400 if description is too short', async () => {
            const res = await request(app)
                .post('/api/tickets')
                .set('Cookie', fixture.cookie)
                .send({ ...validBody, description: 'Too short' })
            expect(res.status).toBe(400)
            expect(res.body.details?.description).toBeDefined()
        })

        it('should return 400 if requestedPriority is invalid', async () => {
            const res = await request(app)
                .post('/api/tickets')
                .set('Cookie', fixture.cookie)
                .send({ ...validBody, requestedPriority: 'URGENT' })
            expect(res.status).toBe(400)
            expect(res.body.details?.requestedPriority).toBeDefined()
        })

        it('should return 400 if categoryId is invalid', async () => {
            const res = await request(app)
                .post('/api/tickets')
                .set('Cookie', fixture.cookie)
                .send({ ...validBody, categoryId: 9999 })
            expect(res.status).toBe(400)
            expect(res.body.error).toMatch(/category/i)
        })
    })

    describe('Successful creation', () => {
        it('should create a ticket and return 201 with ticketNumber', async () => {
            const res = await request(app)
                .post('/api/tickets')
                .set('Cookie', fixture.cookie)
                .send(validBody)
            expect(res.status).toBe(201)
            expect(res.body.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/)
            expect(res.body.status).toBe('NEW')
            expect(res.body.requesterId).toBe(fixture.id)
        })

        it('ticket numbers should be sequential', async () => {
            const res1 = await request(app)
                .post('/api/tickets')
                .set('Cookie', fixture.cookie)
                .send({ ...validBody, summary: 'First sequential ticket test' })
            const res2 = await request(app)
                .post('/api/tickets')
                .set('Cookie', fixture.cookie)
                .send({ ...validBody, summary: 'Second sequential ticket test' })

            const num1 = parseInt(res1.body.ticketNumber.split('-')[2])
            const num2 = parseInt(res2.body.ticketNumber.split('-')[2])
            expect(num2).toBe(num1 + 1)
        })
    })
})
