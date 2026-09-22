import { beforeAll, afterAll } from 'vitest'
import { prisma } from '../../src/db'
import { authCookie, createTestUser, removeTestData } from '../lab-03/test-helpers'

export function requesterFixture() {
    const fixture = { id: 0, cookie: '', otherCookie: '', inactiveCookie: '', categoryId: 0, relatedSystemId: 0 }
    const userIds: number[] = []
    beforeAll(async () => {
        for (const kind of ['primary', 'other', 'inactive']) {
            const user = await createTestUser()
            userIds.push(user.id)
            if (kind === 'primary') { fixture.id = user.id; fixture.cookie = authCookie(user.id, user.role) }
            if (kind === 'other') fixture.otherCookie = authCookie(user.id, user.role)
            if (kind === 'inactive') {
                await prisma.user.update({ where: { id: user.id }, data: { isActive: false } })
                fixture.inactiveCookie = authCookie(user.id, user.role)
            }
        }
        fixture.categoryId = (await prisma.category.findFirstOrThrow({ where: { isActive: true } })).id
        fixture.relatedSystemId = (await prisma.relatedSystem.findFirstOrThrow({ where: { isActive: true } })).id
    })
    afterAll(async () => {
        const tickets = await prisma.ticket.findMany({ where: { requesterId: { in: userIds } }, select: { id: true } })
        await removeTestData(userIds, tickets.map(ticket => ticket.id))
        await prisma.$disconnect()
    })
    return fixture
}
