import { Router } from 'express'
import { requireAppAccess } from '../middleware/auth.middleware'
import { DashboardQueryError } from '../services/dashboard-rules'
import { requesterDashboard, requesterTickets } from '../services/requester-dashboard'

const router = Router()
router.get(['/dashboards/requester', '/tickets'], requireAppAccess, async (req, res) => {
  const actor = (req as any).user
  if (actor.role !== 'REQUESTER') return res.status(403).json({ error: 'Requester access required' })
  const dashboard = req.path === '/dashboards/requester'
  try {
    if (dashboard && Object.keys(req.query).length) return res.status(400).json({ error: 'Dashboard does not accept query parameters' })
    return res.json(dashboard ? await requesterDashboard(actor.userId) : await requesterTickets(actor.userId, req.query))
  } catch (error) {
    return res.status(error instanceof DashboardQueryError ? 400 : 500).json({ error: error instanceof DashboardQueryError ? error.message : dashboard ? 'Unable to load Requester dashboard' : 'Failed to fetch tickets' })
  }
})
router.all('/dashboards/requester', requireAppAccess, (_req, res) => res.status(405).json({ error: 'Method not allowed' }))
export default router
