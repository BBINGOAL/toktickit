import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../../src/db'
import fs from 'node:fs/promises'
import path from 'node:path'

export const TEST_PASSWORD = 'password123'
const JWT_SECRET = process.env.JWT_SECRET || 'toktickit-super-secret-key'

export function authCookie(userId: number, role: string) {
    return `token=${jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '1h' })}`
}

export async function createTestUser(role: 'REQUESTER' | 'IT_STAFF' | 'ADMIN' = 'REQUESTER', mustChangePassword = false) {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    return prisma.user.create({
        data: {
            name: `Lab 3 ${role} ${suffix}`,
            email: `lab3-${role.toLowerCase()}-${suffix}@kmutt.ac.th`,
            passwordHash: await bcrypt.hash(TEST_PASSWORD, 10),
            role,
            isActive: true,
            mustChangePassword,
        },
    })
}

export async function createTestTicket(requesterId: number, suffix = `${Date.now()}`) {
    const category = await prisma.category.findFirst({ where: { isActive: true } })
    const relatedSystem = await prisma.relatedSystem.findFirst({ where: { isActive: true } })
    if (!category || !relatedSystem) throw new Error('Seed reference data missing')

    return prisma.ticket.create({
        data: {
            ticketNumber: `LAB3-${suffix}-${Math.random().toString(36).slice(2, 6)}`,
            summary: 'Lab 3 test ticket',
            description: 'Ticket created by Lab 3 automated tests',
            requestedPriority: 'MEDIUM',
            itPriority: 'MEDIUM',
            status: 'OPEN',
            requesterId,
            categoryId: category.id,
            relatedSystemId: relatedSystem.id,
        },
    })
}

export async function removeTestData(userIds: number[], ticketIds: number[] = []) {
    if (ticketIds.length) {
        const attachments = await prisma.attachment.findMany({ where: { ticketId: { in: ticketIds } }, select: { storedFilename: true } })
        const uploads = path.resolve(__dirname, '../../uploads')
        for (const attachment of attachments) {
            const target = path.resolve(uploads, attachment.storedFilename)
            if (path.dirname(target) !== uploads) throw new Error('Unsafe test attachment path')
            await fs.rm(target, { force: true })
        }
        await prisma.publicComment.deleteMany({ where: { ticketId: { in: ticketIds } } })
        await prisma.internalNote.deleteMany({ where: { ticketId: { in: ticketIds } } })
        await prisma.attachment.deleteMany({ where: { ticketId: { in: ticketIds } } })
        await prisma.ticket.deleteMany({ where: { id: { in: ticketIds } } })
    }
    if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } })
}
