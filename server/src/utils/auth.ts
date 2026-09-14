import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// ในชีวิตจริงควรดึงจาก .env 
const JWT_SECRET = process.env.JWT_SECRET || 'toktickit-super-secret-key'; 

export const hashPassword = (password: string) => bcrypt.hashSync(password, 10);
export const comparePassword = (password: string, hash: string) => bcrypt.compareSync(password, hash);

export const generateToken = (userId: number, role: string) => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '1d' });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET) as { userId: number, role: string };
};
