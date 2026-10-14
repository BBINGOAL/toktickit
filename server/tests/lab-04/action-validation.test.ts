import { describe, it, expect } from 'vitest'
import { normalizedFields, validateMerged, transition } from '../../src/services/action-rules'

describe('Actions Taken validation and state edges', () => {
  it('allows one edge per request, never direct PLANNED -> COMPLETED', () => {
    expect(() => transition('PLANNED', 'IN_PROGRESS')).not.toThrow()
    expect(() => transition('IN_PROGRESS', 'COMPLETED')).not.toThrow()
    expect(() => transition('PLANNED', 'COMPLETED')).toThrow('Cannot transition')
    expect(() => transition('COMPLETED', 'IN_PROGRESS')).toThrow()
    expect(() => transition('IN_PROGRESS', 'IN_PROGRESS')).toThrow()
  })
  it.each(['2026-02-30T12:00:00Z', '2026-13-01T00:00:00Z', '2026-01-01T24:00:00Z', '2026-01-01T00:00:00', 'junk'])('rejects malformed/normalized calendar date %s', date => {
    expect(() => normalizedFields({ actionDateTime: date, description: 'Work' }, true, 1)).toThrow()
  })
  it('normalizes whitespace and offset-qualified work time', () => {
    const a = normalizedFields({ actionDateTime: '2026-10-14T10:00:00+07:00', description: ' Inspect VPN ' }, true, 1)
    expect(a.actionDateTime.toISOString()).toBe('2026-10-14T03:00:00.000Z')
    expect(a.description).toBe('Inspect VPN')
    expect(a.assigneeId).toBe(1)
  })
  it('validates completion and follow-up on the full merged state', () => {
    const created = new Date('2026-01-01T00:00:00Z'), now = new Date('2026-01-02T00:00:00Z')
    const base = { actionDateTime: created, followUpRequired: false, result: '', status: 'PLANNED' }
    expect(() => validateMerged(base, created, now)).not.toThrow()
    expect(() => validateMerged({ ...base, status: 'COMPLETED' }, created, now)).toThrow()
    expect(() => validateMerged({ ...base, followUpRequired: true, followUpNote: '' }, created, now)).toThrow()
    expect(() => validateMerged({ ...base, actionDateTime: new Date('2025-01-01') }, created, now)).toThrow()
  })
})
