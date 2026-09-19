import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import app from '../../src/app'
import { authCookie, createTestTicket, createTestUser, removeTestData } from './test-helpers'

describe('Lab 3 authorization matrix', () => {
    let requesterA: Awaited<ReturnType<typeof createTestUser>>
    let requesterB: Awaited<ReturnType<typeof createTestUser>>
    let staff: Awaited<ReturnType<typeof createTestUser>>
    let ticketA: Awaited<ReturnType<typeof createTestTicket>>
    let ticketB: Awaited<ReturnType<typeof createTestTicket>>

    beforeAll(async () => {
        requesterA = await createTestUser('REQUESTER')
        requesterB = await createTestUser('REQUESTER')
        staff = await createTestUser('IT_STAFF')
        ticketA = await createTestTicket(requesterA.id, 'AUTHZ-A')
        ticketB = await createTestTicket(requesterB.id, 'AUTHZ-B')
    })

    afterAll(async () => {
        if (requesterA && requesterB && staff) {
            await removeTestData([requesterA.id, requesterB.id, staff.id], [ticketA?.id, ticketB?.id].filter(Boolean) as number[])
        }
    })

    it('requires authentication for protected resources', async () => {
        expect((await request(app).get('/api/auth/me')).status).toBe(401)
        expect((await request(app).get('/api/staff/tickets')).status).toBe(401)
    })

    it('prevents a requester from viewing or commenting on another requester ticket', async () => {
        const cookie = authCookie(requesterA.id, requesterA.role)
        const detail = await request(app).get(`/api/tickets/${ticketB.id}`).set('Cookie', [cookie])
        const comment = await request(app).post(`/api/tickets/${ticketB.id}/comments`).set('Cookie', [cookie]).send({ content: 'cross-ticket access' })
        expect(detail.status).toBe(403)
        expect(comment.status).toBe(403)
    })

    it('prevents requesters from staff queue, notes, and admin user management', async () => {
        const cookie = authCookie(requesterA.id, requesterA.role)
        expect((await request(app).get('/api/staff/tickets').set('Cookie', [cookie])).status).toBe(403)
        expect((await request(app).get(`/api/tickets/${ticketA.id}/notes`).set('Cookie', [cookie])).status).toBe(403)
        expect((await request(app).get('/api/admin/users').set('Cookie', [cookie])).status).toBe(403)
    })

    it('allows IT staff to access the queue and internal notes but not admin management', async () => {
        const cookie = authCookie(staff.id, staff.role)
        expect((await request(app).get('/api/staff/tickets').set('Cookie', [cookie])).status).toBe(200)
        expect((await request(app).get(`/api/tickets/${ticketA.id}/notes`).set('Cookie', [cookie])).status).toBe(200)
        expect((await request(app).get('/api/admin/users').set('Cookie', [cookie])).status).toBe(403)
    })
})
