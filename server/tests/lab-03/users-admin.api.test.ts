import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import app from '../../src/app'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '../../src/generated/prisma/client'
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import bcrypt from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5434/localdb' })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const JWT_SECRET = process.env.JWT_SECRET || 'toktickit-super-secret-key'

function generateToken(userId: number, role: string) {
    return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '1h' })
}

describe('Admin User Management APIs', () => {
    let adminToken: string
    let itStaffToken: string
    let adminUserId: number

    beforeAll(async () => {
        let admin = await prisma.user.findFirst({ where: { role: 'ADMIN', isActive: true } })
        let itStaff = await prisma.user.findFirst({ where: { role: 'IT_STAFF', isActive: true } })

        if (!admin || !itStaff) {
            throw new Error('Seed data missing for tests')
        }

        adminUserId = admin.id
        adminToken = generateToken(admin.id, admin.role)
        itStaffToken = generateToken(itStaff.id, itStaff.role)
    })

    describe('GET /api/admin/users', () => {
        it('should allow ADMIN to fetch users', async () => {
            const res = await request(app)
                .get('/api/admin/users')
                .set('Cookie', [`token=${adminToken}`])
            expect(res.status).toBe(200)
            expect(Array.isArray(res.body)).toBe(true)
        })

        it('should forbid IT_STAFF from fetching users', async () => {
            const res = await request(app)
                .get('/api/admin/users')
                .set('Cookie', [`token=${itStaffToken}`])
            expect(res.status).toBe(403)
        })
    })

    describe('POST /api/admin/users', () => {
        it('should allow ADMIN to create a new user', async () => {
            const res = await request(app)
                .post('/api/admin/users')
                .set('Cookie', [`token=${adminToken}`])
                .send({
                    name: 'New Test User',
                    email: `testuser_${Date.now()}@kmutt.ac.th`,
                    role: 'REQUESTER',
                    initialPassword: 'password123'
                })
            expect(res.status).toBe(201)
            expect(res.body.name).toBe('New Test User')
            expect(res.body.isActive).toBe(true)
        })

        it('should prevent creating a user with a duplicate email', async () => {
            const email = `duplicate_${Date.now()}@kmutt.ac.th`
            await request(app).post('/api/admin/users').set('Cookie', [`token=${adminToken}`]).send({
                name: 'Dup 1', email, role: 'REQUESTER', initialPassword: 'pw'
            })
            
            const res = await request(app).post('/api/admin/users').set('Cookie', [`token=${adminToken}`]).send({
                name: 'Dup 2', email, role: 'REQUESTER', initialPassword: 'pw'
            })
            expect(res.status).toBe(409)
        })
    })

    describe('PUT /api/admin/users/:id', () => {
        let testUserId: number;

        beforeAll(async () => {
            const u = await prisma.user.create({
                data: {
                    name: 'To Be Edited',
                    email: `edit_${Date.now()}@kmutt.ac.th`,
                    role: 'REQUESTER',
                    passwordHash: 'hash',
                    isActive: true
                }
            })
            testUserId = u.id
        })

        it('should allow ADMIN to edit a user', async () => {
            const res = await request(app)
                .put(`/api/admin/users/${testUserId}`)
                .set('Cookie', [`token=${adminToken}`])
                .send({ name: 'Edited Name', email: `edited_${Date.now()}@kmutt.ac.th`, role: 'IT_STAFF', isActive: false })
            expect(res.status).toBe(200)
            expect(res.body.name).toBe('Edited Name')
            expect(res.body.isActive).toBe(false)
        })

        it('should prevent ADMIN from deactivating themselves', async () => {
            const res = await request(app)
                .put(`/api/admin/users/${adminUserId}`)
                .set('Cookie', [`token=${adminToken}`])
                .send({ isActive: false })
            expect(res.status).toBe(400)
            expect(res.body.error).toContain('cannot deactivate your own account')
        })
    })

    describe('POST /api/admin/users/:id/reset-password', () => {
        let testUserId: number;

        beforeAll(async () => {
            const u = await prisma.user.create({
                data: {
                    name: 'Password Reset User',
                    email: `pw_${Date.now()}@kmutt.ac.th`,
                    role: 'REQUESTER',
                    passwordHash: 'oldhash',
                    mustChangePassword: false,
                    isActive: true
                }
            })
            testUserId = u.id
        })

        it('should allow ADMIN to set a new initial password', async () => {
            const res = await request(app)
                .post(`/api/admin/users/${testUserId}/reset-password`)
                .set('Cookie', [`token=${adminToken}`])
                .send({ newInitialPassword: 'newsecurepassword' })
            expect(res.status).toBe(200)

            const dbUser = await prisma.user.findUnique({ where: { id: testUserId } })
            expect(dbUser?.mustChangePassword).toBe(true)
            const isValid = await bcrypt.compare('newsecurepassword', dbUser!.passwordHash)
            expect(isValid).toBe(true)
        })
    })
})
