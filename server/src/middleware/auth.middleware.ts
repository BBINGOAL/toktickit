import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import { prisma } from '../db';

type AuthenticatedUser = {
  userId: number
  role: string
  isActive: boolean
  mustChangePassword: boolean
}

async function authenticate(req: Request, res: Response, next: NextFunction, allowPasswordChange: boolean) {
  const token = req.cookies?.token
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const payload = verifyToken(token)
    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user || !user.isActive) return res.status(401).json({ error: 'Unauthorized' })
    if (!allowPasswordChange && user.mustChangePassword) {
      return res.status(403).json({ error: 'Password change required' })
    }
    const authenticated: AuthenticatedUser = {
      userId: user.id,
      role: user.role,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
    }
    ;(req as any).user = authenticated
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) =>
  void authenticate(req, res, next, true)

export const requireAppAccess = (req: Request, res: Response, next: NextFunction) =>
  void authenticate(req, res, next, false)
