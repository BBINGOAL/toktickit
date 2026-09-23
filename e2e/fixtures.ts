import { test as base, expect, type Page } from '@playwright/test'
import { prisma } from '../server/src/db'
import { createTestUser, createTestTicket, removeTestData, TEST_PASSWORD } from '../server/tests/lab-03/test-helpers'
import path from 'node:path'

export const test = base.extend<{ accounts: { requester: any; staff: any; admin: any; firstLogin: any; ticket: any; createdEmail: string } }>({
  accounts: async ({}, use) => {
    const database = new URL(process.env.DATABASE_URL || 'postgresql://invalid/').pathname
    if (!database.startsWith('/toktickit_lab3_verify_')) throw new Error('E2E requires an isolated toktickit_lab3_verify_* database; start the API with the same DATABASE_URL.')
    const ids: number[] = []
    const createdEmail = `e2e-created-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`
    try {
      const requester = await createTestUser(); ids.push(requester.id)
      const staff = await createTestUser('IT_STAFF'); ids.push(staff.id)
      const admin = await createTestUser('ADMIN'); ids.push(admin.id)
      const firstLogin = await createTestUser('REQUESTER', true); ids.push(firstLogin.id)
      const ticket = await createTestTicket(requester.id)
      await use({ requester, staff, admin, firstLogin, ticket, createdEmail })
    } finally {
      const created = await prisma.user.findUnique({ where: { email: createdEmail } })
      if (created) ids.push(created.id)
      const tickets = await prisma.ticket.findMany({ where: { requesterId: { in: ids } }, select: { id: true } })
      await removeTestData(ids, tickets.map(t => t.id))
      await prisma.$disconnect()
    }
  },
})
export { expect }
export async function login(page: Page, user: { email: string }) {
  await page.goto('/')
  await page.getByLabel('Email Address').fill(user.email)
  await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD)
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
}
export async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: path.resolve(__dirname, '../report-assets/lab3-e2e', name + '.png'), fullPage: true })
}
