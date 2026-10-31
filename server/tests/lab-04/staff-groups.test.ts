import { describe, expect, it } from 'vitest'
import { staffGroupCounts } from '../../src/services/staff-dashboard'

describe('complete Staff metric group contracts', () => {
  it('has all eight status keys and UNSET priority even for an empty database', () => {
    const r = staffGroupCounts([], [])
    expect(r.byStatus).toEqual({ NEW: 0, OPEN: 0, IN_PROGRESS: 0, WAITING_FOR_REQUESTER: 0, REOPENED: 0, RESOLVED: 0, CLOSED: 0, CANCELLED: 0 })
    expect(r.activeByPriority).toEqual({ LOW: 0, MEDIUM: 0, HIGH: 0, UNSET: 0 })
  })
  it('fills only present aggregate values and maps null priority to UNSET', () => {
    const r = staffGroupCounts([{ status: 'OPEN', _count: { _all: 4 } }], [{ itPriority: null, _count: { _all: 2 } }, { itPriority: 'HIGH', _count: { _all: 3 } }])
    expect(r.byStatus.OPEN).toBe(4); expect(r.byStatus.CLOSED).toBe(0)
    expect(r.activeByPriority).toEqual({ LOW: 0, MEDIUM: 0, HIGH: 3, UNSET: 2 })
  })
})
