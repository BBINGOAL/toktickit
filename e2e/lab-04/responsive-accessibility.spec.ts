import path from 'node:path'
import { test, expect, signIn, openTicket, createWork } from './fixtures'

for (const width of [320, 390, 768, 1280]) {
  test(`Actions list/form stay within ${width}px viewport with keyboard focus`, async ({ page, work }) => {
    await page.setViewportSize({ width, height: 900 })
    await signIn(page, work.staff); await openTicket(page, work.ticket.id)
    await createWork(page, 'Responsive long action ' + 'diagnostic '.repeat(20))
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({ path: path.resolve(__dirname, `../../artifacts/lab-04/screenshots/actions-taken/list-${width}.png`), fullPage: true })
    await page.getByRole('region', { name: 'Actions Taken', exact: true }).screenshot({ path: path.resolve(__dirname, `../../artifacts/lab-04/screenshots/actions-taken/section-${width}.png`) })
    const trigger = page.getByRole('button', { name: 'New action', exact: true })
    await trigger.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(page.getByRole('button', { name: 'Create action', exact: true })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toBeFocused()
    const bounds = await dialog.boundingBox()
    expect(bounds!.x).toBeGreaterThanOrEqual(0); expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width)
    await expect.poll(() => dialog.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true)
    await expect(dialog.getByRole('navigation', { name: 'Assignee pages', exact: true })).toBeVisible()
    await page.screenshot({ path: path.resolve(__dirname, `../../artifacts/lab-04/screenshots/actions-taken/form-${width}.png`) })
    await page.getByRole('button', { name: 'Create action', exact: true }).scrollIntoViewIfNeeded()
    await page.screenshot({ path: path.resolve(__dirname, `../../artifacts/lab-04/screenshots/actions-taken/form-bottom-${width}.png`) })
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0); await expect(trigger).toBeFocused()
  })
}
