import { afterAll, describe, expect, it } from 'vitest'
import { Pool } from 'pg'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { requireLab4Database } from './fixtures'

const migrations = path.resolve(__dirname, '../../prisma/migrations')
const increment = '20261014050000_lab4_actions_foundation'
const ownedDatabases: string[] = []
let admin: Pool | undefined
function pgTool(tool: 'pg_dump' | 'pg_restore', args: string[], input?: Buffer) {
  // Optional installed PostgreSQL tools let isolated tests run without Docker.
  // No shell interpolation; connect to exactly the guarded test server.
  if (process.env.LAB4_PG_BIN) {
    requireLab4Database()
    const url = new URL(process.env.DATABASE_URL!)
    return spawnSync(path.join(process.env.LAB4_PG_BIN, `${tool}${process.platform === 'win32' ? '.exe' : ''}`),
      ['-h', url.hostname, '-p', url.port || '5432', '-U', decodeURIComponent(url.username), ...args],
      { input, env: { ...process.env, PGPASSWORD: decodeURIComponent(url.password) }, maxBuffer: 16 * 1024 * 1024, timeout: 30000 })
  }
  return spawnSync('docker', ['exec', ...(input ? ['-i'] : []), 'local-postgres', tool, '-U', 'postgres', ...args], { input, maxBuffer: 16 * 1024 * 1024, timeout: 30000 })
}
async function database() {
  requireLab4Database()
  const url = new URL(process.env.DATABASE_URL!)
  const name = `toktickit_lab4_verify_migration_${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`
  if (!admin) { const base = new URL(url); base.pathname = '/postgres'; admin = new Pool({ connectionString: base.toString() }) }
  await admin.query(`CREATE DATABASE "${name}"`)
  ownedDatabases.push(name)
  url.pathname = `/${name}`
  return { name, pool: new Pool({ connectionString: url.toString() }) }
}
async function baseline(pool: Pool) {
  for (const entry of (await readdir(migrations)).filter(n => /^\d/.test(n) && n < increment).sort()) {
    await pool.query(await readFile(path.join(migrations, entry, 'migration.sql'), 'utf8'))
  }
  const user = (await pool.query(`INSERT INTO "User" (name,email,"passwordHash",role,"isActive","mustChangePassword","createdAt","updatedAt") VALUES ('Legacy Requester','legacy@test.invalid','preserve-hash','REQUESTER',false,true,NOW(),NOW()) RETURNING id`)).rows[0]
  const staff = (await pool.query(`INSERT INTO "User" (name,email,"passwordHash",role,"createdAt","updatedAt") VALUES ('Legacy Staff','legacy.staff@test.invalid','staff-hash','IT_STAFF',NOW(),NOW()) RETURNING id`)).rows[0]
  const category = (await pool.query(`INSERT INTO "Category" (name) VALUES ('Legacy category') RETURNING id`)).rows[0]
  const system = (await pool.query(`INSERT INTO "RelatedSystem" (name) VALUES ('Legacy VPN') RETURNING id`)).rows[0]
  let ticketId = 0
  for (const status of ['OPEN', 'RESOLVED', 'CLOSED']) {
    const row = (await pool.query(`INSERT INTO "Ticket" ("ticketNumber","requesterId","categoryId","relatedSystemId",summary,description,"requestedPriority",status,"ownerId","createdAt","updatedAt") VALUES ($1,$2,$3,$4,'Legacy ticket','Must survive upgrade','HIGH',$5,$6,NOW()-INTERVAL '2 days',NOW()-INTERVAL '1 day') RETURNING id`, [`LEGACY-${status}`, user.id, category.id, system.id, status, staff.id])).rows[0]
    if (status === 'OPEN') ticketId = row.id
  }
  await pool.query(`INSERT INTO "PublicComment" (content,"ticketId","authorId") VALUES ('Original public comment',$1,$2)`, [ticketId, user.id])
  await pool.query(`INSERT INTO "InternalNote" (content,"ticketId","authorId") VALUES ('Private legacy note',$1,$2)`, [ticketId, staff.id])
  await pool.query(`INSERT INTO "Attachment" ("ticketId","uploadedById","originalFilename","storedFilename","mimeType","sizeBytes") VALUES ($1,$2,'legacy.png','migration-fixture.png','image/png',20)`, [ticketId, user.id])
}
const tables = ['User', 'Ticket', 'Category', 'RelatedSystem', 'Attachment', 'PublicComment', 'InternalNote']
async function snapshot(pool: Pool) {
  const result: Record<string, any[]> = {}
  for (const table of tables) result[table] = (await pool.query(`SELECT * FROM "${table}" ORDER BY id`)).rows
  return result
}
function expectPreserved(before: Record<string, any[]>, after: Record<string, any[]>) {
  for (const table of tables) {
    expect(after[table].length).toBe(before[table].length)
    for (const [index, original] of before[table].entries()) {
      for (const key of Object.keys(original)) expect(after[table][index][key]).toEqual(original[key])
    }
  }
}
afterAll(async () => {
  if (!admin) return
  for (const name of ownedDatabases) {
    // Exact names created above only; never accept a user-supplied database name here.
    if (!/^toktickit_lab4_verify_migration_[a-f0-9]{12}$/.test(name)) throw new Error('Unsafe migration cleanup target')
    await admin.query(`DROP DATABASE "${name}"`)
  }
  await admin.end()
})

