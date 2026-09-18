import { Router } from 'express';
import { login, logout, changePassword } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.post('/login', login);
router.post('/logout', logout);
router.post('/change-password', requireAuth, changePassword);

export default router;
