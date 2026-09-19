import { test, expect } from '@playwright/test'

const firstLoginEmail = process.env.E2E_FIRST_LOGIN_EMAIL || 'michael.brown@kmutt.ac.th'
const firstLoginPassword = process.env.E2E_FIRST_LOGIN_PASSWORD || 'password123'
const newPassword = process.env.E2E_FIRST_LOGIN_NEW_PASSWORD || 'newpassword123'

test('Lab 3: initial password must be changed before app access', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Email Address').fill(firstLoginEmail)
  await page.getByLabel('Password').fill(firstLoginPassword)
  await page.getByRole('button', { name: 'Sign In' }).click()

  await expect(page.getByText(/must change your password/i)).toBeVisible()
  await page.getByLabel('New Password').fill(newPassword)
  await page.getByLabel('Confirm New Password').fill(newPassword)
  await page.getByRole('button', { name: 'Set Password and Login' }).click()
  await expect(page).toHaveURL(/\/tickets$/)
})