describe('Lab 3 -> Lab 4 preserved-data migration and recovery', () => {
  it('adds models/defaults and approximate resolution timestamps without changing any legacy field or FK', async () => {
    const { pool } = await database()
    try {
      await baseline(pool)
      const before = await snapshot(pool)
      await pool.query(await readFile(path.join(migrations, increment, 'migration.sql'), 'utf8'))
      expectPreserved(before, await snapshot(pool))
      const tickets = (await pool.query('SELECT * FROM "Ticket" ORDER BY id')).rows
      for (const ticket of tickets) {
        expect(ticket.version).toBe(0); expect(ticket.workCycle).toBe(1)
        expect(ticket.resolvedAt).toEqual(ticket.status === 'OPEN' ? null : ticket.updatedAt)
      }
      for (const table of ['ActionTaken', 'ActionTakenEvent', 'TicketWorkflowEvent', 'MutationRequest']) {
        expect(Number((await pool.query(`SELECT COUNT(*) AS count FROM "${table}"`)).rows[0].count)).toBe(0)
      }
      // FK still rejects orphaned legacy data after upgrade.
      await expect(pool.query(`INSERT INTO "PublicComment" (content,"ticketId","authorId") VALUES ('orphan',2147483647,$1)`, [before.User[0].id])).rejects.toMatchObject({ code: '23503' })
    } finally { await pool.end() }
  }, 30000)

  it('restores a pre-upgrade pg_dump backup into a separate disposable DB and verifies baseline records/schema', async () => {
    const source = await database(), recovery = await database()
    try {
      await baseline(source.pool)
      const before = await snapshot(source.pool)
      // Default to the existing container; LAB4_PG_BIN supports an installed toolchain.
      const dump = pgTool('pg_dump', ['-Fc', source.name])
      if (dump.status !== 0) throw new Error(`pg_dump failed: ${dump.stderr?.toString() || dump.error}`)
      await source.pool.query(await readFile(path.join(migrations, increment, 'migration.sql'), 'utf8'))
      const restore = pgTool('pg_restore', ['--exit-on-error', '-d', recovery.name], dump.stdout)
      if (restore.status !== 0) throw new Error(`pg_restore failed: ${restore.stderr?.toString() || restore.error}`)
      expectPreserved(before, await snapshot(recovery.pool))
      const columns = (await recovery.pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='Ticket'`)).rows.map(r => r.column_name)
      expect(columns).not.toContain('version')
      expect((await recovery.pool.query(`SELECT to_regclass('"ActionTaken"') AS table_name`)).rows[0].table_name).toBeNull()
      expect((await recovery.pool.query(`SELECT t."ticketNumber", u.name FROM "Ticket" t JOIN "User" u ON t."requesterId"=u.id ORDER BY t.id`)).rows).toHaveLength(3)
    } finally { await source.pool.end(); await recovery.pool.end() }
  }, 90000)
})
