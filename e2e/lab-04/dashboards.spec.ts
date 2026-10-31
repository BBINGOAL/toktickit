import path from 'node:path'
import { test, expect, prisma, signIn } from './fixtures'
import { createTestTicket, removeTestData } from '../../server/tests/lab-03/test-helpers'
import { TEST_PASSWORD } from '../../server/tests/lab-03/test-helpers'

test('required first password change lands a Requester on Dashboard with the same session', async ({ page, work }) => {
  await prisma.user.update({ where: { id: work.other.id }, data: { mustChangePassword: true } })
  await page.goto('/')
  await page.getByLabel('Email Address', { exact: true }).fill(work.other.email)
  await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD)
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  await expect(page.getByText('For security reasons, you must change your password before continuing.')).toBeVisible()
  await page.getByLabel('New Password', { exact: true }).fill('newPassword123')
  await page.getByLabel('Confirm New Password', { exact: true }).fill('newPassword123')
  await page.getByRole('button', { name: 'Set Password and Login', exact: true }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('link', { name: 'Active Tickets: 0', exact: true })).toBeVisible()
  expect((await prisma.user.findUniqueOrThrow({ where: { id: work.other.id } })).mustChangePassword).toBe(false)
})

test('Requester lands on Dashboard, every metric drills down to matching totals and URLs survive Back/refresh', async ({ page, work }) => {
  const ids: number[] = []
  try {
    for (let i = 0; i < 11; i++) {
      const t = await createTestTicket(work.requester.id); ids.push(t.id)
      await prisma.ticket.update({ where: { id: t.id }, data: { status: i === 0 ? 'WAITING_FOR_REQUESTER' : i === 1 ? 'RESOLVED' : 'OPEN', resolvedAt: i === 1 ? new Date() : null } })
    }
    const other = await createTestTicket(work.other.id); ids.push(other.id)
    await prisma.ticket.update({ where: { id: other.id }, data: { summary: 'OTHER_REQUESTER_PRIVATE_SENTINEL' } })
    await signIn(page, work.requester)
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('link', { name: 'Active Tickets: 11', exact: true })).toBeVisible()
    const response = await page.request.get('http://localhost:4000/api/dashboards/requester')
    const snapshot = await response.json()
    expect(snapshot.recentTickets.length).toBe(5)
    expect(JSON.stringify(snapshot)).not.toContain('OTHER_REQUESTER_PRIVATE_SENTINEL')
    for (const [key, label] of [['activeTickets','Active Tickets'],['waitingForRequester','Waiting for You'],['recentlyUpdated','Recently Updated'],['recentlyResolved','Recently Resolved']] as const) {
      await page.goto('/dashboard')
      const card = page.getByRole('link', { name: new RegExp(`^${label}: \\d+$`) })
      const count = Number((await card.innerText()).match(/\d+/)![0])
      const href = await card.getAttribute('href')
      await card.focus(); await page.keyboard.press('Enter')
      await expect(page).toHaveURL('http://localhost:5173' + href)
      await expect(page.getByText(new RegExp(`of ${count} tickets$`))).toBeVisible()
      const url = page.url(); await page.reload(); await expect(page).toHaveURL(url)
      await expect(page.getByText(new RegExp(`of ${count} tickets$`))).toBeVisible()
      expect(new URL(url).searchParams.get('page')).toBe('1')
      expect(snapshot.metrics[key]).toBe(count)
    }
    await page.goto('/dashboard'); await page.getByRole('link', { name: 'Active Tickets: 11', exact: true }).click()
    await page.getByRole('button', { name: 'Next page', exact: true }).click()
    await expect(page).toHaveURL(/scope=active.*page=2/)
    await expect(page.getByText('Showing 11–11 of 11 tickets')).toBeVisible()
    await page.getByLabel('Search', { exact: true }).fill('No such ticket')
    await page.getByRole('button', { name: 'Search', exact: true }).click()
    await expect(page.getByText('No results found')).toBeVisible()
    expect(new URL(page.url()).searchParams.get('scope')).toBe('active')
    await page.goBack()
    await expect(page.getByText('Showing 11–11 of 11 tickets')).toBeVisible()
    await expect(page.getByLabel('Search', { exact: true })).toHaveValue('')
  } finally { await removeTestData([], ids) }
})

