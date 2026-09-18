import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import app from '../../src/app'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '../../src/generated/prisma/client'
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5434/localdb' })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const JWT_SECRET = process.env.JWT_SECRET || 'toktickit-super-secret-key'

function generateToken(userId: number, role: string) {
    return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '1h' })
}

describe('IT Staff Ticket Detail & Operations API', () => {
    let itStaffToken: string
    let requesterToken: string
    let testTicketId: number

    beforeAll(async () => {
        // Find users
        const itStaff = await prisma.user.findFirst({ where: { role: 'IT_STAFF', isActive: true } })
        const requester = await prisma.user.findFirst({ where: { role: 'REQUESTER', isActive: true } })
        const cat = await prisma.category.findFirst()
        const sys = await prisma.relatedSystem.findFirst()

        if (!itStaff || !requester || !cat || !sys) {
            throw new Error('Seed data missing for tests')
        }

        itStaffToken = generateToken(itStaff.id, itStaff.role)
        requesterToken = generateToken(requester.id, requester.role)

        // Create a test ticket
        const ticket = await prisma.ticket.create({
            data: {
                ticketNumber: 'TEST-001',
                summary: 'Test ticket for operations',
                description: 'Test desc',
                requestedPriority: 'LOW',
                status: 'OPEN',
                requesterId: requester.id,
                categoryId: cat.id,
                relatedSystemId: sys.id
            }
        })
        testTicketId = ticket.id
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
            const itStaff = await prisma.user.findFirst({ where: { role: 'IT_STAFF' } })
            const res = await request(app)
                .patch(`/api/tickets/${testTicketId}/owner`)
                .set('Cookie', [`token=${itStaffToken}`])
                .send({ ownerId: itStaff!.id })
            expect(res.status).toBe(200)
            expect(res.body.ownerId).toBe(itStaff!.id)
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
