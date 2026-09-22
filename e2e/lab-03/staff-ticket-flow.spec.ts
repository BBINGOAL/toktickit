import { test, expect, login, screenshot } from '../fixtures'
test('IT staff can open the queue and ticket detail', async ({ page, accounts }) => {
  await login(page, accounts.staff)
  await expect(page).toHaveURL(/\/staff\/tickets$/)
  await expect(page.getByRole('heading', { name: 'IT Staff Ticket Queue' })).toBeVisible()
  const ticket = page.locator('a[href="/tickets/' + accounts.ticket.id + '"]')
  await expect(ticket).toBeVisible()
  await screenshot(page, '04-it-staff-ticket-queue')
  await ticket.click()
  await expect(page.getByText('TICKET DETAIL', { exact: true })).toBeVisible()
  await screenshot(page, '05-it-staff-ticket-detail')
})
