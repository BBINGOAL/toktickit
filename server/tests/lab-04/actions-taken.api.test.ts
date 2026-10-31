import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import app from '../../src/app'
import { prisma } from '../../src/db'
import { fixture } from './fixtures'

describe('Lab 4 Actions Taken API', () => {
  let f: Awaited<ReturnType<typeof fixture>>
  beforeEach(async () => { f = await fixture() })
  afterEach(async () => { vi.restoreAllMocks(); if (f) await f.cleanup() })
  afterAll(async () => { await prisma.$disconnect() })
  const key = () => `action-${crypto.randomUUID()}`
  function create(body = f.body(), cookie = f.cookie(), idempotency = key()) {
    return request(app).post(`/api/tickets/${f.ticket.id}/actions`).set('Cookie', cookie).set('Idempotency-Key', idempotency).send(body)
  }
  function patch(id: number, body: object, cookie = f.cookie()) {
    return request(app).patch(`/api/tickets/${f.ticket.id}/actions/${id}`).set('Cookie', cookie).send(body)
  }
  it('creates with immutable authenticated performer and distinct eligible assignee without replacing owner', async () => {
    await prisma.ticket.update({ where: { id: f.ticket.id }, data: { ownerId: f.admin.id } })
    const response = await create(f.body({ assigneeId: f.colleague.id }))
    expect(response.status).toBe(201)
    expect(response.body.data).toMatchObject({ ticketId: f.ticket.id, workCycle: 1, status: 'PLANNED', version: 0, performedBy: { id: f.staff.id }, assignee: { id: f.colleague.id } })
    expect(response.body.ticketVersion).toBe(1)
    expect(JSON.stringify(response.body)).not.toMatch(/passwordHash|email|payloadDigest/)
    expect((await prisma.ticket.findUniqueOrThrow({ where: { id: f.ticket.id } })).ownerId).toBe(f.admin.id)
    const ownerRead = await request(app).get(`/api/tickets/${f.ticket.id}/actions`).set('Cookie', f.cookie(f.requester))
    expect(ownerRead.status).toBe(200)
    expect(ownerRead.body.data).toHaveLength(1)
  })
  it('allows Admin create and defaults the assignee to the authenticated creator', async () => {
    const r = await create(f.body(), f.cookie(f.admin))
    expect(r.status).toBe(201)
    expect(r.body.data.assignee.id).toBe(f.admin.id)
    expect(r.body.data.performedBy.id).toBe(f.admin.id)
  })
  it('does not disclose other Requester resources and denies requester writes before lookup', async () => {
    const existing = await request(app).get(`/api/tickets/${f.ticket.id}/actions`).set('Cookie', f.cookie(f.other))
    const absent = await request(app).get('/api/tickets/2147483647/actions').set('Cookie', f.cookie(f.other))
    expect(existing.status).toBe(404); expect(absent.status).toBe(404)
    expect(existing.body).toEqual(absent.body)
    expect((await create(f.body(), f.cookie(f.requester))).status).toBe(403)
    expect((await request(app).post('/api/tickets/2147483647/actions').set('Cookie', f.cookie(f.requester)).send({})).status).toBe(403)
    expect((await request(app).get(`/api/tickets/${f.ticket.id}/actions`)).status).toBe(401)
  })
  it.each([
    { description: '   ' }, { performedById: 123 }, { workCycle: 99 }, { status: 'COMPLETED' },
    { actionDateTime: 'not-a-date' }, { actionDateTime: '2020-01-01T00:00:00Z' },
    { actionDateTime: '2999-01-01T00:00:00Z' }, { actionDateTime: '2026-10-14T10:00:00' },
    { description: 'x'.repeat(2001) }, { followUpRequired: 'true' }, { followUpRequired: true, followUpNote: ' ' },
    { expectedTicketVersion: -1 }, { assigneeId: 0 }, { followsUpActionId: '1' },
  ])('rejects invalid or spoofed input %j atomically', async overrides => {
    const r = await create(f.body(overrides))
    expect(r.status).toBe(400)
    expect(await prisma.actionTaken.count({ where: { ticketId: f.ticket.id } })).toBe(0)
    expect((await prisma.ticket.findUniqueOrThrow({ where: { id: f.ticket.id } })).version).toBe(0)
  })
  it('rejects inactive/non-staff assignees and missing or invalid idempotency keys', async () => {
    await prisma.user.update({ where: { id: f.colleague.id }, data: { isActive: false } })
    expect((await create(f.body({ assigneeId: f.colleague.id }))).status).toBe(400)
    expect((await create(f.body({ assigneeId: f.requester.id }))).status).toBe(400)
    expect((await request(app).post(`/api/tickets/${f.ticket.id}/actions`).set('Cookie', f.cookie()).send(f.body())).status).toBe(400)
    expect((await create(f.body(), f.cookie(), 'short')).status).toBe(400)
  })
  it('requires separate Start and Complete requests and preserves immutable terminal history', async () => {
    const c = await create()
    const id = c.body.data.id
    const direct = await patch(id, { expectedVersion: 0, expectedTicketVersion: 1, status: 'COMPLETED', result: 'Fixed' })
    expect(direct.status).toBe(409)
    const started = await patch(id, { expectedVersion: 0, expectedTicketVersion: 1, status: 'IN_PROGRESS', assigneeId: f.admin.id }, f.cookie(f.colleague))
    expect(started.status).toBe(200)
    expect(started.body.data.performedBy.id).toBe(f.staff.id)
    expect((await patch(id, { expectedVersion: 1, expectedTicketVersion: 2, status: 'COMPLETED' })).status).toBe(400)
    const completed = await patch(id, { expectedVersion: 1, expectedTicketVersion: 2, status: 'COMPLETED', result: 'VPN confirmed working' })
    expect(completed.status).toBe(200)
    expect((await patch(id, { expectedVersion: 2, expectedTicketVersion: 3, description: 'Overwrite completed work' })).status).toBe(409)
    const history = await request(app).get(`/api/tickets/${f.ticket.id}/actions/${id}/history`).set('Cookie', f.cookie(f.requester))
    expect(history.status).toBe(200)
    expect(history.body.data.map((e: any) => e.kind)).toEqual(['CREATED', 'STARTED', 'COMPLETED'])
    expect(history.body.data[1].actor.id).toBe(f.colleague.id)
    expect((await request(app).delete(`/api/tickets/${f.ticket.id}/actions/${id}`).set('Cookie', f.cookie())).status).toBe(405)
  })
  it('retains cancelled records and requires a reason', async () => {
    const c = await create()
    const body = { expectedVersion: 0, expectedTicketVersion: 1, status: 'CANCELLED' }
    expect((await patch(c.body.data.id, body)).status).toBe(400)
    const r = await patch(c.body.data.id, { ...body, cancellationReason: 'Duplicate investigation' })
    expect(r.status).toBe(200)
    expect(r.body.data.cancellationReason).toBe('Duplicate investigation')
    expect(await prisma.actionTaken.count({ where: { ticketId: f.ticket.id } })).toBe(1)
    expect((await patch(c.body.data.id, { expectedVersion: 1, expectedTicketVersion: 2, description: 'Overwrite cancelled work' })).status).toBe(409)
  })
  it('can cancel historical assignment after assignee deactivation but cannot start it', async () => {
    const c = await create(f.body({ assigneeId: f.colleague.id }))
    await prisma.user.update({ where: { id: f.colleague.id }, data: { isActive: false } })
    const base = { expectedVersion: 0, expectedTicketVersion: 1 }
    expect((await patch(c.body.data.id, { ...base, status: 'IN_PROGRESS' })).status).toBe(400)
    expect((await patch(c.body.data.id, { ...base, status: 'CANCELLED', cancellationReason: 'Replan after staff departure' })).status).toBe(200)
  })
  it('rejects a cancellation reason on an ordinary edit', async () => {
    const c = await create()
    expect((await patch(c.body.data.id, { expectedVersion: 0, expectedTicketVersion: 1, cancellationReason: 'Not cancelled' })).status).toBe(400)
  })
  it('enforces first-login gate and denies cross-owner action history without existence leakage', async () => {
    const c = await create()
    const existing = await request(app).get(`/api/tickets/${f.ticket.id}/actions/${c.body.data.id}/history`).set('Cookie', f.cookie(f.other))
    const missing = await request(app).get(`/api/tickets/${f.ticket.id}/actions/2147483647/history`).set('Cookie', f.cookie(f.other))
    expect(existing.status).toBe(404); expect(missing.status).toBe(404); expect(existing.body).toEqual(missing.body)
    await prisma.user.update({ where: { id: f.staff.id }, data: { mustChangePassword: true } })
    expect((await create(f.body({ expectedTicketVersion: 1 }))).status).toBe(403)
  })
  it('validates linked follow-up and returns chronological public actions independent of creation time', async () => {
    const c = await create(f.body({ followUpRequired: true, followUpNote: 'Verify tomorrow' }))
    expect((await create(f.body({ expectedTicketVersion: 1, followsUpActionId: c.body.data.id }))).status).toBe(400)
    await patch(c.body.data.id, { expectedVersion: 0, expectedTicketVersion: 1, status: 'IN_PROGRESS' })
    await patch(c.body.data.id, { expectedVersion: 1, expectedTicketVersion: 2, status: 'COMPLETED', result: 'Initial fix' })
    const follow = await create(f.body({ expectedTicketVersion: 3, followsUpActionId: c.body.data.id }))
    expect(follow.status).toBe(201)
    const read = await request(app).get(`/api/tickets/${f.ticket.id}/actions?pageSize=10`).set('Cookie', f.cookie())
    expect(read.body.data.map((a: any) => a.id)).toEqual([c.body.data.id, follow.body.data.id])
    expect(read.body.data[0].createdAt).not.toBe(read.body.data[0].actionDateTime)
  })
  it('returns empty pages and rejects invalid pagination, IDs and unknown query keys', async () => {
    const url = `/api/tickets/${f.ticket.id}/actions`
    const read = await request(app).get(url).set('Cookie', f.cookie())
    expect(read.body).toMatchObject({ data: [], meta: { totalItems: 0, totalPages: 0 } })
    for (const query of ['page=0', 'page=1x', 'pageSize=11', 'requesterId=1', 'sort=createdAt']) {
      expect((await request(app).get(`${url}?${query}`).set('Cookie', f.cookie())).status).toBe(400)
    }
    expect((await request(app).get('/api/tickets/1abc/actions').set('Cookie', f.cookie())).status).toBe(400)
  })
  it('orders equal recorded-time history by id and never returns private Ticket notes', async () => {
    const c = await create()
    await prisma.internalNote.create({ data: { ticketId: f.ticket.id, authorId: f.staff.id, content: 'PRIVATE_NOTE_SENTINEL' } })
    // Own fixture-only event insertion gives an exact timestamp tie without changing real audit rows.
    const time = new Date('2020-01-01T00:00:00Z')
    await prisma.actionTakenEvent.createMany({ data: ['FIXTURE_A', 'FIXTURE_B'].map(kind => ({ actionId: c.body.data.id, actorId: f.staff.id, kind, after: { description: 'Public fixture data' }, createdAt: time })) })
    const r = await request(app).get(`/api/tickets/${f.ticket.id}/actions/${c.body.data.id}/history`).set('Cookie', f.cookie(f.requester))
    expect(r.status).toBe(200)
    expect(r.body.data.slice(0, 2).map((e: any) => e.kind)).toEqual(['FIXTURE_A', 'FIXTURE_B'])
    expect(r.body.data[0].id).toBeLessThan(r.body.data[1].id)
    expect(JSON.stringify(r.body)).not.toMatch(/PRIVATE_NOTE_SENTINEL|passwordHash|payloadDigest/)
  })
  it('returns a safe query-failure response without losing existing actions', async () => {
    await create()
    vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('SECRET_QUERY_DETAILS'))
    const r = await request(app).get(`/api/tickets/${f.ticket.id}/actions`).set('Cookie', f.cookie())
    expect(r.status).toBe(500)
    expect(JSON.stringify(r.body)).not.toMatch(/SECRET_QUERY_DETAILS|stack/)
    expect(await prisma.actionTaken.count({ where: { ticketId: f.ticket.id } })).toBe(1)
  })
  it('lists only active staff/admin assignees with pagination and role restriction', async () => {
    // Match all three owned fixtures without depending on the first global 50 users.
    await prisma.user.update({ where: { id: f.colleague.id }, data: { isActive: false, name: `${f.staff.name} inactive` } })
    await prisma.user.update({ where: { id: f.requester.id }, data: { name: `${f.staff.name} requester` } })
    const r = await request(app).get('/api/staff/action-assignees').query({ pageSize: 50, search: f.staff.name }).set('Cookie', f.cookie())
    expect(r.status).toBe(200)
    expect(r.body.data.some((u: any) => u.id === f.staff.id)).toBe(true)
    expect(r.body.data.some((u: any) => [f.colleague.id, f.requester.id].includes(u.id))).toBe(false)
    expect(JSON.stringify(r.body)).not.toMatch(/passwordHash|email/)
    expect((await request(app).get('/api/staff/action-assignees').set('Cookie', f.cookie(f.requester))).status).toBe(403)
  })
  it.each(['RESOLVED', 'CLOSED', 'CANCELLED'] as const)('rejects new work on terminal parent %s', async status => {
    await prisma.ticket.update({ where: { id: f.ticket.id }, data: { status } })
    expect((await create()).status).toBe(409)
  })
})
