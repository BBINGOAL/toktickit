import { test as base, expect, type Page } from '@playwright/test'
import { fixture } from '../../server/tests/lab-04/fixtures'
import { prisma } from '../../server/src/db'
import { TEST_PASSWORD } from '../../server/tests/lab-03/test-helpers'

export const test = base.extend<{ work: Awaited<ReturnType<typeof fixture>> }>({
  work: async ({}, use) => {
    const work = await fixture()
    try {
      await prisma.ticket.update({ where: { id: work.ticket.id }, data: { ownerId: work.staff.id } })
      await use(work)
    } finally { await work.cleanup() }
  },
})
export { expect, prisma }
export async function signIn(page: Page, user: { email: string }) {
  await page.goto('/login')
  await page.getByLabel('Email Address').fill(user.email)
  await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD)
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Logout', exact: true })).toBeVisible()
}
export async function openTicket(page: Page, ticketId: number) {
  await page.goto(`/tickets/${ticketId}`)
  await expect(page.getByRole('heading', { name: 'Actions Taken', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Refresh actions', exact: true })).toBeEnabled()
}
export async function createWork(page: Page, description: string) {
  await page.getByRole('button', { name: 'New action', exact: true }).click()
  await page.getByLabel('Action description', { exact: true }).fill(description)
  await page.getByRole('button', { name: 'Create action', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Refresh actions', exact: true })).toBeEnabled()
}
