import { test, expect, prisma, signIn, openTicket } from './fixtures'

test('lost create response retries the exact intent without duplicating persisted work', async ({ page, work }) => {
  await signIn(page, work.staff); await openTicket(page, work.ticket.id)
  let dropped = false
  const keys: string[] = []
  await page.route(`**/api/tickets/${work.ticket.id}/actions`, async route => {
    if (route.request().method() !== 'POST') return route.continue()
    keys.push(route.request().headers()['idempotency-key'])
    if (!dropped) { dropped = true; await route.fetch(); return route.abort('failed') }
    await route.continue()
  })
  await page.getByRole('button', { name: 'New action', exact: true }).click()
  await page.getByLabel('Action description', { exact: true }).fill('Keep draft across lost response')
  await page.getByRole('button', { name: 'Create action', exact: true }).click()
  await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible()
  await expect(page.getByLabel('Action description', { exact: true })).toHaveValue('Keep draft across lost response')
  await page.getByRole('button', { name: 'Retry same submission', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(keys).toHaveLength(2); expect(keys[0]).toBe(keys[1])
  expect(await prisma.actionTaken.count({ where: { ticketId: work.ticket.id } })).toBe(1)
})

test('stale create preserves draft, explicitly reloads versions and saves on deliberate retry', async ({ page, work }) => {
  await signIn(page, work.staff); await openTicket(page, work.ticket.id)
  await page.getByRole('button', { name: 'New action', exact: true }).click()
  await page.getByLabel('Action description', { exact: true }).fill('Preserved stale draft')
  await prisma.ticket.update({ where: { id: work.ticket.id }, data: { version: { increment: 1 } } })
  await page.getByRole('button', { name: 'Create action', exact: true }).click()
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Your draft has been kept')
  await page.getByRole('button', { name: 'Reload current state (keep draft)', exact: true }).click()
  await expect(page.getByLabel('Action description', { exact: true })).toBeEnabled()
  await expect(page.getByLabel('Action description', { exact: true })).toHaveValue('Preserved stale draft')
  await page.getByRole('button', { name: 'Create action', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(await prisma.actionTaken.count({ where: { ticketId: work.ticket.id } })).toBe(1)
})
