import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import app from '../../src/app'
import { prisma } from '../../src/db'
import { authCookie, createTestUser, createTestTicket, removeTestData, TEST_PASSWORD } from './test-helpers'

describe('Lab 3 authentication and first-login APIs', () => {
    let firstLoginUser: Awaited<ReturnType<typeof createTestUser>>
    let inactiveUser: Awaited<ReturnType<typeof createTestUser>>
    let ticketId: number

    beforeAll(async () => {
        firstLoginUser = await createTestUser('REQUESTER', true)
        inactiveUser = await createTestUser('REQUESTER', false)
        await prisma.user.update({ where: { id: inactiveUser.id }, data: { isActive: false } })
        const ticket = await createTestTicket(firstLoginUser.id, 'AUTH')
        ticketId = ticket.id
    })

    afterAll(async () => {
        if (firstLoginUser && inactiveUser) {
            await removeTestData([firstLoginUser.id, inactiveUser.id], ticketId ? [ticketId] : [])
        }
    })

    it('logs in with valid credentials and exposes first-login state', async () => {
        const res = await request(app).post('/api/auth/login').send({ email: firstLoginUser.email, password: TEST_PASSWORD })
        expect(res.status).toBe(200)
        expect(res.headers['set-cookie']?.some((cookie: string) => cookie.startsWith('token='))).toBe(true)
        expect(res.body).toMatchObject({ id: firstLoginUser.id, role: 'REQUESTER', mustChangePassword: true })
    })

    it('rejects invalid and inactive accounts', async () => {
        const invalid = await request(app).post('/api/auth/login').send({ email: firstLoginUser.email, password: 'wrongpass' })
        const inactive = await request(app).post('/api/auth/login').send({ email: inactiveUser.email, password: TEST_PASSWORD })
        expect(invalid.status).toBe(401)
        expect(inactive.status).toBe(401)
    })

    it('returns the current user and blocks application access before password change', async () => {
        const cookie = authCookie(firstLoginUser.id, firstLoginUser.role)
        const me = await request(app).get('/api/auth/me').set('Cookie', [cookie])
        const blocked = await request(app).get(`/api/tickets/${ticketId}`).set('Cookie', [cookie])
        expect(me.status).toBe(200)
        expect(me.body).toMatchObject({ email: firstLoginUser.email, mustChangePassword: true })
        expect(blocked.status).toBe(403)
    })

    it('changes the password only when confirmation matches', async () => {
        const cookie = authCookie(firstLoginUser.id, firstLoginUser.role)
        const mismatch = await request(app).post('/api/auth/change-password').set('Cookie', [cookie]).send({ newPassword: 'newpassword', confirmPassword: 'different' })
        expect(mismatch.status).toBe(400)

        const changed = await request(app).post('/api/auth/change-password').set('Cookie', [cookie]).send({ newPassword: 'newpassword', confirmPassword: 'newpassword' })
        expect(changed.status).toBe(200)

        const allowed = await request(app).get(`/api/tickets/${ticketId}`).set('Cookie', [cookie])
        expect(allowed.status).toBe(200)
    })
})
