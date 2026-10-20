import { beforeEach,afterEach,describe,it,expect,vi } from 'vitest'
import request from 'supertest'
import app from '../../src/app'
import { prisma } from '../../src/db'
import { fixture } from './fixtures'
import { ticketEdges } from '../../src/services/workflow-rules'
let f:Awaited<ReturnType<typeof fixture>>
const key=()=>crypto.randomUUID()
const path=(kind='status')=>`/api/tickets/${f.ticket.id}/${kind}`
const patch=(kind:string,body:object,user?:typeof f.staff,k=key())=>request(app).patch(path(kind)).set('Cookie',f.cookie(user)).set('Idempotency-Key',k).send(body)
async function prepare(status:'IN_PROGRESS'|'RESOLVED'|'OPEN'='IN_PROGRESS') {
  await prisma.ticket.update({where:{id:f.ticket.id},data:{status,ownerId:f.staff.id}})
  return prisma.actionTaken.create({data:{ticketId:f.ticket.id,workCycle:1,actionDateTime:f.ticket.createdAt,description:'Verified diagnostic',result:'Working',performedById:f.staff.id,assigneeId:f.staff.id,status:'COMPLETED'}})
}
beforeEach(async()=>{f=await fixture()})
afterEach(async()=>{vi.restoreAllMocks();await f?.cleanup()})
describe('versioned Ticket workflow',()=>{
  it.each(['staff','admin','requester'] as const)('enforces all 64 Ticket edges for %s',async role=>{
    await prepare()
    for(const from of Object.keys(ticketEdges))for(const to of Object.keys(ticketEdges)){
      await prisma.ticket.update({where:{id:f.ticket.id},data:{status:from as any,version:0,workCycle:1}})
      const r=await patch('status',{status:to,expectedVersion:0,...(to==='RESOLVED'?{resolutionSummary:'Connection verified'}:{}),...(to==='CANCELLED'?{cancellationReason:'No longer required'}:{})},f[role])
      expect(r.status,`${role} ${from}->${to}`).toBe(role==='requester'?403:ticketEdges[from].includes(to)?200:409)
    }
  })
  it('rejects unversioned/status-keyless/unknown/unrelated and invalid inputs without writing',async()=>{
    for(const body of [{status:'IN_PROGRESS'},{status:'IN_PROGRESS',expectedVersion:-1},{status:'IN_PROGRESS',expectedVersion:0,resolutionSummary:'Spoof'},{status:'IN_PROGRESS',expectedVersion:0,actorId:9}])expect((await patch('status',body)).status).toBe(400)
    expect((await request(app).patch(path()).set('Cookie',f.cookie()).send({status:'IN_PROGRESS',expectedVersion:0})).status).toBe(400)
    expect(await prisma.ticketWorkflowEvent.count({where:{ticketId:f.ticket.id}})).toBe(0)
  })
  it('requires owner, completed result, no unfinished work and no unresolved follow-up',async()=>{
    await prisma.ticket.update({where:{id:f.ticket.id},data:{status:'IN_PROGRESS'}})
    const resolve=()=>patch('status',{status:'RESOLVED',expectedVersion:0,resolutionSummary:'Verified'})
    expect((await resolve()).body.code).toBe('RESOLUTION_GATE')
    const a=await prepare()
    await prisma.actionTaken.update({where:{id:a.id},data:{followUpRequired:true,followUpNote:'Check campus network'}})
    expect((await resolve()).body.code).toBe('RESOLUTION_GATE')
    const successor=await prisma.actionTaken.create({data:{ticketId:f.ticket.id,workCycle:1,actionDateTime:f.ticket.createdAt,description:'Follow-up',result:'Verified',status:'PLANNED',performedById:f.staff.id,assigneeId:f.staff.id,followsUpActionId:a.id}})
    expect((await resolve()).status).toBe(409)
    await prisma.actionTaken.update({where:{id:successor.id},data:{status:'COMPLETED'}})
    expect((await resolve()).status).toBe(200)
  })
  it('rejects inactive owner even with completed work',async()=>{
    await prepare();await prisma.user.update({where:{id:f.staff.id},data:{isActive:false}})
    expect((await patch('status',{status:'RESOLVED',expectedVersion:0,resolutionSummary:'Verified'},f.admin)).body.code).toBe('RESOLUTION_GATE')
  })
  it('resolves, closes and reopens into a fresh cycle without qualifying old work',async()=>{
    await prepare()
    const r=await patch('status',{status:'RESOLVED',expectedVersion:0,resolutionSummary:' Repaired VPN '})
    expect(r.body).toMatchObject({status:'RESOLVED',version:1,resolutionSummary:'Repaired VPN'})
    expect(r.body.resolvedAt).toBeTruthy()
    const c=await patch('status',{status:'CLOSED',expectedVersion:1});expect(c.body.resolvedAt).toBe(r.body.resolvedAt)
    await prisma.ticket.update({where:{id:f.ticket.id},data:{requesterResolved:true,requesterResolvedAt:new Date()}})
    const reopen=await patch('status',{status:'REOPENED',expectedVersion:2})
    expect(reopen.body).toMatchObject({workCycle:2,requesterResolved:false,requesterResolvedAt:null,resolutionSummary:null,resolvedAt:null})
    await patch('status',{status:'IN_PROGRESS',expectedVersion:3})
    expect((await patch('status',{status:'RESOLVED',expectedVersion:4,resolutionSummary:'Old work only'})).body.code).toBe('RESOLUTION_GATE')
  })
  it('cancels unfinished work atomically but keeps completed work/history',async()=>{
    const completed=await prepare()
    const pending=await prisma.actionTaken.create({data:{ticketId:f.ticket.id,workCycle:1,actionDateTime:f.ticket.createdAt,description:'Pending',performedById:f.colleague.id,assigneeId:f.colleague.id}})
    expect((await patch('status',{status:'CANCELLED',expectedVersion:0,cancellationReason:' Duplicate request '})).status).toBe(200)
    expect(await prisma.actionTaken.findUnique({where:{id:completed.id}})).toMatchObject({status:'COMPLETED',version:0})
    expect(await prisma.actionTaken.findUnique({where:{id:pending.id}})).toMatchObject({status:'CANCELLED',version:1,cancellationReason:'Duplicate request'})
    expect(await prisma.actionTakenEvent.count({where:{actionId:pending.id}})).toBe(1)
    expect((await request(app).post(`/api/tickets/${f.ticket.id}/actions`).set('Cookie',f.cookie()).set('Idempotency-Key',key()).send(f.body({expectedTicketVersion:1}))).status).toBe(409)
  })
  it('replays the exact successful response and rejects changed payload without extra events',async()=>{
    const k=key(),body={status:'IN_PROGRESS',expectedVersion:0}
    const a=await patch('status',body,f.staff,k),b=await patch('status',body,f.staff,k)
    expect(a.status).toBe(200);expect(b.body).toEqual(a.body)
    expect((await patch('status',{status:'WAITING_FOR_REQUESTER',expectedVersion:1},f.staff,k)).body.code).toBe('IDEMPOTENCY_CONFLICT')
    expect(await prisma.ticketWorkflowEvent.count({where:{ticketId:f.ticket.id}})).toBe(1)
  })
  it('has one winner for same-version mutations and simultaneous identical retry',async()=>{
    const responses=await Promise.all([patch('status',{status:'IN_PROGRESS',expectedVersion:0}),patch('status',{status:'WAITING_FOR_REQUESTER',expectedVersion:0})])
    expect(responses.map(r=>r.status).sort()).toEqual([200,409])
    await prisma.ticket.update({where:{id:f.ticket.id},data:{status:'OPEN',version:0}})
    const k=key(),body={status:'IN_PROGRESS',expectedVersion:0}
    const retry=await Promise.all([patch('status',body,f.staff,k),patch('status',body,f.staff,k)])
    expect(retry.map(r=>r.status)).toEqual([200,200]);expect(retry[0].body).toEqual(retry[1].body)
  })
  it('serializes action creation versus resolution under the same parent lock',async()=>{
    await prepare()
    const r=await Promise.all([patch('status',{status:'RESOLVED',expectedVersion:0,resolutionSummary:'Verified'}),request(app).post(`/api/tickets/${f.ticket.id}/actions`).set('Cookie',f.cookie()).set('Idempotency-Key',key()).send(f.body())])
    expect(r.map(x=>x.status).sort()).toEqual(r[0].status===200?[200,409]:[201,409])
    const ticket=await prisma.ticket.findUniqueOrThrow({where:{id:f.ticket.id}})
    expect(ticket.version).toBe(1)
    if(ticket.status==='RESOLVED')expect(await prisma.actionTaken.count({where:{ticketId:f.ticket.id,status:'PLANNED'}})).toBe(0)
  })
  it('versions owner and nullable priority changes, rejects stale/no-op/invalid owner',async()=>{
    expect((await patch('owner',{ownerId:f.staff.id,expectedVersion:0})).body.version).toBe(1)
    expect((await patch('priority',{itPriority:null,expectedVersion:0})).body.code).toBe('STALE_VERSION')
    expect((await patch('priority',{itPriority:null,expectedVersion:1})).body).toMatchObject({version:2,itPriority:null})
    expect((await patch('owner',{ownerId:f.requester.id,expectedVersion:2})).status).toBe(400)
    expect((await patch('priority',{itPriority:null,expectedVersion:2})).status).toBe(400)
  })
  it('Requester indication is advisory and repeat preserves timestamp/version/event count',async()=>{
    const p=()=>request(app).post(path('requester-resolved')).set('Cookie',f.cookie(f.requester)).send({expectedVersion:0})
    const a=await p(),b=await p()
    expect(a.body).toMatchObject({status:'OPEN',requesterResolved:true,version:1,allowedNextStatuses:[]})
    expect(b.body.requesterResolvedAt).toBe(a.body.requesterResolvedAt);expect(b.body.version).toBe(1)
    expect(await prisma.ticketWorkflowEvent.count({where:{ticketId:f.ticket.id}})).toBe(1)
  })
  it('does not leak non-owned/missing tickets or history; role denial is independent of IDs',async()=>{
    for(const suffix of ['', '/workflow-history']){
      const a=await request(app).get(`/api/tickets/${f.ticket.id}${suffix}`).set('Cookie',f.cookie(f.other))
      const b=await request(app).get(`/api/tickets/2147483647${suffix}`).set('Cookie',f.cookie(f.other))
      expect(a.status).toBe(404);expect(a.body).toEqual(b.body)
    }
    expect((await request(app).patch('/api/tickets/2147483647/status').set('Cookie',f.cookie(f.requester)).send({})).status).toBe(403)
    expect((await request(app).get(`/api/tickets/${f.ticket.id}`)).status).toBe(401)
  })
  it('returns stable paginated public history with actor and no private information',async()=>{
    await patch('status',{status:'IN_PROGRESS',expectedVersion:0})
    await prisma.internalNote.create({data:{ticketId:f.ticket.id,authorId:f.staff.id,content:'PRIVATE_SENTINEL'}})
    const r=await request(app).get(path('workflow-history')).set('Cookie',f.cookie(f.requester))
    expect(r.body.data[0]).toMatchObject({kind:'STATUS',actor:{name:f.staff.name},workCycle:1})
    expect(JSON.stringify(r.body)).not.toMatch(/PRIVATE_SENTINEL|passwordHash|email/)
    expect((await request(app).get(path('workflow-history')+'?pageSize=7').set('Cookie',f.cookie())).status).toBe(400)
    expect((await request(app).delete(path('workflow-history')).set('Cookie',f.cookie())).status).toBe(405)
  })
  it('rolls back state and action cancellation when workflow event insertion fails',async()=>{
    await prepare()
    const pending=await prisma.actionTaken.create({data:{ticketId:f.ticket.id,workCycle:1,actionDateTime:f.ticket.createdAt,description:'Must survive failed cancellation',performedById:f.staff.id,assigneeId:f.staff.id}})
    const original=prisma.$transaction.bind(prisma)
    vi.spyOn(prisma,'$transaction').mockImplementationOnce(((callback:any,options:any)=>original(async(tx:any)=>callback(new Proxy(tx,{get(target,prop){return prop==='ticketWorkflowEvent'?{...target.ticketWorkflowEvent,create:()=>{throw Error('injected SQL passwordHash')}}:target[prop]}})),options)) as any)
    const r=await patch('status',{status:'CANCELLED',expectedVersion:0,cancellationReason:'test rollback'})
    expect(r.status).toBe(500);expect(JSON.stringify(r.body)).not.toContain('passwordHash')
    expect(await prisma.ticket.findUnique({where:{id:f.ticket.id}})).toMatchObject({status:'IN_PROGRESS',version:0})
    expect(await prisma.ticketWorkflowEvent.count({where:{ticketId:f.ticket.id}})).toBe(0)
    expect(await prisma.actionTaken.findUnique({where:{id:pending.id}})).toMatchObject({status:'PLANNED',version:0})
    expect(await prisma.actionTakenEvent.count({where:{actionId:pending.id}})).toBe(0)
  })
})
