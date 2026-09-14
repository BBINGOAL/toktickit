import { Request, Response } from 'express';
import { prisma } from '../app';
import { comparePassword, generateToken } from '../utils/auth';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
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
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
};
