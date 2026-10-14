import { afterAll, describe, expect, it } from 'vitest'
import { prisma } from '../../src/db'
import { seed } from '../../prisma/seed'
import { requireLab4Database } from './fixtures'

describe('repeat-safe Lab 4 seed', () => {
  afterAll(async () => { await prisma.$disconnect() })
  it('preserves existing credentials, roles, activity, names and Ticket content across repeated seeds', async () => {
    requireLab4Database()
    await seed(prisma)
    const user = await prisma.user.findUniqueOrThrow({ where: { email: 'jennifer.anderson@kmutt.ac.th' } })
    const ticket = await prisma.ticket.findUniqueOrThrow({ where: { ticketNumber: 'SEED-001' } })
    // Restore exact originals after the test; all mutation stays in the guarded test DB.
    try {
      await prisma.user.update({ where: { id: user.id }, data: { name: 'Preserved custom name', passwordHash: 'custom-credential-value', role: 'IT_STAFF', isActive: false, mustChangePassword: false } })
      await prisma.ticket.update({ where: { id: ticket.id }, data: { summary: 'Edited by operator', status: 'CANCELLED', itPriority: null } })
      const beforeUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
      const beforeTicket = await prisma.ticket.findUniqueOrThrow({ where: { id: ticket.id } })
      const counts = async () => Promise.all([prisma.user.count(), prisma.ticket.count(), prisma.actionTaken.count(), prisma.actionTakenEvent.count(), prisma.publicComment.count(), prisma.internalNote.count()])
      const before = await counts()
      await seed(prisma); await seed(prisma)
      expect(await counts()).toEqual(before)
      expect(await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).toEqual(beforeUser)
      expect(await prisma.ticket.findUniqueOrThrow({ where: { id: ticket.id } })).toEqual(beforeTicket)
      const demos = await prisma.ticket.findMany({ where: { ticketNumber: { startsWith: 'LAB4-DEMO-' } }, include: { _count: { select: { actions: true } } } })
      expect(new Set(demos.map(t => t.status)).size).toBe(8)
      expect(demos.some(t => t._count.actions === 0)).toBe(true)
      expect(demos.some(t => t._count.actions === 1)).toBe(true)
      expect(demos.some(t => t._count.actions > 1)).toBe(true)
      const empty = await prisma.user.findUniqueOrThrow({ where: { email: 'lab4.empty@kmutt.ac.th' } })
      expect(await prisma.ticket.count({ where: { requesterId: empty.id } })).toBe(0)
    } finally {
      await prisma.user.update({ where: { id: user.id }, data: { name: user.name, passwordHash: user.passwordHash, role: user.role, isActive: user.isActive, mustChangePassword: user.mustChangePassword, updatedAt: user.updatedAt } })
      await prisma.ticket.update({ where: { id: ticket.id }, data: { summary: ticket.summary, status: ticket.status, itPriority: ticket.itPriority, updatedAt: ticket.updatedAt } })
    }
  }, 30000)
})
