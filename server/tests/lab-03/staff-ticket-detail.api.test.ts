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

describe('IT Staff Ticket Detail & Operations API', () => {
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

    describe('PATCH /api/tickets/:id/status', () => {
        it('should allow IT Staff to update status', async () => {
            const res = await request(app)
                .patch(`/api/tickets/${testTicketId}/status`)
                .set('Cookie', [`token=${itStaffToken}`])
                .send({ status: 'IN_PROGRESS' })
            expect(res.status).toBe(200)
            expect(res.body.status).toBe('IN_PROGRESS')
        })

        it('should forbid Requester from updating status', async () => {
            const res = await request(app)
                .patch(`/api/tickets/${testTicketId}/status`)
                .set('Cookie', [`token=${requesterToken}`])
                .send({ status: 'RESOLVED' })
            expect(res.status).toBe(403)
        })
    })

    describe('PATCH /api/tickets/:id/priority', () => {
        it('should allow IT Staff to update IT priority', async () => {
            const res = await request(app)
                .patch(`/api/tickets/${testTicketId}/priority`)
                .set('Cookie', [`token=${itStaffToken}`])
                .send({ itPriority: 'HIGH' })
            expect(res.status).toBe(200)
            expect(res.body.itPriority).toBe('HIGH')
        })

        it('should forbid Requester from updating priority', async () => {
            const res = await request(app)
                .patch(`/api/tickets/${testTicketId}/priority`)
                .set('Cookie', [`token=${requesterToken}`])
                .send({ itPriority: 'MEDIUM' })
            expect(res.status).toBe(403)
        })
    })

    describe('PATCH /api/tickets/:id/owner', () => {
        it('should allow IT Staff to take over ownership', async () => {
            const res = await request(app)
                .patch(`/api/tickets/${testTicketId}/owner`)
                .set('Cookie', [`token=${itStaffToken}`])
                .send({ ownerId: staffId })
            expect(res.status).toBe(200)
            expect(res.body.ownerId).toBe(staffId)
        })

        it('should forbid Requester from updating owner', async () => {
            const res = await request(app)
                .patch(`/api/tickets/${testTicketId}/owner`)
                .set('Cookie', [`token=${requesterToken}`])
                .send({ ownerId: 999 })
            expect(res.status).toBe(403)
        })
    })
})
