import { apiFetch, BASE_URL } from './index'
import type { TicketDetail } from './index'
import type { PageMeta } from './actions'
export type WorkflowKind='status'|'owner'|'priority'|'requester-resolved'
export interface WorkflowEvent { id:number;kind:string;actor:{id:number;name:string};workCycle:number;createdAt:string;before:Record<string,unknown>|null;after:Record<string,unknown> }
export class WorkflowError extends Error {
  status:number;currentVersion?:number;fieldErrors:Record<string,string>;reasons:string[]
  constructor(status:number,body:Record<string,any>){
    super(status===409?'Ticket changed or workflow requirements are unmet. Reload before another intentional change.':status===400?'Check the workflow fields.':status===401?'Sign in again.':status===403?'You do not have permission.':status===404?'Ticket unavailable.':'Unable to load or save Ticket workflow. Please retry.')
    this.status=status;this.currentVersion=body.currentVersion;this.fieldErrors=body.fieldErrors||{};this.reasons=body.resolutionGate?.reasons||[]
  }
}
async function request<T>(path:string,init?:RequestInit):Promise<T>{
  const r=await apiFetch(`${BASE_URL}/api${path}`,init),body=await r.json().catch(()=>({}))
  if(!r.ok)throw new WorkflowError(r.status,body)
  return body as T
}
export function changeWorkflow(ticketId:number,kind:WorkflowKind,body:Record<string,unknown>,key:string){
  return request<TicketDetail>(`/tickets/${ticketId}/${kind}`,{method:kind==='requester-resolved'?'POST':'PATCH',headers:{'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify(body)})
}
export function fetchWorkflowHistory(ticketId:number,page=1){
  return request<{data:WorkflowEvent[];meta:PageMeta}>(`/tickets/${ticketId}/workflow-history?page=${page}&pageSize=10`)
}
