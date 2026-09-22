import { test, expect, login, screenshot } from '../fixtures'
test('initial password must be changed before app access', async ({ page, accounts }) => {
  await login(page, accounts.firstLogin)
  await expect(page.getByText(/must change your password/i)).toBeVisible()
  await screenshot(page, '02-first-login-gate')
  await page.getByLabel('New Password', { exact: true }).fill('newpassword123')
  await page.getByLabel('Confirm New Password', { exact: true }).fill('newpassword123')
  await page.getByRole('button', { name: 'Set Password and Login' }).click()
  await expect(page).toHaveURL(/\/tickets$/)
  await expect(page.getByRole('heading', { name: 'My Tickets', exact: true })).toBeVisible()
})
