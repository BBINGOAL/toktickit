import { describe, expect, it } from 'vitest'
import { dashboardWindow } from '../../src/services/dashboard-rules'

describe('seven Bangkok calendar dates, independent of host timezone', () => {
  it.each([
    ['2026-10-28T16:59:59.999Z', '2026-10-21T17:00:00.000Z'],
    ['2026-10-28T17:00:00.000Z', '2026-10-22T17:00:00.000Z'],
    ['2026-01-01T00:00:00.000Z', '2025-12-25T17:00:00.000Z'],
    ['2024-03-01T00:00:00.000Z', '2024-02-23T17:00:00.000Z'],
    ['2026-03-01T00:00:00.000Z', '2026-02-22T17:00:00.000Z'],
  ])('%s starts at %s', (now, start) => {
    const window = dashboardWindow(new Date(now))
    expect(window.windowStart.toISOString()).toBe(start)
    expect(window.asOf.toISOString()).toBe(now)
    expect(window.timezone).toBe('Asia/Bangkok')
  })
})
