import { describe, it, expect } from 'vitest'
import { normalizedFields, validateMerged, transition, integer } from '../../src/services/action-rules'

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
  it.each([
    ['description', 2000, true], ['result', 2000, false], ['followUpNote', 2000, false],
    ['attachmentNotes', 1000, false], ['cancellationReason', 1000, true],
  ] as const)('checks exact lower/upper text boundaries for %s', (field, limit, required) => {
    expect(normalizedFields({ [field]: 'x'.repeat(limit) }, false, 1)[field]).toHaveLength(limit)
    expect(normalizedFields({ [field]: ' x ' }, false, 1)[field]).toBe('x')
    expect(() => normalizedFields({ [field]: 'x'.repeat(limit + 1) }, false, 1)).toThrow()
    expect(() => normalizedFields({ [field]: 12 }, false, 1)).toThrow()
    if (required) expect(() => normalizedFields({ [field]: '  ' }, false, 1)).toThrow()
    else expect(normalizedFields({ [field]: ' ' }, false, 1)[field]).toBe('')
  })
  it('validates exact time bounds and required cancellation fields', () => {
    const created = new Date('2026-01-01T00:00:00Z'), now = new Date('2026-01-02T00:00:00Z')
    const base = { actionDateTime: now, followUpRequired: false, result: 'Verified', status: 'COMPLETED' }
    expect(() => validateMerged(base, created, now)).not.toThrow()
    expect(() => validateMerged({ ...base, actionDateTime: new Date(now.getTime() + 1) }, created, now)).toThrow()
    expect(() => validateMerged({ ...base, status: 'CANCELLED' }, created, now)).toThrow()
    expect(() => validateMerged({ ...base, status: 'CANCELLED', cancellationReason: 'No longer needed' }, created, now)).not.toThrow()
  })
  it('rejects invalid integer/boolean/status fields including explicit null assignee', () => {
    for (const value of [-1, 0.5, '1', NaN, Infinity, 2147483648, null]) expect(() => integer(value, 'version')).toThrow()
    expect(integer(0, 'version')).toBe(0)
    expect(() => normalizedFields({ assigneeId: null }, false, 1)).toThrow()
    expect(() => normalizedFields({ followUpRequired: 'true' }, false, 1)).toThrow()
    expect(() => normalizedFields({ status: 'OPEN' }, false, 1)).toThrow()
  })
})
