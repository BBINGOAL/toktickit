import { prisma } from '../../src/db'
import { createTestUser, createTestTicket, authCookie, removeTestData } from '../lab-03/test-helpers'

export function requireLab4Database() {
  const name = new URL(process.env.DATABASE_URL || 'postgresql://invalid/').pathname
  if (!name.startsWith('/toktickit_lab4_verify_')) throw new Error('Lab 4 tests require an isolated toktickit_lab4_verify_* database')
}
export async function fixture() {
  requireLab4Database()
  const requester = await createTestUser()
  const other = await createTestUser()
  const staff = await createTestUser('IT_STAFF')
  const colleague = await createTestUser('IT_STAFF')
  const admin = await createTestUser('ADMIN')
  const ticket = await createTestTicket(requester.id)
  const ids = [requester, other, staff, colleague, admin].map(u => u.id)
  return {
    requester, other, staff, colleague, admin, ticket,
    cookie: (user = staff) => authCookie(user.id, user.role),
    body: (overrides = {}) => ({ expectedTicketVersion: 0, actionDateTime: ticket.createdAt.toISOString(), description: 'Investigate VPN access', ...overrides }),
    async cleanup() {
      const actions = await prisma.actionTaken.findMany({ where: { ticketId: ticket.id }, select: { id: true } })
      await prisma.actionTakenEvent.deleteMany({ where: { actionId: { in: actions.map(a => a.id) } } })
      await prisma.actionTaken.updateMany({ where: { ticketId: ticket.id }, data: { followsUpActionId: null } })
      await prisma.actionTaken.deleteMany({ where: { ticketId: ticket.id } })
      await prisma.ticketWorkflowEvent.deleteMany({ where: { ticketId: ticket.id } })
      await prisma.mutationRequest.deleteMany({ where: { userId: { in: ids } } })
      await removeTestData(ids, [ticket.id])
    },
  }
}
