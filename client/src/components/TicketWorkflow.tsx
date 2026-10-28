import { useEffect,useRef,useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchTicketDetail } from '../api'
import type { TicketDetail } from '../api'
import { changeWorkflow,fetchWorkflowHistory,WorkflowError } from '../api/workflow'
import type { WorkflowEvent,WorkflowKind } from '../api/workflow'
import type { PageMeta } from '../api/actions'
import './ActionsTaken.css'

function Timeline({ticketId,version}:{ticketId:number;version?:number}){
  const [page,setPage]=useState(1),[data,setData]=useState<{data:WorkflowEvent[];meta:PageMeta}|null>(null),[error,setError]=useState(''),[retry,setRetry]=useState(0)
  useEffect(()=>{let live=true;setError('');setData(null);fetchWorkflowHistory(ticketId,page).then(v=>{if(live)setData(v)}).catch(()=>{if(live)setError('Unable to load workflow history.')});return()=>{live=false}},[ticketId,version,page,retry])
  const fields=['status','ownerId','itPriority','resolutionSummary','resolvedAt','cancelledReason','requesterResolved','requesterResolvedAt','workCycle']
  return <section aria-label="Ticket workflow history"><h3>Ticket history</h3>{error?<div role="alert">{error}<button onClick={()=>setRetry(n=>n+1)}>Retry Ticket history</button></div>:!data?<p role="status">Loading Ticket history...</p>:<>
    {!data.data.length&&<p>No workflow history yet.</p>}
    <ol className="action-history">{data.data.map(e=><li key={e.id}><strong>{e.kind}</strong> · {e.actor.name} · Cycle {e.workCycle} · {new Date(e.createdAt).toLocaleString('en-GB',{timeZone:'Asia/Bangkok'})} (Bangkok)
      <ul>{fields.filter(k=>JSON.stringify(e.before?.[k])!==JSON.stringify(e.after[k])).map(k=><li key={k}>{k}: {String(e.before?.[k]??'None')} → {String(e.after[k]??'None')}</li>)}</ul></li>)}</ol>
    <nav aria-label="Ticket history pages" className="actions-toolbar"><span>Page {data.meta.totalPages?page:0} of {data.meta.totalPages}</span><button disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Previous</button><button disabled={page>=data.meta.totalPages} onClick={()=>setPage(p=>p+1)}>Next</button></nav>
  </>}</section>
}
export default function TicketWorkflow({ticket,onChanged}:{ticket:TicketDetail;onChanged:(ticket:TicketDetail)=>void}){
  const {user}=useAuth(),staff=user?.role==='IT_STAFF'||user?.role==='ADMIN'
  const [target,setTarget]=useState(ticket.status),[summary,setSummary]=useState(''),[reason,setReason]=useState(''),[priority,setPriority]=useState(ticket.itPriority||'')
  const [pending,setPending]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[conflict,setConflict]=useState(false),[blocked,setBlocked]=useState(false)
  const [intent,setIntent]=useState<{kind:WorkflowKind;body:Record<string,unknown>;key:string}|null>(null)
  const [currentVersion,setCurrentVersion]=useState<number|undefined>(),[gateReasons,setGateReasons]=useState<string[]>([])
  const [fieldErrors,setFieldErrors]=useState<Record<string,string>>({})
  const busy=useRef(false),errorBox=useRef<HTMLDivElement>(null)
  const lastStatus=useRef(ticket.status),lastPriority=useRef(ticket.itPriority)
  useEffect(()=>{
    if(lastStatus.current!==ticket.status){lastStatus.current=ticket.status;setTarget(ticket.status)}
    if(lastPriority.current!==ticket.itPriority){lastPriority.current=ticket.itPriority;setPriority(ticket.itPriority||'')}
  },[ticket.status,ticket.itPriority])
  const frozen=pending||Boolean(intent)||conflict||blocked||ticket.version===undefined
  async function submit(kind:WorkflowKind,fields:Record<string,unknown>){
    if(busy.current||conflict||blocked||ticket.version===undefined)return
    if(kind==='status'&&target==='RESOLVED'&&!summary.trim()){setFieldErrors({resolutionSummary:'Enter a resolution summary.'});setError('Enter a resolution summary.');queueMicrotask(()=>errorBox.current?.focus());return}
    if(kind==='status'&&target==='CANCELLED'&&!reason.trim()){setFieldErrors({cancellationReason:'Enter a cancellation reason.'});setError('Enter a cancellation reason.');queueMicrotask(()=>errorBox.current?.focus());return}
    const request=intent||{kind,body:{...fields,expectedVersion:ticket.version},key:crypto.randomUUID()}
    if(!intent&&kind==='status'&&target==='CANCELLED'&&!window.confirm('Cancel this Ticket and its unfinished actions? All history will be kept.'))return
    busy.current=true;setPending(true);setIntent(request);setError('');setNotice('');setFieldErrors({})
    try{const updated=await changeWorkflow(ticket.id,request.kind,request.body,request.key);setIntent(null);setNotice('Ticket workflow saved.');onChanged(updated)}
    catch(e){
      setError(e instanceof WorkflowError?e.message:'Unable to save workflow. Please retry the same submission.')
      if(e instanceof WorkflowError){setFieldErrors(e.fieldErrors);setGateReasons(e.reasons);setCurrentVersion(e.currentVersion);if(e.status<500)setIntent(null);if(e.status===409)setConflict(true);if([401,403,404].includes(e.status))setBlocked(true)}
      queueMicrotask(()=>errorBox.current?.focus())
    }finally{busy.current=false;setPending(false)}
  }
  async function reload(){
    if(busy.current)return;busy.current=true;setPending(true)
    try{const updated=await fetchTicketDetail(ticket.id);onChanged(updated);setIntent(null);setConflict(false);setGateReasons([]);setError('');setNotice('Current Ticket loaded; your summary/reason drafts are retained.')}
    catch{setError('Unable to reload Ticket. Your drafts have been kept.')}finally{busy.current=false;setPending(false)}
  }
  return <section className="actions-section" aria-label="Ticket workflow" aria-busy={pending}>
    <h2>Ticket workflow</h2><p>Current status: <strong>{ticket.status}</strong> · Work cycle {ticket.workCycle??1} · Version {ticket.version??'unavailable'}</p>
    <div role="status" aria-live="polite">{notice}</div>
    {error&&<div ref={errorBox} tabIndex={-1} role="alert" className="action-error">{error}{currentVersion!==undefined&&<p>Current server version: {currentVersion}</p>}{gateReasons.map(r=><p key={r}>{r}</p>)}</div>}
    {conflict&&<button disabled={pending} onClick={reload}>Reload Ticket (keep drafts)</button>}
    {intent&&<div className="action-error"><p>The previous request may already have succeeded. Retry sends the exact same request/key, not a new mutation.</p><button disabled={pending} onClick={()=>void submit(intent.kind,intent.body)}>Retry same workflow submission</button></div>}
    {staff?<>
      <div className="actions-toolbar"><label htmlFor="ticket-status">Update Status</label><select id="ticket-status" disabled={frozen} value={target} onChange={e=>setTarget(e.target.value)}><option value={ticket.status}>{ticket.status}</option>{(ticket.allowedNextStatuses||[]).map(s=><option key={s}>{s}</option>)}</select></div>
      {target==='RESOLVED'&&<div className="action-field"><label htmlFor="resolution-summary">Resolution summary (required)</label><textarea id="resolution-summary" aria-required="true" aria-invalid={Boolean(fieldErrors.resolutionSummary)} aria-describedby={fieldErrors.resolutionSummary?'workflow-summary-error':undefined} disabled={frozen} value={summary} maxLength={2000} onChange={e=>setSummary(e.target.value)}/>{fieldErrors.resolutionSummary&&<small id="workflow-summary-error">{fieldErrors.resolutionSummary}</small>}</div>}
      {target==='CANCELLED'&&<div className="action-field"><label htmlFor="ticket-cancel-reason">Ticket cancellation reason (required)</label><textarea id="ticket-cancel-reason" aria-required="true" aria-invalid={Boolean(fieldErrors.cancellationReason)} aria-describedby={fieldErrors.cancellationReason?'workflow-cancel-error':undefined} disabled={frozen} value={reason} maxLength={1000} onChange={e=>setReason(e.target.value)}/>{fieldErrors.cancellationReason&&<small id="workflow-cancel-error">{fieldErrors.cancellationReason}</small>}</div>}
      <button className="primary" disabled={frozen||target===ticket.status} onClick={()=>void submit('status',{status:target,...(target==='RESOLVED'?{resolutionSummary:summary.trim()}:{}),...(target==='CANCELLED'?{cancellationReason:reason.trim()}: {})})}>Apply status</button>
      {ticket.resolutionGate&&!ticket.resolutionGate.canResolve&&<div><p>Resolution requirements:</p><ul>{ticket.resolutionGate.reasons.map(r=><li key={r}>{r}</li>)}</ul></div>}
      <div className="actions-toolbar"><label htmlFor="ticket-priority">IT Priority</label><select id="ticket-priority" value={priority} disabled={frozen} onChange={e=>setPriority(e.target.value)}><option value="">Unset</option>{['LOW','MEDIUM','HIGH'].map(p=><option key={p}>{p}</option>)}</select><button disabled={frozen||priority===(ticket.itPriority||'')} onClick={()=>void submit('priority',{itPriority:priority||null})}>Save priority</button></div>
      <div className="actions-toolbar"><span>Owner: {ticket.owner?.name||'Unassigned'}</span>{ticket.owner?.id!==user?.id&&<button disabled={frozen} onClick={()=>void submit('owner',{ownerId:user?.id})}>{ticket.owner?'Take Over':'Assign to me'}</button>}{ticket.owner&&<button disabled={frozen} onClick={()=>void submit('owner',{ownerId:null})}>Unassign owner</button>}</div>
    </>:<div><p>Problem appears resolved? This is an advisory indication only; IT Staff must review and formally update the Ticket.</p>{ticket.requesterResolved?<p>You indicated that this problem appears resolved.</p>:ticket.canIndicateResolved&&<button disabled={frozen} onClick={()=>void submit('requester-resolved',{})}>Problem appears resolved</button>}</div>}
    <Timeline ticketId={ticket.id} version={ticket.version}/>
  </section>
}
