import { PrismaClient, Prisma, TicketStatus } from '../src/generated/prisma/client'

// Demonstration records only: never retrofit actions or reset existing Tickets/users.
export async function seedLab4(prisma: PrismaClient, passwordHash: string) {
  await prisma.user.upsert({ where: { email: 'lab4.empty@kmutt.ac.th' }, update: {}, create: { name: 'Lab 4 Empty Requester', email: 'lab4.empty@kmutt.ac.th', role: 'REQUESTER', passwordHash, mustChangePassword: true } })
  const [requester, staff, colleague, category, system] = await Promise.all([
    prisma.user.findUnique({ where: { email: 'jennifer.anderson@kmutt.ac.th' } }),
    prisma.user.findUnique({ where: { email: 'it1@kmutt.ac.th' } }),
    prisma.user.findUnique({ where: { email: 'it2@kmutt.ac.th' } }),
    prisma.category.findUnique({ where: { name: 'Network' } }),
    prisma.relatedSystem.findUnique({ where: { name: 'VPN' } }),
  ])
  // Preserve operator changes: do not create new assignments to accounts they deactivated/demoted.
  if (!requester?.isActive || requester.role !== 'REQUESTER' || !staff?.isActive || !colleague?.isActive || !['IT_STAFF', 'ADMIN'].includes(staff.role) || !['IT_STAFF', 'ADMIN'].includes(colleague.role) || !category || !system) return
  const statuses: TicketStatus[] = ['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'RESOLVED', 'CLOSED', 'REOPENED', 'CANCELLED']
  for (const [index, status] of statuses.entries()) {
    const ticketNumber = `LAB4-DEMO-${String(index + 1).padStart(3, '0')}`
    await prisma.$transaction(async tx => {
      // Serialize repeat/concurrent seed executions for this deterministic Ticket key.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${ticketNumber}))::text`
      if (await tx.ticket.findUnique({ where: { ticketNumber } })) return
      const createdAt = new Date(Date.now() - 2 * 86400000)
      const actionDateTime = new Date(createdAt.getTime() + 3600000)
      const resolved = status === 'RESOLVED' || status === 'CLOSED'
      const ticket = await tx.ticket.create({ data: {
        ticketNumber, requesterId: requester.id, ownerId: index < 2 ? null : staff.id,
        categoryId: category.id, relatedSystemId: system.id, summary: `VPN service demonstration: ${status}`,
        description: 'Lab 4 deterministic demo data; existing tickets are never rewritten.',
        requestedPriority: index % 2 ? 'MEDIUM' : 'HIGH', itPriority: index === 0 ? null : index % 3 === 0 ? 'LOW' : index % 3 === 1 ? 'MEDIUM' : 'HIGH',
        status, createdAt, ...(resolved ? { resolvedAt: actionDateTime, resolutionSummary: 'VPN configuration verified in the demo' } : {}),
        ...(status === 'CANCELLED' ? { cancelledReason: 'Demo request no longer needed' } : {}),
      } })
      const count = index === 0 ? 0 : index === 1 ? 1 : 2
      for (let n = 0; n < count; n++) {
        const assigneeId = n ? colleague.id : staff.id
        const cancelled = status === 'CANCELLED'
        const completed = resolved || n === 0
        const action = await tx.actionTaken.create({ data: {
          ticketId: ticket.id, workCycle: 1, actionDateTime, description: n ? 'Verify VPN from campus Wi-Fi' : 'Inspect VPN configuration',
          performedById: assigneeId, assigneeId, result: completed ? 'Configuration checked and connectivity verified' : '',
          status: cancelled ? 'CANCELLED' : completed ? 'COMPLETED' : 'PLANNED',
          cancellationReason: cancelled ? 'Ticket cancelled for this demonstration' : null,
          followUpRequired: !resolved && !cancelled && n === 0, followUpNote: !resolved && !cancelled && n === 0 ? 'Verify connectivity with the Requester' : '',
          attachmentNotes: 'Look for the VPN screenshot in Ticket attachments when supplied.',
        } })
        await tx.actionTakenEvent.create({ data: { actionId: action.id, actorId: assigneeId, kind: 'SEEDED', after: JSON.parse(JSON.stringify({ status: action.status, description: action.description, result: action.result })) as Prisma.InputJsonValue } })
      }
    })
  }
}
