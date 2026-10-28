import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import app from '../../src/app'
import { prisma } from '../../src/db'
import { fixture } from './fixtures'
import { createTestTicket, removeTestData } from '../lab-03/test-helpers'

const active = ['NEW','OPEN','IN_PROGRESS','WAITING_FOR_REQUESTER','REOPENED']
const statuses = [...active,'RESOLVED','CLOSED','CANCELLED']
describe('Staff/Admin dashboard, My Actions and Queue drill-down', () => {
  let f: Awaited<ReturnType<typeof fixture>>
  const tickets: number[] = [], actions: number[] = []
  const tag = `staffdash-${crypto.randomUUID()}`
  const tied = new Date('2026-10-28T10:00:00Z')
  beforeAll(async () => {
    f = await fixture()
    for (let i = 0; i < 16; i++) {
      const t = await createTestTicket(f.requester.id); tickets.push(t.id)
      await prisma.ticket.update({ where: { id: t.id }, data: { summary: `${tag}-${i}`, status: statuses[i % 8] as any, ownerId: i % 3 === 0 ? f.staff.id : null, itPriority: [null,'LOW','MEDIUM','HIGH'][i % 4] as any, updatedAt: tied } })
    }
    for (let i = 0; i < 12; i++) {
      const a = await prisma.actionTaken.create({ data: { ticketId: f.ticket.id, workCycle: 1, actionDateTime: f.ticket.createdAt, description: `${tag}-pending-${i}`, assigneeId: f.staff.id, performedById: f.colleague.id, status: i % 2 ? 'PLANNED' : 'IN_PROGRESS', updatedAt: tied } }); actions.push(a.id)
    }
    await prisma.actionTaken.create({ data: { ticketId: f.ticket.id, workCycle: 1, actionDateTime: f.ticket.createdAt, description: 'Created by staff but assigned to colleague', assigneeId: f.colleague.id, performedById: f.staff.id } })
    await prisma.actionTaken.create({ data: { ticketId: f.ticket.id, workCycle: 1, actionDateTime: f.ticket.createdAt, description: 'Already completed', result: 'Verified', status: 'COMPLETED', assigneeId: f.staff.id, performedById: f.staff.id } })
    await prisma.actionTaken.create({ data: { ticketId: tickets[6], workCycle: 1, actionDateTime: f.ticket.createdAt, description: 'Closed parent must not count', assigneeId: f.staff.id, performedById: f.staff.id } })
    await prisma.internalNote.create({ data: { ticketId: f.ticket.id, authorId: f.staff.id, content: 'DASHBOARD_PRIVATE_NOTE' } })
  })
  afterAll(async () => { vi.restoreAllMocks(); if (f) { await removeTestData([], tickets); await f.cleanup() } })
  const get = (url = '/api/dashboards/staff', user?: typeof f.staff) => request(app).get(url).set('Cookie', f.cookie(user || f.staff))

  it.each(['staff','admin'] as const)('matches authoritative aggregates, zero-valued group keys and every Queue drill-down for %s', async role => {
    const actor = f[role], r = await get(undefined, actor)
    expect(r.status).toBe(200); expect(r.body.timezone).toBe('Asia/Bangkok')
    expect(new Date(r.body.asOf).getTime()).toBeGreaterThan(0)
    expect(r.body.metrics.myPendingActions).toBe(role === 'staff' ? 12 : 0)
    const query = async (url: string, count: number) => {
      const list = await get('/api' + url, actor)
      expect(list.status).toBe(200); expect(list.body.meta.totalItems).toBe(count)
      expect(new URL(url, 'http://local').searchParams.get('page')).toBe('1')
    }
    const unassigned = await prisma.ticket.count({ where: { status: { in: active as any }, ownerId: null } })
    const mine = await prisma.ticket.count({ where: { status: { in: active as any }, ownerId: actor.id } })
    expect(r.body.metrics.unassignedActive).toBe(unassigned); expect(r.body.metrics.myActiveTickets).toBe(mine)
    await query(r.body.drillDown.unassignedActive, unassigned); await query(r.body.drillDown.myActiveTickets, mine)
    expect(Object.keys(r.body.metrics.byStatus).sort()).toEqual([...statuses].sort())
    for (const status of statuses) {
      const count = await prisma.ticket.count({ where: { status: status as any } })
      expect(r.body.metrics.byStatus[status]).toBe(count)
      await query(r.body.drillDown.byStatus[status], count)
    }
    expect(Object.keys(r.body.metrics.activeByPriority).sort()).toEqual(['LOW','MEDIUM','HIGH','UNSET'].sort())
    for (const priority of ['LOW','MEDIUM','HIGH','UNSET']) {
      const count = await prisma.ticket.count({ where: { status: { in: active as any }, itPriority: priority === 'UNSET' ? null : priority as any } })
      expect(r.body.metrics.activeByPriority[priority]).toBe(count)
      await query(r.body.drillDown.activeByPriority[priority], count)
    }
    const myList = new URL(r.body.drillDown.myPendingActions, 'http://local')
    expect(myList.pathname).toBe('/staff/dashboard'); expect(myList.searchParams.get('view')).toBe('my-actions')
  })
  it('returns bounded recent/urgent/action previews ordered by updatedAt/id without private fields', async () => {
    const r = await get()
    for (const key of ['recentTickets','urgentTickets','myActions']) expect(r.body[key].length).toBeLessThanOrEqual(5)
    const expected = await prisma.ticket.findMany({ where: { status: { in: active as any }, itPriority: 'HIGH' }, orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }], take: 5, select: { id: true } })
    expect(r.body.urgentTickets.map(t => t.id)).toEqual(expected.map(t => t.id))
    expect(r.body.myActions.map(a => a.id)).toEqual([...actions].reverse().slice(0, 5))
    expect(r.body.myActions[0].detailUrl).toBe(`/tickets/${f.ticket.id}?actionId=${actions.at(-1)}`)
    expect(JSON.stringify(r.body)).not.toMatch(/DASHBOARD_PRIVATE_NOTE|passwordHash|email|assigneeId|result/)
    expect(Object.keys(r.body.recentTickets[0]).sort()).toEqual(['id','ticketNumber','summary','status','itPriority','updatedAt','detailUrl'].sort())
  })
  it('paginates only current-assignee unfinished work with active parents, independently of performer', async () => {
    const a = await get('/api/staff/actions?page=1&pageSize=10'), b = await get('/api/staff/actions?page=2&pageSize=10')
    expect(a.status).toBe(200); expect(a.body.meta).toMatchObject({ totalItems: 12, totalPages: 2 })
    expect(b.body.data).toHaveLength(2)
    expect([...a.body.data, ...b.body.data].map(a => a.id)).toEqual([...actions].reverse())
    expect((await get('/api/staff/actions?page=3')).body.data).toEqual([])
    expect((await get('/api/staff/actions', f.admin)).body).toMatchObject({ data: [], meta: { totalItems: 0, totalPages: 0 } })
  })
  it('preserves Queue filters and has stable nonoverlapping pages for equal timestamps', async () => {
    const url = `/api/staff/tickets?search=${tag}&sort=updatedAt&order=desc&pageSize=10`
    const a = await get(url + '&page=1'), b = await get(url + '&page=2')
    expect(a.status).toBe(200); expect(a.body.meta.totalItems).toBe(16)
    expect([...a.body.data,...b.body.data].map(t => t.id)).toEqual([...tickets].reverse())
    const mine = await get(`/api/staff/tickets?ownerId=${f.staff.id}&categoryId=${f.ticket.categoryId}&search=${tag}`)
    expect(mine.status).toBe(200); expect(mine.body.data.every(t => t.owner.id === f.staff.id && t.categoryId === f.ticket.categoryId)).toBe(true)
  })
  it.each(['page=0','page=1.5','page=1x','page=999999999999999999','pageSize=1','scope=all','owner=other','owner=me&ownerId=1','ownerId=0','categoryId=1x','priority=CRITICAL','sort=passwordHash','order=wrong','status=OPEN&status=CLOSED','search='+ 'x'.repeat(101),'requesterId=1'])('rejects invalid Queue input %s', async query => {
    expect((await get('/api/staff/tickets?' + query)).status).toBe(400)
  })
  it.each(['pageSize=1','page=0','page=1.5','assigneeId=1','userId=1','search=anything','page=1&page=2'])('rejects My Actions query manipulation %s', async query => {
    expect((await get('/api/staff/actions?' + query)).status).toBe(400)
  })
  it('enforces session, current role, active account and password gate before query handling', async () => {
    for (const url of ['/api/dashboards/staff','/api/staff/actions','/api/staff/tickets']) {
      expect((await request(app).get(url)).status).toBe(401)
      expect((await get(url, f.requester)).status).toBe(403)
    }
    expect((await get('/api/dashboards/staff?userId=1')).status).toBe(400)
    await prisma.user.update({ where: { id: f.staff.id }, data: { mustChangePassword: true } })
    try { expect((await get()).status).toBe(403) } finally { await prisma.user.update({ where: { id: f.staff.id }, data: { mustChangePassword: false } }) }
    await prisma.user.update({ where: { id: f.staff.id }, data: { isActive: false } })
    try { expect((await get()).status).toBe(401) } finally { await prisma.user.update({ where: { id: f.staff.id }, data: { isActive: true } }) }
  })
  it('reads a linked action outside page one with Ticket ownership and no enumeration', async () => {
    const url = `/api/tickets/${f.ticket.id}/actions/${actions.at(-1)}`
    for (const user of [f.staff, f.admin, f.requester]) {
      const r = await get(url, user)
      expect(r.status).toBe(200); expect(r.body.data.id).toBe(actions.at(-1)); expect(r.body.ticketVersion).toBe(0)
    }
    const a = await get(url, f.other), b = await get(`/api/tickets/2147483647/actions/${actions.at(-1)}`, f.other)
    expect(a.status).toBe(404); expect(a.body).toEqual(b.body)
    expect((await get(`/api/tickets/${tickets[0]}/actions/${actions.at(-1)}`)).status).toBe(404)
  })
  it('keeps aggregates consistent if an update commits between queries in its snapshot', async () => {
    const before = (await get()).body.metrics.unassignedActive
    const original = prisma.$transaction.bind(prisma)
    let changed = false
    vi.spyOn(prisma, '$transaction').mockImplementationOnce(((callback: any, options: any) => original(async (tx: any) => callback(new Proxy(tx, { get(target, prop) {
      if (prop !== 'ticket') return target[prop]
      return new Proxy(target.ticket, { get(table, method) {
        if (method !== 'count') return table[method]
        return async (...args: any[]) => { const count = await table.count(...args); if (!changed) { changed = true; await prisma.ticket.update({ where: { id: f.ticket.id }, data: { status: 'CANCELLED' } }) }; return count }
      } })
    } })), options)) as any)
    try {
      const r = await get(); expect(changed).toBe(true)
      expect(r.body.metrics.unassignedActive).toBe(before)
      expect((await get()).body.metrics.unassignedActive).toBe(before - 1)
    } finally { vi.restoreAllMocks(); await prisma.ticket.update({ where: { id: f.ticket.id }, data: { status: 'OPEN' } }) }
  })
  it('returns safe failures without partial counts and rejects unsupported methods', async () => {
    vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('SQL SECRET passwordHash'))
    const r = await get(); expect(r.status).toBe(500); expect(r.body).toEqual({ error: 'Unable to load Staff dashboard' })
    expect((await request(app).post('/api/dashboards/staff').set('Cookie', f.cookie())).status).toBe(405)
  })
})
