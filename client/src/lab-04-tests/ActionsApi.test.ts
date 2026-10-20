import { afterEach, describe, expect, it, vi } from 'vitest'
import { ActionApiError, createAction, fetchActions, fetchAssignees, updateAction } from '../api/actions'

afterEach(() => vi.unstubAllGlobals())
describe('Actions Taken transport', () => {
  it('uses credentialed requests and server pagination', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [] }) })
    vi.stubGlobal('fetch', fetch)
    await fetchActions(7, 2, 25)
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/tickets/7/actions?page=2&pageSize=25'), expect.objectContaining({ credentials: 'include' }))
    await fetchAssignees('Staff & Admin', 3)
    expect(fetch.mock.calls[1][0]).toContain('search=Staff+%26+Admin&page=3')
  })
  it('preserves the supplied intent key and versions across retry', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: {} }) })
    vi.stubGlobal('fetch', fetch)
    const body = { expectedTicketVersion: 4, actionDateTime: '2026-10-12T03:00:00Z', description: 'Inspect', result: '', assigneeId: 2, followUpRequired: false, followUpNote: '', attachmentNotes: '', followsUpActionId: null }
    await createAction(7, body, 'intent_key_123456')
    await createAction(7, body, 'intent_key_123456')
    expect(fetch.mock.calls[0]).toEqual(fetch.mock.calls[1])
    await updateAction(7, 12, { ...body, expectedVersion: 1, status: 'IN_PROGRESS' }, 'start_key_1234567')
    expect(fetch.mock.calls[2][1]).toMatchObject({ method: 'PATCH', headers: { 'Idempotency-Key': 'start_key_1234567' } })
  })
  it('exposes conflict metadata without leaking unsafe server messages', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 409, json: async () => ({ code: 'STALE_VERSION', currentVersion: 8, error: 'SELECT passwordHash FROM User' }) }))
    await expect(fetchActions(7)).rejects.toMatchObject({ status: 409, code: 'STALE_VERSION', currentVersion: 8 })
    await expect(fetchActions(7)).rejects.not.toThrow('passwordHash')
  })
  it('handles non-JSON outages as safe failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => { throw new Error('proxy internals') } }))
    await expect(fetchActions(7)).rejects.toBeInstanceOf(ActionApiError)
    await expect(fetchActions(7)).rejects.toThrow('Please retry')
  })
})
