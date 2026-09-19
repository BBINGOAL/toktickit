import { Request, Response } from 'express';
import { prisma } from '../db';
import { comparePassword, generateToken, hashPassword } from '../utils/auth';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive || !comparePassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials or inactive account' });
  }

  const token = generateToken(user.id, user.role);
  
  // Set HttpOnly Cookie (ป้องกัน XSS)
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  });

  res.json({ id: user.id, name: user.name, role: user.role, mustChangePassword: user.mustChangePassword });
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
  res.json({ message: 'Logged out' });
};

export const me = async (req: Request, res: Response) => {
  const userReq = (req as any).user
  const user = await prisma.user.findUnique({ where: { id: userReq.userId } })
  if (!user || !user.isActive) return res.status(401).json({ error: 'Unauthorized' })
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, mustChangePassword: user.mustChangePassword })
}

export const changePassword = async (req: Request, res: Response) => {
  const { newPassword, confirmPassword } = req.body;
  const userReq = (req as any).user;
  
  if (!userReq) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }
  if (newPassword !== confirmPassword) return res.status(400).json({ error: 'Passwords do not match' })

  const hashedPassword = await hashPassword(newPassword);
  
  await prisma.user.update({
    where: { id: userReq.userId },
    data: { 
      passwordHash: hashedPassword,
      mustChangePassword: false
    }
  });

  res.json({ message: 'Password changed successfully' });
};
