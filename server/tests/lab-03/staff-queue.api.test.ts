import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import app from '../../src/app'
import { authCookie, createTestTicket, createTestUser, removeTestData } from './test-helpers'

describe('Lab 3 staff queue API', () => {
    let requester: Awaited<ReturnType<typeof createTestUser>>
    let staff: Awaited<ReturnType<typeof createTestUser>>
    let ticketA: Awaited<ReturnType<typeof createTestTicket>>
    let ticketB: Awaited<ReturnType<typeof createTestTicket>>
    let cookie: string

    beforeAll(async () => {
        requester = await createTestUser('REQUESTER')
        staff = await createTestUser('IT_STAFF')
        ticketA = await createTestTicket(requester.id, 'QUEUE-A')
        ticketB = await createTestTicket(requester.id, 'QUEUE-B')
        cookie = authCookie(staff.id, staff.role)
    })

    afterAll(async () => {
        if (requester && staff) {
            await removeTestData([requester.id, staff.id], [ticketA?.id, ticketB?.id].filter(Boolean) as number[])
        }
    })

    it('returns paginated queue data with metadata', async () => {
        const res = await request(app).get('/api/staff/tickets?page=1&pageSize=1&sort=createdAt&order=desc').set('Cookie', [cookie])
        expect(res.status).toBe(200)
        expect(Array.isArray(res.body.data)).toBe(true)
        expect(res.body.data.length).toBeLessThanOrEqual(1)
        expect(res.body.meta).toMatchObject({ page: 1, pageSize: 1 })
    })

    it('filters by status, priority, category, and text search', async () => {
        const status = await request(app).get('/api/staff/tickets?status=OPEN&priority=MEDIUM&search=Lab%203').set('Cookie', [cookie])
        expect(status.status).toBe(200)
        expect(status.body.data.every((ticket: any) => ticket.status === 'OPEN' && ticket.itPriority === 'MEDIUM')).toBe(true)

        const category = ticketA.categoryId
        const byCategory = await request(app).get(`/api/staff/tickets?categoryId=${category}`).set('Cookie', [cookie])
        expect(byCategory.status).toBe(200)
        expect(byCategory.body.data.every((ticket: any) => ticket.categoryId === category)).toBe(true)
    })

    it('rejects invalid queue filters and sorting', async () => {
        const invalidStatus = await request(app).get('/api/staff/tickets?status=NOT_A_STATUS').set('Cookie', [cookie])
        const invalidSort = await request(app).get('/api/staff/tickets?sort=notAField').set('Cookie', [cookie])
        expect(invalidStatus.status).toBe(400)
        expect(invalidSort.status).toBe(400)
    })
})
