import { Router, Request, Response } from 'express'
import { prisma } from '../db'
import { requireAppAccess } from '../middleware/auth.middleware'
import bcrypt from 'bcryptjs'

const router = Router()
const VALID_ROLES = new Set(['REQUESTER', 'IT_STAFF', 'ADMIN'])

// Middleware to ensure user is an ADMIN
const requireAdmin = (req: Request, res: Response, next: Function) => {
    const userRole = (req as any).user?.role;
    if (userRole !== 'ADMIN') {
        res.status(403).json({ error: 'Access denied. Administrator role required.' });
        return;
    }
    next();
};

// ─── Fetch All Users (with search & filter) ────────────────
router.get('/admin/users', requireAppAccess, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { search, role } = req.query;
        let where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: String(search), mode: 'insensitive' } },
                { email: { contains: String(search), mode: 'insensitive' } }
            ];
        }

        if (role && !VALID_ROLES.has(String(role))) {
            res.status(400).json({ error: 'Invalid role.' });
            return;
        }
        if (role) {
            where.role = String(role);
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                mustChangePassword: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: { id: 'desc' }
        });

        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
});

// ─── Create New User ─────────────────────────────────────────
router.post('/admin/users', requireAppAccess, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { name, email, role, initialPassword } = req.body;

        if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !email.trim() || !role || typeof initialPassword !== 'string' || initialPassword.length < 6) {
            res.status(400).json({ error: 'All fields are required.' });
            return;
        }
        if (!VALID_ROLES.has(role)) {
            res.status(400).json({ error: 'Invalid role.' });
            return;
        }

        // Check for duplicate email
        const normalizedEmail = email.trim().toLowerCase()
        const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existing) {
            res.status(409).json({ error: 'Email already exists.' });
            return;
        }

        const passwordHash = await bcrypt.hash(initialPassword, 10);

        const newUser = await prisma.user.create({
            data: {
                name: name.trim(),
                email: normalizedEmail,
                role,
                passwordHash,
                mustChangePassword: true,
                isActive: true
            },
            select: { id: true, name: true, email: true, role: true, isActive: true }
        });

        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create user.' });
    }
});

// ─── Update User Details ──────────────────────────────────────
const updateUser = async (req: Request, res: Response) => {
    try {
        const userIdToUpdate = Number.parseInt(String(req.params.id), 10);
        const { name, email, role, isActive } = req.body;
        const currentUserId = (req as any).user.userId;

        if (!Number.isInteger(userIdToUpdate) || typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !email.trim() || typeof isActive !== 'boolean' || !role || !VALID_ROLES.has(role)) {
            res.status(400).json({ error: 'Invalid user data.' });
            return;
        }

        // Validation for duplicate email
        const normalizedEmail = email.trim().toLowerCase()
        if (normalizedEmail) {
            const existing = await prisma.user.findFirst({
                where: { email: normalizedEmail, id: { not: userIdToUpdate } }
            });
            if (existing) {
                res.status(409).json({ error: 'Email already exists.' });
                return;
            }
        }

        // Safety Rule 1: Cannot deactivate yourself
        if (isActive === false && userIdToUpdate === currentUserId) {
            res.status(400).json({ error: 'You cannot deactivate your own account.' });
            return;
        }

        // Safety Rule 2: Cannot remove the last active Admin
        if (role && role !== 'ADMIN' || isActive === false) {
            const targetUser = await prisma.user.findUnique({ where: { id: userIdToUpdate } });
            if (targetUser?.role === 'ADMIN' && targetUser?.isActive === true) {
                const activeAdminsCount = await prisma.user.count({
                    where: { role: 'ADMIN', isActive: true, id: { not: userIdToUpdate } }
                });
                if (activeAdminsCount === 0) {
                    res.status(400).json({ error: 'Cannot remove or deactivate the last active Administrator.' });
                    return;
                }
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: userIdToUpdate },
            data: { name: name.trim(), email: normalizedEmail, role, isActive },
            select: { id: true, name: true, email: true, role: true, isActive: true }
        });

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user.' });
    }
};

router.patch('/admin/users/:id', requireAppAccess, requireAdmin, updateUser)
router.put('/admin/users/:id', requireAppAccess, requireAdmin, updateUser)

// ─── Reset Initial Password ──────────────────────────────────
router.post('/admin/users/:id/reset-password', requireAppAccess, requireAdmin, async (req: Request, res: Response) => {
    try {
        const userIdToUpdate = parseInt(String(req.params.id), 10);
        const { newInitialPassword } = req.body;

        if (typeof newInitialPassword !== 'string' || newInitialPassword.length < 6) {
            res.status(400).json({ error: 'New initial password is required.' });
            return;
        }

        const passwordHash = await bcrypt.hash(newInitialPassword, 10);

        await prisma.user.update({
            where: { id: userIdToUpdate },
            data: {
                passwordHash,
                mustChangePassword: true // Force password change on next login
            }
        });

        res.status(200).json({ message: 'Password reset successfully. User must change password on next login.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to reset password.' });
    }
});

export default router;