test('empty, loading, safe retry, expired session and forbidden route show explicit states', async ({ page, work }) => {
  await signIn(page, work.other)
  await expect(page.getByRole('link', { name: 'Active Tickets: 0', exact: true })).toBeVisible()
  await expect(page.getByText('No tickets yet. Create a ticket to get support.')).toBeVisible()
  let release!: () => void
  const blocked = new Promise<void>(resolve => { release = resolve })
  await page.route('**/api/dashboards/requester', async route => { await blocked; await route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"SQL SECRET"}' }) })
  await page.reload()
  await expect(page.getByRole('status')).toHaveText('Loading dashboard…')
  await expect(page.getByRole('button', { name: 'Refresh dashboard' })).toBeDisabled()
  release()
  await expect(page.getByRole('alert')).not.toContainText('SECRET')
  await expect(page.getByRole('button', { name: 'Retry dashboard' })).toBeVisible()
  await page.unroute('**/api/dashboards/requester')
  await page.getByRole('button', { name: 'Retry dashboard' }).click()
  await expect(page.getByRole('link', { name: 'Active Tickets: 0', exact: true })).toBeVisible()
  await page.route('**/api/dashboards/requester', route => route.fulfill({ status: 401, body: '{}' }))
  await page.getByRole('button', { name: 'Refresh dashboard' }).click()
  await expect(page.getByRole('alert')).toContainText('session has expired')
  await expect(page.getByRole('link', { name: 'Active Tickets: 0', exact: true })).toHaveCount(0)
  await page.unroute('**/api/dashboards/requester')
  await page.context().clearCookies(); await signIn(page, work.staff)
  await page.goto('/dashboard'); await expect(page.getByRole('heading', { name: 'Access denied' })).toBeVisible()
  await page.context().clearCookies(); await page.goto('/dashboard')
  await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible()
})

for (const width of [320, 390, 768, 1280]) {
  test(`Requester dashboard cards, navigation and links fit ${width}px and work by keyboard`, async ({ page, work }) => {
    await prisma.ticket.update({ where: { id: work.ticket.id }, data: { summary: 'VeryLongSummaryWithoutSpaces'.repeat(15) } })
    await page.setViewportSize({ width, height: 900 }); await signIn(page, work.requester)
    const card = page.getByRole('link', { name: 'Active Tickets: 1', exact: true })
    await expect(card).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const grid = page.locator('.dashboard-metrics')
    expect(await grid.evaluate(node => getComputedStyle(node).gridTemplateColumns.split(' ').length)).toBe(width >= 1000 ? 4 : width >= 600 ? 2 : 1)
    // Use actual keyboard navigation: programmatic focus after mouse sign-in
    // does not activate the browser's :focus-visible keyboard modality.
    for (let n = 0; n < 20 && !await card.evaluate(node => node === document.activeElement); n++) await page.keyboard.press('Tab')
    await expect(card).toBeFocused()
    expect(await card.evaluate(node => getComputedStyle(node).outlineStyle)).not.toBe('none')
    await page.screenshot({ path: path.resolve(__dirname, `../../artifacts/lab-04/screenshots/requester-dashboard/dashboard-${width}.png`), fullPage: true })
    await page.keyboard.press('Enter')
    await expect(page.getByRole('heading', { name: 'My Tickets', exact: true })).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const results = page.getByRole('region', { name: 'My Tickets results', exact: true })
    await results.focus(); await page.keyboard.press('End')
    const dimensions = await results.evaluate(node => ({ full: node.scrollWidth, visible: node.clientWidth }))
    if (dimensions.full > dimensions.visible) {
      await results.evaluate(node => { node.scrollLeft = node.scrollWidth })
      expect(await results.evaluate(node => node.scrollLeft)).toBeGreaterThan(0)
    }
  })
}
