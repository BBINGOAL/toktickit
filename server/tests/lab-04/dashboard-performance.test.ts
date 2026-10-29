import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import request from 'supertest'
import { Client } from 'pg'
import { performance } from 'node:perf_hooks'
import os from 'node:os'
import app from '../../src/app'
import { prisma } from '../../src/db'
import { fixture } from './fixtures'
import { removeTestData } from '../lab-03/test-helpers'

let f: Awaited<ReturnType<typeof fixture>>
let ticketIds: number[] = []
const prefix = `PERF-${crypto.randomUUID()}`
let tracking = false, queries = 0
const query = Client.prototype.query
const spy = vi.spyOn(Client.prototype, 'query').mockImplementation(function (this: Client, ...args: any[]) {
  if (tracking) queries++
  return query.apply(this, args as any)
})
beforeAll(async () => {
  f = await fixture()
  const statuses = ['NEW','OPEN','IN_PROGRESS','WAITING_FOR_REQUESTER','RESOLVED','CLOSED','REOPENED','CANCELLED'] as const
  const priorities = ['LOW','MEDIUM','HIGH',null] as const
  const now = new Date(), createdAt = new Date(now.getTime() - 86400000)
  await prisma.ticket.createMany({ data: Array.from({ length: 1000 }, (_, i) => ({
    ticketNumber: `${prefix}-${i}`, summary: `Performance ticket ${i}`, description: 'Isolated representative performance data',
    status: statuses[i % statuses.length], requesterId: i % 2 ? f.requester.id : f.other.id,
    ownerId: i % 3 ? f.staff.id : null, requestedPriority: 'MEDIUM', itPriority: priorities[i % priorities.length],
    categoryId: f.ticket.categoryId, relatedSystemId: f.ticket.relatedSystemId, createdAt, updatedAt: now,
    resolvedAt: [4,5].includes(i % 8) ? now : null,
  })) })
  ticketIds = (await prisma.ticket.findMany({ where: { ticketNumber: { startsWith: prefix } }, select: { id: true }, orderBy: { id: 'asc' } })).map(t => t.id)
  expect(ticketIds).toHaveLength(1000)
  for (let batch = 0; batch < 3; batch++) {
    await prisma.actionTaken.createMany({ data: ticketIds.map((ticketId, i) => ({
      ticketId, workCycle: 1, actionDateTime: now, description: `Performance work ${batch}-${i}`,
      assigneeId: i % 2 ? f.staff.id : f.admin.id, performedById: f.colleague.id,
      status: batch === 2 ? 'COMPLETED' : batch === 1 ? 'IN_PROGRESS' : 'PLANNED',
      result: batch === 2 ? 'Verified service restored' : '', updatedAt: now,
    })) })
  }
  expect(await prisma.actionTaken.count({ where: { ticketId: { in: ticketIds } } })).toBe(3000)
}, 60000)
afterAll(async () => {
  tracking = false; spy.mockRestore()
  // Also discover partially-created fixtures if setup failed; never remove other data.
  const owned = await prisma.ticket.findMany({ where: { ticketNumber: { startsWith: prefix } }, select: { id: true } })
  await removeTestData([], owned.map(t => t.id))
  if (f) await f.cleanup()
  await prisma.$disconnect()
})

it('bounds payload, SQL queries and warm p95 for each role on 1000 Tickets / 3000 Actions', async () => {
  const results: object[] = []
  for (const [role, user, url] of [
    ['Requester', f.requester, '/api/dashboards/requester'],
    ['Staff', f.staff, '/api/dashboards/staff'],
    ['Administrator', f.admin, '/api/dashboards/staff'],
  ] as const) {
    const cookie = f.cookie(user)
    for (let warmup = 0; warmup < 2; warmup++) expect((await request(app).get(url).set('Cookie', cookie)).status).toBe(200)
    const durations: number[] = [], sql: number[] = [], bytes: number[] = []
    for (let n = 0; n < 20; n++) {
      queries = 0; tracking = true
      const start = performance.now()
      const response = await request(app).get(url).set('Cookie', cookie)
      durations.push(performance.now() - start); tracking = false
      expect(response.status).toBe(200)
      sql.push(queries); bytes.push(Buffer.byteLength(response.text, 'utf8'))
      expect(queries, 'Instrumentation must observe SQL, including authorization and transaction commands').toBeGreaterThan(0)
      for (const value of Object.values(response.body)) if (Array.isArray(value)) expect(value.length).toBeLessThanOrEqual(5)
    }
    const p95Ms = [...durations].sort((a,b) => a-b)[Math.ceil(durations.length * .95)-1]
    const result = { role, samples: 20, warmup: 2, p95Ms: Number(p95Ms.toFixed(2)), maxQueries: Math.max(...sql), maxBytes: Math.max(...bytes) }
    results.push(result)
    console.log('PERF_RESULT', JSON.stringify(result))
    expect(result.maxQueries).toBeLessThanOrEqual(12)
    expect(result.maxBytes).toBeLessThanOrEqual(50 * 1024)
    expect(result.p95Ms).toBeLessThanOrEqual(1000)
  }
  console.log('PERF_ENV', JSON.stringify({ node: process.version, platform: process.platform, arch: process.arch,
    cpu: os.cpus()[0]?.model, logicalCpus: os.cpus().length, memoryGiB: Number((os.totalmem()/1024**3).toFixed(2)),
    postgres: (await prisma.$queryRawUnsafe<any[]>('SHOW server_version'))[0].server_version,
    tickets: 1000, actions: 3000, originalRowsRetained: true, results }))
}, 60000)
