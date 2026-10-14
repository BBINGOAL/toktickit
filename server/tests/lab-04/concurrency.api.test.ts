import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import app from '../../src/app'
import { prisma } from '../../src/db'
import { fixture } from './fixtures'

describe('Actions Taken concurrent writes, retries and failure safety', () => {
  let f: Awaited<ReturnType<typeof fixture>>
  beforeEach(async () => { f = await fixture() })
  afterEach(async () => { vi.restoreAllMocks(); if (f) await f.cleanup() })
  afterAll(async () => { await prisma.$disconnect() })
  const key = () => `action-${crypto.randomUUID()}`
  const create = (body: object, k = key()) => request(app).post(`/api/tickets/${f.ticket.id}/actions`).set('Cookie', f.cookie()).set('Idempotency-Key', k).send(body)
  const patch = (id: number, body: object, k?: string) => {
    const req = request(app).patch(`/api/tickets/${f.ticket.id}/actions/${id}`).set('Cookie', f.cookie())
    return (k ? req.set('Idempotency-Key', k) : req).send(body)
  }
  it('replays the exact create response without a second action, version or event', async () => {
    const k = key(), body = f.body()
    const first = await create(body, k), second = await create(body, k)
    expect(first.status).toBe(201); expect(second.status).toBe(201)
    expect(second.body).toEqual(first.body)
    expect(await prisma.actionTaken.count({ where: { ticketId: f.ticket.id } })).toBe(1)
    expect(await prisma.actionTakenEvent.count({ where: { action: { ticketId: f.ticket.id } } })).toBe(1)
    expect((await prisma.ticket.findUniqueOrThrow({ where: { id: f.ticket.id } })).version).toBe(1)
    expect((await create(f.body({ description: 'Different request' }), k)).status).toBe(409)
  })
  it('normalizes whitespace and object key ordering for equivalent create replay', async () => {
    const k = key(), body = f.body()
    const first = await create(body, k)
    const second = await create({ description: ` ${body.description} `, actionDateTime: body.actionDateTime, expectedTicketVersion: 0 }, k)
    expect(second.status).toBe(201); expect(second.body).toEqual(first.body)
  })
  it('serializes concurrent identical retries into one committed action/event', async () => {
    const k = key(), body = f.body()
    const [one, two] = await Promise.all([create(body, k), create(body, k)])
    expect([one.status, two.status]).toEqual([201, 201])
    expect(one.body).toEqual(two.body)
    expect(await prisma.actionTaken.count({ where: { ticketId: f.ticket.id } })).toBe(1)
  })
  it('allows only one winner when different create intents share a stale Ticket version', async () => {
    const [one, two] = await Promise.all([create(f.body()), create(f.body({ description: 'Second investigation' }))])
    expect([one.status, two.status].sort()).toEqual([201, 409])
    expect(await prisma.actionTaken.count({ where: { ticketId: f.ticket.id } })).toBe(1)
    expect(await prisma.actionTakenEvent.count({ where: { action: { ticketId: f.ticket.id } } })).toBe(1)
  })
  it('rejects a stale concurrent editor without overwriting the winner or adding an event', async () => {
    const c = await create(f.body())
    const base = { expectedVersion: 0, expectedTicketVersion: 1 }
    const [one, two] = await Promise.all([patch(c.body.data.id, { ...base, description: 'First editor' }), patch(c.body.data.id, { ...base, description: 'Second editor' })])
    expect([one.status, two.status].sort()).toEqual([200, 409])
    const winner = one.status === 200 ? one : two
    const stored = await prisma.actionTaken.findUniqueOrThrow({ where: { id: c.body.data.id } })
    expect(stored.description).toBe(winner.body.data.description)
    expect(stored.version).toBe(1)
    expect(await prisma.actionTakenEvent.count({ where: { actionId: stored.id } })).toBe(2)
  })
  it('replays an optional PATCH key but rejects stale unkeyed retries', async () => {
    const c = await create(f.body()), k = key()
    const body = { expectedVersion: 0, expectedTicketVersion: 1, status: 'IN_PROGRESS' }
    const first = await patch(c.body.data.id, body, k)
    const replay = await patch(c.body.data.id, body, k)
    expect(replay.body).toEqual(first.body)
    expect(replay.status).toBe(200)
    expect((await patch(c.body.data.id, body)).status).toBe(409)
  })
  it('does not reserve a key on validation failure and can retry valid data', async () => {
    const k = key()
    expect((await create(f.body({ description: '' }), k)).status).toBe(400)
    expect((await create(f.body(), k)).status).toBe(201)
  })
  it('does not disclose replay data to an inactive actor', async () => {
    const k = key(), body = f.body()
    await create(body, k)
    await prisma.user.update({ where: { id: f.staff.id }, data: { isActive: false } })
    expect((await create(body, k)).status).toBe(401)
  })
  it('rolls back state, event, version and key on transaction failure and returns a safe error', async () => {
    const original = prisma.$transaction.bind(prisma)
    vi.spyOn(prisma, '$transaction').mockImplementationOnce(((callback: any, options: any) => original(async (tx: any) => {
      await callback(tx)
      throw new Error('simulated internal storage failure: SECRET_SQL')
    }, options)) as any)
    const k = key(), response = await create(f.body(), k)
    expect(response.status).toBe(500)
    expect(JSON.stringify(response.body)).not.toMatch(/SECRET_SQL|storage failure|stack/)
    expect(await prisma.actionTaken.count({ where: { ticketId: f.ticket.id } })).toBe(0)
    expect(await prisma.actionTakenEvent.count({ where: { actorId: f.staff.id } })).toBe(0)
    expect(await prisma.mutationRequest.count({ where: { userId: f.staff.id } })).toBe(0)
    expect((await prisma.ticket.findUniqueOrThrow({ where: { id: f.ticket.id } })).version).toBe(0)
    expect((await create(f.body(), k)).status).toBe(201)
  })
})
