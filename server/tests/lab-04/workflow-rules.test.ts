import { describe, expect, it } from 'vitest'
import { ticketEdges, resolutionGate } from '../../src/services/workflow-rules'
const states = ['NEW','OPEN','IN_PROGRESS','WAITING_FOR_REQUESTER','RESOLVED','CLOSED','REOPENED','CANCELLED']
const edges = ['NEW:OPEN','NEW:CANCELLED','OPEN:IN_PROGRESS','OPEN:WAITING_FOR_REQUESTER','OPEN:CANCELLED','IN_PROGRESS:WAITING_FOR_REQUESTER','IN_PROGRESS:RESOLVED','IN_PROGRESS:CANCELLED','WAITING_FOR_REQUESTER:IN_PROGRESS','WAITING_FOR_REQUESTER:RESOLVED','WAITING_FOR_REQUESTER:CANCELLED','RESOLVED:CLOSED','RESOLVED:REOPENED','CLOSED:REOPENED','REOPENED:IN_PROGRESS','REOPENED:CANCELLED','CANCELLED:REOPENED']
const done = { id: 1, workCycle: 1, status: 'COMPLETED', result: 'Verified', followUpRequired: false, followsUpActionId: null }
describe('Ticket workflow contract', () => {
  it.each(states.flatMap(from => states.map(to => [from,to])))('%s -> %s matches the complete matrix', (from,to) => {
    expect(ticketEdges[from].includes(to)).toBe(edges.includes(`${from}:${to}`))
  })
  it('rejects zero-action, unfinished, missing-result and missing-owner resolution', () => {
    expect(resolutionGate([],1,true).canResolve).toBe(false)
    expect(resolutionGate([{...done,status:'PLANNED'}],1,true).canResolve).toBe(false)
    expect(resolutionGate([{...done,result:'  '}],1,true).canResolve).toBe(false)
    expect(resolutionGate([done],1,false).canResolve).toBe(false)
  })
  it('accepts completed current-cycle work, never old or cancelled work', () => {
    expect(resolutionGate([done],1,true).canResolve).toBe(true)
    expect(resolutionGate([done],2,true).canResolve).toBe(false)
    expect(resolutionGate([{...done,status:'CANCELLED'}],1,true).canResolve).toBe(false)
  })
  it('requires every follow-up chain to end at completed non-follow-up work', () => {
    const first={...done,followUpRequired:true}
    expect(resolutionGate([first],1,true).canResolve).toBe(false)
    expect(resolutionGate([first,{...done,id:2,followsUpActionId:1}],1,true).canResolve).toBe(true)
    expect(resolutionGate([first,{...done,id:2,followsUpActionId:1,status:'CANCELLED'}],1,true).canResolve).toBe(false)
    expect(resolutionGate([first,{...first,id:2,followsUpActionId:1},{...done,id:3,followsUpActionId:2}],1,true).canResolve).toBe(true)
    expect(resolutionGate([{...first,followsUpActionId:2},{...first,id:2,followsUpActionId:1}],1,true).canResolve).toBe(false)
  })
})
