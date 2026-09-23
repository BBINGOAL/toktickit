import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../../src/app'
import jwt from 'jsonwebtoken'
import { prisma } from '../../src/db'
import { createTestUser, createTestTicket, removeTestData } from './test-helpers'

const JWT_SECRET = process.env.JWT_SECRET || 'toktickit-super-secret-key'

function generateToken(userId: number, role: string) {
    return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '1h' })
}

describe('Ticket Collaboration APIs (Comments & Notes)', () => {
    let itStaffToken: string
    let requesterToken: string
    let testTicketId: number
    const userIds: number[] = []
    let staffId: number

    beforeAll(async () => {
        const itStaff = await createTestUser('IT_STAFF')
        userIds.push(itStaff.id)
        const requester = await createTestUser()
        userIds.push(requester.id)
        staffId = itStaff.id
        itStaffToken = generateToken(itStaff.id, itStaff.role)
        requesterToken = generateToken(requester.id, requester.role)
        testTicketId = (await createTestTicket(requester.id)).id
    })

    afterAll(async () => {
        await removeTestData(userIds, testTicketId ? [testTicketId] : [])
        await prisma.$disconnect()
    })

    describe('Public Comments', () => {
        it('should allow Requester to post a public comment', async () => {
            const res = await request(app)
                .post(`/api/tickets/${testTicketId}/comments`)
                .set('Cookie', [`token=${requesterToken}`])
                .send({ content: 'Hello from Requester' })
            expect(res.status).toBe(201)
            expect(res.body.content).toBe('Hello from Requester')
        })

        it('should allow IT Staff to post a public comment', async () => {
            const res = await request(app)
                .post(`/api/tickets/${testTicketId}/comments`)
                .set('Cookie', [`token=${itStaffToken}`])
                .send({ content: 'Hello from IT Staff' })
            expect(res.status).toBe(201)
            expect(res.body.content).toBe('Hello from IT Staff')
        })

        it('should retrieve all public comments for both roles', async () => {
            const resReq = await request(app).get(`/api/tickets/${testTicketId}/comments`).set('Cookie', [`token=${requesterToken}`])
            const resIt = await request(app).get(`/api/tickets/${testTicketId}/comments`).set('Cookie', [`token=${itStaffToken}`])
            
            expect(resReq.status).toBe(200)
            expect(resIt.status).toBe(200)
            expect(resReq.body.length).toBeGreaterThanOrEqual(2)
            expect(resIt.body.length).toBeGreaterThanOrEqual(2)
        })
    })

    describe('Internal Notes', () => {
        it('should allow IT Staff to post an internal note', async () => {
            const res = await request(app)
                .post(`/api/tickets/${testTicketId}/notes`)
                .set('Cookie', [`token=${itStaffToken}`])
                .send({ content: 'Secret IT Note' })
            expect(res.status).toBe(201)
            expect(res.body.content).toBe('Secret IT Note')
        })

        it('should forbid Requester from posting an internal note', async () => {
            const res = await request(app)
                .post(`/api/tickets/${testTicketId}/notes`)
                .set('Cookie', [`token=${requesterToken}`])
                .send({ content: 'I am trying to post a secret note' })
            expect(res.status).toBe(403)
        })

        it('should forbid Requester from retrieving internal notes', async () => {
            const res = await request(app)
                .get(`/api/tickets/${testTicketId}/notes`)
                .set('Cookie', [`token=${requesterToken}`])
            expect(res.status).toBe(403)
        })

        it('should allow IT Staff to retrieve internal notes', async () => {
            const res = await request(app)
                .get(`/api/tickets/${testTicketId}/notes`)
                .set('Cookie', [`token=${itStaffToken}`])
            expect(res.status).toBe(200)
            expect(res.body.length).toBeGreaterThanOrEqual(1)
        })
    })
})
