import { Prisma } from '../generated/prisma/client'
import { prisma } from '../db'
import { ActionError, integer, invalid, object, text } from './action-rules'
import { actionTransaction, digest, json, lockTicket, publicAction, replay } from './actions'
import { advisoryStates, resolutionGate, ticketEdges } from './workflow-rules'
type Tx = Prisma.TransactionClient
type Kind = 'status'|'owner'|'priority'|'requester-resolved'
const notFound = () => new ActionError(404,'NOT_FOUND','Resource not found')
export const detailInclude = {
  requester:{select:{id:true,name:true}}, category:{select:{id:true,name:true}}, relatedSystem:{select:{id:true,name:true}}, owner:{select:{id:true,name:true}},
  attachments:{select:{id:true,originalFilename:true,mimeType:true,sizeBytes:true,isRemoved:true,createdAt:true,removedAt:true,removalReason:true}},
} satisfies Prisma.TicketInclude
export async function ticketView(tx: Pick<Tx,'ticket'|'user'|'actionTaken'>, id:number, userId:number, role:string) {
  const ticket = await tx.ticket.findFirst({where:{id,...(role==='REQUESTER'?{requesterId:userId}:{})},include:detailInclude})
  if(!ticket) throw notFound()
  const owner=ticket.ownerId ? await tx.user.findUnique({where:{id:ticket.ownerId},select:{isActive:true,role:true}}):null
  const actions=await tx.actionTaken.findMany({where:{ticketId:id,workCycle:ticket.workCycle},select:{id:true,workCycle:true,status:true,result:true,followUpRequired:true,followsUpActionId:true}})
  return {...ticket,allowedNextStatuses:role==='REQUESTER'?[]:ticketEdges[ticket.status],resolutionGate:resolutionGate(actions,ticket.workCycle,Boolean(owner?.isActive&&['IT_STAFF','ADMIN'].includes(owner.role))),canIndicateResolved:role==='REQUESTER'&&advisoryStates.includes(ticket.status)}
}
function snapshot(t: {status:string;ownerId:number|null;itPriority:string|null;resolutionSummary:string|null;resolvedAt:Date|null;cancelledReason:string|null;requesterResolved:boolean;requesterResolvedAt:Date|null;workCycle:number;version:number}) {
  const {status,ownerId,itPriority,resolutionSummary,resolvedAt,cancelledReason,requesterResolved,requesterResolvedAt,workCycle,version}=t
  return json({status,ownerId,itPriority,resolutionSummary,resolvedAt,cancelledReason,requesterResolved,requesterResolvedAt,workCycle,version})
}
export async function mutateWorkflow(id:number, kind:Kind, actorId:number, body:unknown, key?:string) {
  const input=object(body,['expectedVersion',...(kind==='status'?['status','resolutionSummary','cancellationReason']:kind==='owner'?['ownerId']:kind==='priority'?['itPriority']:[])])
  const expectedVersion=integer(input.expectedVersion,'expectedVersion')
  const data: Prisma.TicketUncheckedUpdateInput = {}
  if(kind==='status') {
    if(typeof input.status!=='string'||!Object.prototype.hasOwnProperty.call(ticketEdges,input.status)) invalid('status','Invalid Ticket status')
    data.status=input.status as any
    if(input.status==='RESOLVED') data.resolutionSummary=text(input.resolutionSummary,'resolutionSummary',2000,true)
    else if('resolutionSummary' in input) invalid('resolutionSummary','Only supply when resolving')
    if(input.status==='CANCELLED') data.cancelledReason=text(input.cancellationReason,'cancellationReason',1000,true)
    else if('cancellationReason' in input) invalid('cancellationReason','Only supply when cancelling')
  }
  if(kind==='owner') data.ownerId=input.ownerId===null?null:integer(input.ownerId,'ownerId',1)
  if(kind==='priority') {
    if(input.itPriority!==null&&!['LOW','MEDIUM','HIGH'].includes(input.itPriority as string)) invalid('itPriority','Use LOW, MEDIUM, HIGH or null')
    data.itPriority=input.itPriority as any
  }
  const scope=`/tickets/${id}/${kind}`, hash=digest({expectedVersion,...data})
  return actionTransaction(async tx=>{
    const ticket=await lockTicket(tx,id)
    const ids=[...new Set([actorId,...(kind==='owner'&&typeof data.ownerId==='number'?[data.ownerId]:[]),...(input.status==='RESOLVED'&&ticket.ownerId?[ticket.ownerId]:[])])].sort((a,b)=>a-b)
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "User" WHERE "id" IN (${Prisma.join(ids)}) ORDER BY "id" FOR UPDATE`)
    const users=await tx.user.findMany({where:{id:{in:ids}}}), actor=users.find(u=>u.id===actorId)
    if(!actor?.isActive) throw new ActionError(401,'UNAUTHORIZED','Unauthorized')
    if(actor.mustChangePassword||(kind==='requester-resolved'?actor.role!=='REQUESTER':!['IT_STAFF','ADMIN'].includes(actor.role))) throw new ActionError(403,'FORBIDDEN','Role access required')
    if(kind==='requester-resolved'&&ticket.requesterId!==actorId) throw notFound()
    const previous=await replay(tx,actorId,scope,key,hash)
    if(previous) return previous
    if(kind==='requester-resolved') {
      if(!advisoryStates.includes(ticket.status)) throw new ActionError(409,'INVALID_TRANSITION','Resolution indication is unavailable in this state')
      if(ticket.requesterResolved) return {status:200,body:json(await ticketView(tx,id,actorId,actor.role))}
      data.requesterResolved=true; data.requesterResolvedAt=new Date()
    }
    if(ticket.version!==expectedVersion) throw new ActionError(409,'STALE_VERSION','Ticket changed; reload before saving',{currentVersion:ticket.version,allowedNextStatuses:ticketEdges[ticket.status]})
    if(kind==='owner'&&data.ownerId!==null) {
      const owner=users.find(u=>u.id===data.ownerId)
      if(!owner?.isActive||!['IT_STAFF','ADMIN'].includes(owner.role)) invalid('ownerId','Choose an active Staff or Administrator')
    }
    if((kind==='owner'&&ticket.ownerId===data.ownerId)||(kind==='priority'&&ticket.itPriority===data.itPriority)) invalid(kind,'No changes supplied')
    if(kind==='status') {
      if(!ticketEdges[ticket.status].includes(input.status as string)) throw new ActionError(409,'INVALID_TRANSITION','This Ticket transition is not permitted',{allowedNextStatuses:ticketEdges[ticket.status]})
      if(input.status==='RESOLVED') {
        const current=await ticketView(tx,id,actorId,actor.role)
        if(!current.resolutionGate.canResolve) throw new ActionError(409,'RESOLUTION_GATE','Finish the required work before resolving',{resolutionGate:current.resolutionGate,currentVersion:ticket.version})
        data.resolvedAt=new Date()
      }
      if(input.status==='REOPENED') Object.assign(data,{workCycle:{increment:1},requesterResolved:false,requesterResolvedAt:null,resolutionSummary:null,resolvedAt:null,cancelledReason:null})
      if(input.status==='CANCELLED') {
        const pending=await tx.actionTaken.findMany({where:{ticketId:id,workCycle:ticket.workCycle,status:{in:['PLANNED','IN_PROGRESS']}},select:publicAction,orderBy:{id:'asc'}})
        for(const action of pending) {
          const cancelled=await tx.actionTaken.update({where:{id:action.id},data:{status:'CANCELLED',cancellationReason:String(data.cancelledReason),version:{increment:1}},select:publicAction})
          await tx.actionTakenEvent.create({data:{actionId:action.id,actorId,kind:'CANCELLED_BY_TICKET',before:json(action),after:json(cancelled)}})
        }
      }
    }
    const updated=await tx.ticket.update({where:{id},data:{...data,version:{increment:1}}})
    await tx.ticketWorkflowEvent.create({data:{ticketId:id,actorId,kind:kind.toUpperCase().replace(/-/g,'_'),before:snapshot(ticket),after:snapshot(updated),workCycle:updated.workCycle}})
    const result={status:200,body:json(await ticketView(tx,id,actorId,actor.role))}
    if(key) await tx.mutationRequest.create({data:{userId:actorId,scope,key,payloadDigest:hash,responseStatus:200,response:result.body}})
    return result
  })
}
export async function readTicket(id:number,userId:number,role:string) {
  return prisma.$transaction(tx=>ticketView(tx,id,userId,role),{isolationLevel:'RepeatableRead'})
}
