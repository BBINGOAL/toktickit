import { test, expect } from '@playwright/test'

const staffEmail = process.env.E2E_STAFF_EMAIL || 'it1@kmutt.ac.th'
const staffPassword = process.env.E2E_STAFF_PASSWORD || 'password123'

test('Lab 3: IT staff can open the queue and ticket detail', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Email Address').fill(staffEmail)
  await page.getByLabel('Password').fill(staffPassword)
  await page.getByRole('button', { name: 'Sign In' }).click()

  if (await page.getByLabel('New Password').isVisible().catch(() => false)) {
    const newPassword = process.env.E2E_STAFF_NEW_PASSWORD || 'staffpassword123'
    await page.getByLabel('New Password').fill(newPassword)
    await page.getByLabel('Confirm New Password').fill(newPassword)
    await page.getByRole('button', { name: 'Set Password and Login' }).click()
  }
  await expect(page).toHaveURL(/\/staff\/tickets$/)
  await expect(page.getByRole('heading', { name: 'IT Staff Ticket Queue' })).toBeVisible()

  const firstTicket = page.locator('a[href^="/tickets/"]').first()
  if (await firstTicket.count()) {
    await firstTicket.click()
    await expect(page.getByText('TICKET DETAIL')).toBeVisible()
  }
})
