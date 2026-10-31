import path from 'node:path'
import { test, expect, signIn } from './fixtures'
import type { Page } from '@playwright/test'

async function contrastFailures(page: Page) {
  // Rendered solid text only: not a WCAG certification or an image/gradient audit.
  return page.evaluate(() => {
    const rgb = (value: string) => (value.match(/[\d.]+/g) || []).map(Number)
    const luminance = (c: number[]) => c.slice(0,3).map(v => v/255).map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4)
      .reduce((sum, v, i) => sum + v*[.2126,.7152,.0722][i], 0)
    const failures: object[] = [], walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    let node: Node | null
    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim() || '', element = node.parentElement
      if (!element || !/[a-z0-9]/i.test(text) || element.closest('script,style,option,:disabled,[aria-hidden=true],[hidden]')) continue
      const range = document.createRange(); range.selectNodeContents(node)
      if (!range.getBoundingClientRect().width || !range.getBoundingClientRect().height) continue
      const style = getComputedStyle(element), foreground = rgb(style.color)
      const backgrounds: number[][] = []
      let current: HTMLElement | null = element
      while (current) { backgrounds.push(rgb(getComputedStyle(current).backgroundColor)); current = current.parentElement }
      let background = [255,255,255]
      for (const c of backgrounds.reverse()) {
        const alpha = c[3] ?? 1
        background = background.map((v,i) => (c[i] || 0)*alpha + v*(1-alpha))
      }
      const f = luminance(foreground), b = luminance(background), ratio = (Math.max(f,b)+.05)/(Math.min(f,b)+.05)
      const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && Number(style.fontWeight) >= 700)
      if (ratio + .001 < (large ? 3 : 4.5)) failures.push({ text: text.slice(0,90), ratio: Number(ratio.toFixed(2)), color: style.color, background })
    }
    return failures
  })
}
async function fits(page: Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  const nav = page.getByRole('navigation', { name: 'Application navigation' })
  const logout = nav.getByRole('button', { name: 'Logout', exact: true })
  await expect(logout).toBeVisible()
  const box = await logout.boundingBox()
  expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual((await page.evaluate(() => innerWidth)) + 1)
}
async function dialogFits(page: Page) {
  const box = await page.getByRole('dialog').boundingBox()
  const viewport = page.viewportSize()!
  expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.y).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1)
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1)
}

for (const role of ['requester','staff','admin'] as const) {
  test(`${role} earlier screens and dashboards support labelled controls, contrast, four widths and 200% CSS zoom`, async ({ page, work }) => {
    await page.goto('/'); await page.getByLabel('Email Address').waitFor()
    expect(await contrastFailures(page)).toEqual([])
    await signIn(page, work[role])
    const routes = role === 'requester' ? ['/dashboard','/tickets','/create',`/tickets/${work.ticket.id}`]
      : ['/staff/dashboard','/staff/tickets',`/tickets/${work.ticket.id}`, ...(role === 'admin' ? ['/admin/users'] : [])]
    for (const route of routes) {
      await page.goto(route)
      await expect(page.locator('h1')).toBeVisible()
      // Wait for real content instead of auditing only skeletons.
      if (route.includes('/tickets/') ) await expect(page.getByRole('button', { name: 'Refresh actions', exact: true })).toBeEnabled()
      if (route === '/admin/users') await expect(page.getByText('Loading users...')).toHaveCount(0)
      if (route.endsWith('dashboard')) await expect(page.getByRole('button', { name: 'Refresh dashboard', exact: true })).toBeEnabled()
      if (route === '/create') {
        await expect(page.getByLabel('Summary', { exact: false })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Submit Ticket', exact: true })).toHaveCSS('background-color', 'rgb(0, 107, 60)')
        await expect(page.getByRole('button', { name: '+ Add Attachment', exact: true })).toHaveCSS('background-color', 'rgb(255, 255, 255)')
      }
      expect(await contrastFailures(page), route).toEqual([])
      for (const width of [320,390,768,1280]) {
        await page.setViewportSize({ width, height: 900 }); await fits(page)
      }
      await page.setViewportSize({ width: 1280, height: 900 })
      await page.evaluate(() => { document.documentElement.style.zoom = '2' })
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).zoom)).toBe('2')
      await fits(page)
      if (route === '/admin/users') {
        const trigger = page.getByRole('button', { name: '+ New User', exact: true })
        await trigger.click()
        const dialog = page.getByRole('dialog', { name: 'Create New User', exact: true })
        await expect(dialog).toBeFocused(); await dialogFits(page)
        await dialog.getByLabel('Full Name').fill('Zoomed user draft')
        await page.screenshot({ path: path.resolve(__dirname, '../../artifacts/lab-04/screenshots/hardening/admin-user-dialog-zoom200.png') })
        page.once('dialog', prompt => prompt.accept()); await page.keyboard.press('Escape')
        await expect(dialog).toHaveCount(0); await expect(trigger).toBeFocused()
      }
      if (route.includes('/tickets/') && role !== 'requester') {
        const trigger = page.getByRole('button', { name: 'New action', exact: true }); await trigger.click()
        const dialog = page.getByRole('dialog', { name: 'New Action Taken', exact: true })
        await expect(dialog).toBeFocused(); await dialogFits(page)
        await dialog.getByLabel('Action description', { exact: true }).fill('Zoomed work draft')
        await page.screenshot({ path: path.resolve(__dirname, `../../artifacts/lab-04/screenshots/hardening/${role}-action-dialog-zoom200.png`) })
        page.once('dialog', prompt => prompt.accept()); await page.keyboard.press('Escape')
        await expect(dialog).toHaveCount(0); await expect(trigger).toBeFocused()
      }
      await page.screenshot({ path: path.resolve(__dirname, `../../artifacts/lab-04/screenshots/hardening/${role}-${route.replaceAll('/','_')}-zoom200.png`), fullPage: true })
      await page.evaluate(() => { document.documentElement.style.zoom = '1' })
    }
  })
}
