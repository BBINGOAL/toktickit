export const ticketEdges: Record<string, readonly string[]> = {
  NEW:['OPEN','CANCELLED'], OPEN:['IN_PROGRESS','WAITING_FOR_REQUESTER','CANCELLED'],
  IN_PROGRESS:['WAITING_FOR_REQUESTER','RESOLVED','CANCELLED'], WAITING_FOR_REQUESTER:['IN_PROGRESS','RESOLVED','CANCELLED'],
  RESOLVED:['CLOSED','REOPENED'], CLOSED:['REOPENED'], REOPENED:['IN_PROGRESS','CANCELLED'], CANCELLED:['REOPENED'],
}
export const advisoryStates = ['OPEN','IN_PROGRESS','WAITING_FOR_REQUESTER','REOPENED','RESOLVED']
interface Work { id:number; workCycle:number; status:string; result:string; followUpRequired:boolean; followsUpActionId:number|null }
export function resolutionGate(actions: Work[], cycle: number, eligibleOwner: boolean) {
  const current = actions.filter(a => a.workCycle === cycle)
  const completed = current.filter(a => a.status === 'COMPLETED')
  const successors = new Map<number, Work[]>()
  for (const a of completed) if (a.followsUpActionId !== null) successors.set(a.followsUpActionId, [...(successors.get(a.followsUpActionId) || []), a])
  const satisfied = (a: Work, seen = new Set<number>()): boolean => {
    if (seen.has(a.id)) return false
    if (!a.followUpRequired) return Boolean(a.result.trim())
    return (successors.get(a.id) || []).some(next => satisfied(next, new Set([...seen,a.id])))
  }
  const reasons: string[] = []
  if (!eligibleOwner) reasons.push('An active Staff/Admin Ticket owner is required.')
  if (!completed.some(a => a.result.trim())) reasons.push('At least one completed action with a result is required in this work cycle.')
  if (current.some(a => ['PLANNED','IN_PROGRESS'].includes(a.status))) reasons.push('Finish or cancel all pending actions in this work cycle.')
  if (completed.some(a => a.followUpRequired && !satisfied(a))) reasons.push('Complete linked follow-up work before resolving.')
  return { canResolve: !reasons.length, reasons, workCycle: cycle, summaryRequired: true }
}
