import { test, expect } from '@playwright/test'

// Layout regression: mock session identity only; this is not an authentication test.
for (const role of ['REQUESTER', 'IT_STAFF', 'ADMIN']) {
  test(`navigation fits mobile, tablet and desktop for ${role}`, async ({ page }) => {
    await page.route('**/api/auth/me', route => route.fulfill({ json: {
      id: 1, name: 'A very long user name for responsive navigation testing', role, mustChangePassword: false,
    } }))
    await page.route('**/api/auth/logout', route => route.fulfill({ json: { message: 'Logged out' } }))
    await page.goto('/')
    const nav = page.getByRole('navigation')
    const logout = nav.getByRole('button', { name: 'Logout', exact: true })
    await expect(logout).toBeVisible()
    for (const width of [320, 367, 390, 768, 1024, 1280]) {
      await page.setViewportSize({ width, height: 900 })
      const bounds = await nav.locator('a, button, span').evaluateAll(elements => elements.map(element => {
        const box = element.getBoundingClientRect()
        return { left: box.left, right: box.right, bottom: box.bottom, top: box.top }
      }))
      const navBox = await nav.boundingBox()
      for (const box of bounds) {
        expect(box.left).toBeGreaterThanOrEqual(0)
        expect(box.right).toBeLessThanOrEqual(width)
        expect(box.top).toBeGreaterThanOrEqual(navBox!.y)
        expect(box.bottom).toBeLessThanOrEqual(navBox!.y + navBox!.height)
      }
      await expect(logout).toBeEnabled()
    }
    await page.setViewportSize({ width: 367, height: 900 })
    await logout.click()
    await expect(nav.getByText('Not logged in', { exact: true })).toBeVisible()
  })
}
