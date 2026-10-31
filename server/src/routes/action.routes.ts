import { Request, Response, Router } from 'express'
import { prisma } from '../db'
import { requireAppAccess } from '../middleware/auth.middleware'
import { ActionError, invalid } from '../services/action-rules'
import { idempotencyKey, mutateAction, publicAction } from '../services/actions'

const router = Router()
type Actor = { userId: number, role: string }
const actor = (req: Request) => (req as any).user as Actor
const fail = (res: Response, error: unknown) => {
  if (error instanceof ActionError) return res.status(error.status).json({ error: error.message, code: error.code, ...error.details })
  return res.status(500).json({ error: 'Unable to process Actions Taken', code: 'INTERNAL_ERROR' })
}
const handle = (fn: (req: Request, res: Response) => Promise<unknown>) => async (req: Request, res: Response) => {
  try { await fn(req, res) } catch (error) { fail(res, error) }
}
function staff(req: Request) {
  if (!['IT_STAFF', 'ADMIN'].includes(actor(req).role)) throw new ActionError(403, 'FORBIDDEN', 'Staff access required')
}
function id(value: unknown, name: string) {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value) || Number(value) > 2147483647) invalid(name, 'Invalid positive integer ID')
  return Number(value)
}
function pagination(req: Request, allowSearch = false) {
  for (const key of Object.keys(req.query)) if (!['page', 'pageSize', ...(allowSearch ? ['search'] : [])].includes(key)) invalid(key, 'Unknown query parameter')
  const page = req.query.page === undefined ? 1 : id(req.query.page, 'page')
  const pageSize = req.query.pageSize === undefined ? 10 : id(req.query.pageSize, 'pageSize')
  if (![10, 25, 50].includes(pageSize)) invalid('pageSize', 'Use 10, 25 or 50')
  if ((page - 1) * pageSize > 2147483647) invalid('page', 'Page offset is too large')
  return { page, pageSize, skip: (page - 1) * pageSize }
}
const meta = (page: number, pageSize: number, totalItems: number) => ({ page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) })
async function readable(req: Request, db: Pick<typeof prisma, 'ticket'> = prisma) {
  const ticketId = id(req.params.ticketId, 'ticketId')
  const ticket = await db.ticket.findFirst({ where: { id: ticketId, ...(actor(req).role === 'REQUESTER' ? { requesterId: actor(req).userId } : {}) }, select: { id: true, version: true } })
  if (!ticket) throw new ActionError(404, 'NOT_FOUND', 'Resource not found')
  return ticket
}
const unsupported = handle(async (req, res) => {
  staff(req)
  res.set('Allow', req.params.actionId ? 'GET, PATCH' : 'GET, POST').status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
})
router.route('/tickets/:ticketId/actions').all(requireAppAccess)
  .get(handle(async (req, res) => {
    const { page, pageSize, skip } = pagination(req)
    const result = await prisma.$transaction(async tx => {
      const ticket = await readable(req, tx)
      const where = { ticketId: ticket.id }
      const totalItems = await tx.actionTaken.count({ where })
      const data = await tx.actionTaken.findMany({ where, select: publicAction, orderBy: [{ actionDateTime: 'asc' }, { id: 'asc' }], skip, take: pageSize })
      return { data, meta: meta(page, pageSize, totalItems), ticketVersion: ticket.version }
    }, { isolationLevel: 'RepeatableRead' })
    res.json(result)
  }))
  .post(handle(async (req, res) => {
    staff(req)
    const result = await mutateAction(id(req.params.ticketId, 'ticketId'), undefined, actor(req).userId, req.body, idempotencyKey(req.headers['idempotency-key'], true))
    res.status(result.status).json(result.body)
  })).all(unsupported)

router.route('/tickets/:ticketId/actions/:actionId/history').all(requireAppAccess)
  .get(handle(async (req, res) => {
    const { page, pageSize, skip } = pagination(req)
    const actionId = id(req.params.actionId, 'actionId')
    const result = await prisma.$transaction(async tx => {
      const ticket = await readable(req, tx)
      if (!await tx.actionTaken.findFirst({ where: { id: actionId, ticketId: ticket.id } })) throw new ActionError(404, 'NOT_FOUND', 'Resource not found')
      const where = { actionId }
      const totalItems = await tx.actionTakenEvent.count({ where })
      const data = await tx.actionTakenEvent.findMany({ where, select: { id: true, kind: true, actor: { select: { id: true, name: true } }, before: true, after: true, createdAt: true }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], skip, take: pageSize })
      return { data, meta: meta(page, pageSize, totalItems) }
    }, { isolationLevel: 'RepeatableRead' })
    res.json(result)
  })).all(handle(async (_req, res) => { res.set('Allow', 'GET').status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }) }))

router.route('/tickets/:ticketId/actions/:actionId').all(requireAppAccess)
  .get(handle(async (req, res) => {
    if (Object.keys(req.query).length) invalid('query', 'Unknown query parameter')
    const actionId = id(req.params.actionId, 'actionId')
    const result = await prisma.$transaction(async tx => {
      const ticket = await readable(req, tx)
      const data = await tx.actionTaken.findFirst({ where: { id: actionId, ticketId: ticket.id }, select: publicAction })
      if (!data) throw new ActionError(404, 'NOT_FOUND', 'Resource not found')
      return { data, ticketVersion: ticket.version }
    }, { isolationLevel: 'RepeatableRead' })
    res.json(result)
  }))
  .patch(handle(async (req, res) => {
    staff(req)
    const result = await mutateAction(id(req.params.ticketId, 'ticketId'), id(req.params.actionId, 'actionId'), actor(req).userId, req.body, idempotencyKey(req.headers['idempotency-key'], false))
    res.status(result.status).json(result.body)
  })).all(unsupported)

router.route('/staff/action-assignees').all(requireAppAccess)
  .get(handle(async (req, res) => {
    staff(req)
    const { page, pageSize, skip } = pagination(req, true)
    if (req.query.search !== undefined && (typeof req.query.search !== 'string' || req.query.search.trim().length > 100)) invalid('search', 'Use at most 100 characters')
    const where = { isActive: true, role: { in: ['IT_STAFF', 'ADMIN'] as ('IT_STAFF' | 'ADMIN')[] }, ...(req.query.search ? { name: { contains: String(req.query.search).trim(), mode: 'insensitive' as const } } : {}) }
    const result = await prisma.$transaction(async tx => {
      const totalItems = await tx.user.count({ where })
      const data = await tx.user.findMany({ where, select: { id: true, name: true, role: true }, orderBy: [{ name: 'asc' }, { id: 'asc' }], skip, take: pageSize })
      return { data, meta: meta(page, pageSize, totalItems) }
    }, { isolationLevel: 'RepeatableRead' })
    res.json(result)
  }))
export default router
