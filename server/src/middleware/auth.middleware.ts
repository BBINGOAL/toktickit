import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // ดึง Token จาก Cookie
  const token = req.cookies?.token; 
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const payload = verifyToken(token);
    (req as any).user = payload; // แนบข้อมูล user เข้าไปใน Request
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
