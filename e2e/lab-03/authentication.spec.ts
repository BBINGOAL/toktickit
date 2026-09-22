import { test, expect, login, screenshot } from '../fixtures'
test('valid credentials open the requester application', async ({ page, accounts }) => {
  await login(page, accounts.requester)
  await expect(page).toHaveURL(/\/tickets$/)
  await expect(page.getByRole('heading', { name: 'My Tickets', exact: true })).toBeVisible()
  await screenshot(page, '03-requester-my-tickets')
})
test('invalid credentials show an error and do not enter the app', async ({ page, accounts }) => {
  await page.goto('/')
  await page.getByLabel('Email Address').fill(accounts.requester.email)
  await page.getByLabel('Password', { exact: true }).fill('definitely-wrong-password')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page.getByText(/invalid|failed|credentials/i)).toBeVisible()
  await expect(page).toHaveURL(/\/$/)
  await screenshot(page, '08-invalid-login')
})
