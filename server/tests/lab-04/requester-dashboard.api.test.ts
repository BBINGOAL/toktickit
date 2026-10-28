import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import app from '../../src/app'
import { prisma } from '../../src/db'
import { fixture } from './fixtures'
import { createTestTicket, removeTestData } from '../lab-03/test-helpers'

describe('Requester dashboard and query-preserving drill-down', () => {
  let f: Awaited<ReturnType<typeof fixture>>
  const extras: number[] = []
  const now = new Date('2026-10-28T04:00:00.000Z')
  const start = new Date('2026-10-21T17:00:00.000Z')
  const old = new Date(start.getTime() - 1)
  const future = new Date(now.getTime() + 1)
  beforeAll(async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(now)
    f = await fixture()
    await prisma.ticket.update({ where: { id: f.ticket.id }, data: { status: 'OPEN', updatedAt: old } })
    const rows = [
      ['NEW', old, null], ['IN_PROGRESS', start, null], ['WAITING_FOR_REQUESTER', now, null],
      ['REOPENED', now, null], ['RESOLVED', start, start], ['CLOSED', now, now],
      ['CANCELLED', old, null], ['RESOLVED', old, old], ['CLOSED', future, future],
      ['OPEN', future, null], ['WAITING_FOR_REQUESTER', old, null],
    ] as const
    for (const [status, updatedAt, resolvedAt] of rows) {
      const t = await createTestTicket(f.requester.id)
      extras.push(t.id)
      await prisma.ticket.update({ where: { id: t.id }, data: { status, updatedAt, resolvedAt } })
    }
    const other = await createTestTicket(f.other.id)
    extras.push(other.id)
    await prisma.ticket.update({ where: { id: other.id }, data: { summary: 'OTHER_REQUESTER_SECRET', status: 'WAITING_FOR_REQUESTER' } })
    await prisma.internalNote.create({ data: { ticketId: f.ticket.id, authorId: f.staff.id, content: 'PRIVATE_NOTE_SENTINEL' } })
  })
  afterAll(async () => {
    vi.restoreAllMocks(); vi.useRealTimers()
    if (f) { await removeTestData([], extras); await f.cleanup() }
  })
  const get = (url = '/api/dashboards/requester', user?: { id: number; role: any }) =>
    request(app).get(url).set('Cookie', f.cookie(user || f.requester))

  it('uses exact inclusive dates, active status membership and current resolved status', async () => {
    const r = await get()
    expect(r.status).toBe(200)
    expect(r.body).toMatchObject({ asOf: now.toISOString(), windowStart: start.toISOString(), timezone: 'Asia/Bangkok', metrics: { activeTickets: 7, waitingForRequester: 2, recentlyUpdated: 5, recentlyResolved: 2 } })
  })
  it('matches independent authoritative counts and each drill-down total', async () => {
    const r = await get()
    const predicates = {
      activeTickets: { status: { in: ['NEW','OPEN','IN_PROGRESS','WAITING_FOR_REQUESTER','REOPENED'] } },
      waitingForRequester: { status: 'WAITING_FOR_REQUESTER' },
      recentlyUpdated: { updatedAt: { gte: start, lte: now } },
      recentlyResolved: { status: { in: ['RESOLVED','CLOSED'] }, resolvedAt: { gte: start, lte: now } },
    }
    for (const [key, predicate] of Object.entries(predicates)) {
      const count = await prisma.ticket.count({ where: { requesterId: f.requester.id, ...predicate } as any })
      expect(r.body.metrics[key]).toBe(count)
      const url = r.body.drillDown[key]
      expect(new URL(url, 'http://local').searchParams.get('page')).toBe('1')
      const list = await get('/api' + url)
      expect(list.status).toBe(200); expect(list.body.meta.totalItems).toBe(count)
    }
  })
  it('bounds previews to five with exact public fields and deterministic timestamp/ID ties', async () => {
    const r = await get()
    const expected = await prisma.ticket.findMany({ where: { requesterId: f.requester.id }, orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }], take: 5, select: { id: true } })
    expect(r.body.recentTickets.map(t => t.id)).toEqual(expected.map(t => t.id))
    expect(r.body.attentionTickets).toHaveLength(2)
    expect(r.body.attentionTickets.every(t => t.status === 'WAITING_FOR_REQUESTER')).toBe(true)
    expect(Object.keys(r.body.recentTickets[0]).sort()).toEqual(['id','ticketNumber','summary','status','itPriority','updatedAt','detailUrl'].sort())
    expect(JSON.stringify(r.body)).not.toMatch(/OTHER_REQUESTER_SECRET|PRIVATE_NOTE_SENTINEL|passwordHash|email|description|attachments/)
  })
  it('returns zeros and bounded empty lists for a Requester without tickets', async () => {
    // An existing role can change without adding fake Tickets or overwriting demo data.
    await prisma.user.update({ where: { id: f.colleague.id }, data: { role: 'REQUESTER' } })
    try {
      const r = await get(undefined, { ...f.colleague, role: 'REQUESTER' })
      expect(r.body.metrics).toEqual({ activeTickets: 0, waitingForRequester: 0, recentlyUpdated: 0, recentlyResolved: 0 })
      expect(r.body.recentTickets).toEqual([]); expect(r.body.attentionTickets).toEqual([])
    } finally { await prisma.user.update({ where: { id: f.colleague.id }, data: { role: 'IT_STAFF' } }) }
  })
  it('scopes every list to session identity and forbids caller-supplied identities', async () => {
    const r = await get(undefined, f.other)
    expect(r.body.metrics.activeTickets).toBe(1)
    expect(r.body.recentTickets).toHaveLength(1)
    expect(r.body.recentTickets[0].summary).toBe('OTHER_REQUESTER_SECRET')
    for (const url of ['/api/dashboards/requester?requesterId=1', '/api/tickets?requesterId=1']) expect((await get(url)).status).toBe(400)
  })
  it('rejects missing session, Staff/Admin and password-change/inactive sessions', async () => {
    expect((await request(app).get('/api/dashboards/requester')).status).toBe(401)
    for (const user of [f.staff, f.admin]) expect((await get(undefined, user)).status).toBe(403)
    await prisma.user.update({ where: { id: f.requester.id }, data: { mustChangePassword: true } })
    try { expect((await get()).status).toBe(403) } finally { await prisma.user.update({ where: { id: f.requester.id }, data: { mustChangePassword: false } }) }
    await prisma.user.update({ where: { id: f.requester.id }, data: { isActive: false } })
    try { expect((await get()).status).toBe(401) } finally { await prisma.user.update({ where: { id: f.requester.id }, data: { isActive: true } }) }
  })
  it.each(['scope=all','status=NOPE','page=1.5','page=0','pageSize=500','page=1e3','page=999999999999999999999','sort=passwordHash','order=up','search='+'a'.repeat(101),'status=OPEN&status=CLOSED','search[x]=a','updatedSince=no','resolvedUntil=2026-02-30T00%3A00%3A00.000Z','updatedSince=2026-10-28T04%3A00%3A00Z&updatedUntil=2026-10-27T04%3A00%3A00Z'])('rejects malformed list input %s', async query => {
    expect((await get('/api/tickets?' + query)).status).toBe(400)
  })
  it('preserves original filters and pagination while retaining dashboard bounds', async () => {
    const r = await get(`/api/tickets?scope=active&categoryId=${f.ticket.categoryId}&requestedPriority=MEDIUM&search=Lab%203&sort=updatedAt&order=desc&pageSize=10&page=1`)
    expect(r.status).toBe(200); expect(r.body.meta.totalItems).toBe(7)
    const a = await get('/api/tickets?sort=updatedAt&order=desc&pageSize=10&page=1')
    const b = await get('/api/tickets?sort=updatedAt&order=desc&pageSize=10&page=2')
    expect(b.body.data).toHaveLength(2)
    const ids = [...a.body.data, ...b.body.data].map(t => t.id)
    expect(new Set(ids).size).toBe(12)
    expect((await get('/api/tickets?page=3')).body).toMatchObject({ data: [], meta: { totalPages: 2, totalItems: 12 } })
  })
  it('returns safe errors without partial dashboard data or leaked database text', async () => {
    vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('SQL passwordHash SECRET'))
    const r = await get()
    expect(r.status).toBe(500); expect(r.body).toEqual({ error: 'Unable to load Requester dashboard' })
  })
  it('keeps one snapshot when a concurrent update commits between metric queries', async () => {
    const original = prisma.$transaction.bind(prisma)
    let changed = false
    vi.spyOn(prisma, '$transaction').mockImplementationOnce(((callback: any, options: any) => original(async (tx: any) => callback(new Proxy(tx, {
      get(target, prop) {
        if (prop !== 'ticket') return target[prop]
        return new Proxy(target.ticket, { get(table, method) {
          if (method !== 'count') return table[method]
          return async (...args: any[]) => {
            const result = await table.count(...args)
            if (!changed) { changed = true; await prisma.ticket.update({ where: { id: f.ticket.id }, data: { updatedAt: now } }) }
            return result
          }
        } })
      }
    })), options)) as any)
    try {
      const r = await get()
      expect(changed).toBe(true); expect(r.status).toBe(200)
      expect(r.body.metrics.recentlyUpdated).toBe(5)
      expect((await get()).body.metrics.recentlyUpdated).toBe(6)
    } finally { await prisma.ticket.update({ where: { id: f.ticket.id }, data: { updatedAt: old } }); vi.restoreAllMocks() }
  })
  it('rejects dashboard query manipulation and unsupported write methods', async () => {
    expect((await get('/api/dashboards/requester?asOf=2020-01-01')).status).toBe(400)
    expect((await request(app).post('/api/dashboards/requester').set('Cookie', f.cookie(f.requester))).status).toBe(405)
  })
})
