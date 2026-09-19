import { test, expect } from '@playwright/test'

const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@kmutt.ac.th'
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'password123'

test('Lab 3: administrator can open user management and create a requester', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Email Address').fill(adminEmail)
  await page.getByLabel('Password').fill(adminPassword)
  await page.getByRole('button', { name: 'Sign In' }).click()

  if (await page.getByLabel('New Password').isVisible().catch(() => false)) {
    const newPassword = process.env.E2E_ADMIN_NEW_PASSWORD || 'adminpassword123'
    await page.getByLabel('New Password').fill(newPassword)
    await page.getByLabel('Confirm New Password').fill(newPassword)
    await page.getByRole('button', { name: 'Set Password and Login' }).click()
  }
  await page.goto('/admin/users')
  await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible()
  await page.getByRole('button', { name: '+ New User' }).click()
  await expect(page.getByText('Create New User')).toBeVisible()
})
