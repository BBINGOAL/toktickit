import { Router, type Request, type Response, type NextFunction } from 'express'
import { requireAppAccess } from '../middleware/auth.middleware'
import { DashboardQueryError } from '../services/dashboard-rules'
import { requesterDashboard, requesterTickets } from '../services/requester-dashboard'
import { staffDashboard, staffTickets, staffActions } from '../services/staff-dashboard'

const router = Router()
type Actor = { userId: number; role: string }
const actor = (req: Request) => (req as any).user as Actor
function role(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(actor(req).role)) return res.status(403).json({ error: 'Role access required' })
    next()
  }
}
const safe = (message: string, fn: (req: Request) => Promise<unknown>) => async (req: Request, res: Response) => {
  try { res.json(await fn(req)) } catch (error) {
    res.status(error instanceof DashboardQueryError ? 400 : 500).json({ error: error instanceof DashboardQueryError ? error.message : message })
  }
}
function noQuery(req: Request) {
  if (Object.keys(req.query).length) throw new DashboardQueryError('Dashboard does not accept query parameters')
}
const requester = role(['REQUESTER']), staff = role(['IT_STAFF','ADMIN'])
router.get('/dashboards/requester', requireAppAccess, requester, safe('Unable to load Requester dashboard', async req => {
  noQuery(req); return requesterDashboard(actor(req).userId)
}))
router.get('/tickets', requireAppAccess, requester, safe('Failed to fetch tickets', req => requesterTickets(actor(req).userId, req.query)))
router.get('/dashboards/staff', requireAppAccess, staff, safe('Unable to load Staff dashboard', async req => {
  noQuery(req); return staffDashboard(actor(req).userId)
}))
router.get('/staff/tickets', requireAppAccess, staff, safe('Failed to fetch staff tickets', req => staffTickets(actor(req).userId, req.query)))
router.get('/staff/actions', requireAppAccess, staff, safe('Unable to load My Actions', req => staffActions(actor(req).userId, req.query)))
router.all(['/dashboards/requester','/dashboards/staff','/staff/actions'], requireAppAccess, (_req, res) => res.set('Allow','GET').status(405).json({ error: 'Method not allowed' }))
export default router
