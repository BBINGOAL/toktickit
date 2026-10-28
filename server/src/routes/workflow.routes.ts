import { Router, Request, Response } from 'express'
import { requireAppAccess } from '../middleware/auth.middleware'
import { prisma } from '../db'
import { ActionError, invalid } from '../services/action-rules'
import { idempotencyKey } from '../services/actions'
import { mutateWorkflow, readTicket } from '../services/workflow'
const router=Router()
const actor=(req:Request)=>(req as any).user as {userId:number;role:string}
function id(value:unknown,field='id') {
  if(typeof value!=='string'||!/^[1-9]\d*$/.test(value)||Number(value)>2147483647) invalid(field,'Invalid positive ID')
  return Number(value)
}
const handle=(fn:(req:Request,res:Response)=>Promise<unknown>)=>async(req:Request,res:Response)=>{
  try{await fn(req,res)}catch(e){if(e instanceof ActionError)res.status(e.status).json({error:e.message,code:e.code,...e.details});else res.status(500).json({error:'Unable to process Ticket workflow',code:'INTERNAL_ERROR'})}
}
router.get('/tickets/:id',requireAppAccess,handle(async(req,res)=>res.json(await readTicket(id(req.params.id),actor(req).userId,actor(req).role))))
for(const kind of ['status','owner','priority','requester-resolved'] as const) {
  const method=kind==='requester-resolved'?'post':'patch'
  router.route(`/tickets/:id/${kind}`).all(requireAppAccess)[method](handle(async(req,res)=>{
    const user=actor(req)
    if(kind==='requester-resolved'?user.role!=='REQUESTER':!['IT_STAFF','ADMIN'].includes(user.role))throw new ActionError(403,'FORBIDDEN','Role access required')
    const result=await mutateWorkflow(id(req.params.id),kind,user.userId,req.body,idempotencyKey(req.headers['idempotency-key'],kind==='status'))
    res.status(result.status).json(result.body)
  })).all((_req,res)=>{res.set('Allow',method.toUpperCase()).status(405).json({error:'Method not allowed',code:'METHOD_NOT_ALLOWED'})})
}
router.route('/tickets/:id/workflow-history').all(requireAppAccess).get(handle(async(req,res)=>{
  for(const key of Object.keys(req.query))if(!['page','pageSize'].includes(key))invalid(key,'Unknown query parameter')
  const page=req.query.page===undefined?1:id(req.query.page,'page'),pageSize=req.query.pageSize===undefined?10:id(req.query.pageSize,'pageSize')
  if(![10,25,50].includes(pageSize)||(page-1)*pageSize>2147483647)invalid('pageSize','Invalid pagination')
  const result=await prisma.$transaction(async tx=>{
    const user=actor(req),ticketId=id(req.params.id)
    const ticket=await tx.ticket.findFirst({where:{id:ticketId,...(user.role==='REQUESTER'?{requesterId:user.userId}:{})},select:{id:true}})
    if(!ticket)throw new ActionError(404,'NOT_FOUND','Resource not found')
    const totalItems=await tx.ticketWorkflowEvent.count({where:{ticketId}})
    const data=await tx.ticketWorkflowEvent.findMany({where:{ticketId},select:{id:true,kind:true,actor:{select:{id:true,name:true}},before:true,after:true,workCycle:true,createdAt:true},orderBy:[{createdAt:'asc'},{id:'asc'}],skip:(page-1)*pageSize,take:pageSize})
    return {data,meta:{page,pageSize,totalItems,totalPages:Math.ceil(totalItems/pageSize)}}
  },{isolationLevel:'RepeatableRead'})
  res.json(result)
})).all((_req,res)=>{res.set('Allow','GET').status(405).json({error:'Method not allowed',code:'METHOD_NOT_ALLOWED'})})
export default router
