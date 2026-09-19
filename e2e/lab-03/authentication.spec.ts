import { test, expect } from '@playwright/test'

const requesterEmail = process.env.E2E_REQUESTER_EMAIL || 'jennifer.anderson@kmutt.ac.th'
const requesterPassword = process.env.E2E_REQUESTER_PASSWORD || 'password123'

test.describe('Lab 3 authentication', () => {
  test('valid credentials open the requester application', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Email Address').fill(requesterEmail)
    await page.getByLabel('Password').fill(requesterPassword)
    await page.getByRole('button', { name: 'Sign In' }).click()

    if (await page.getByLabel('New Password').isVisible().catch(() => false)) {
      const newPassword = process.env.E2E_FIRST_LOGIN_NEW_PASSWORD || 'newpassword123'
      await page.getByLabel('New Password').fill(newPassword)
      await page.getByLabel('Confirm New Password').fill(newPassword)
      await page.getByRole('button', { name: 'Set Password and Login' }).click()
    }
    await expect(page).toHaveURL(/\/tickets$/)
    await expect(page.getByRole('heading', { name: 'My Tickets', exact: true })).toBeVisible()
  })

  test('invalid credentials show an error and do not enter the app', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Email Address').fill(requesterEmail)
    await page.getByLabel('Password').fill('definitely-wrong-password')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page.getByText(/invalid|failed|credentials/i)).toBeVisible()
    await expect(page).toHaveURL(/\/$/)
  })
})
