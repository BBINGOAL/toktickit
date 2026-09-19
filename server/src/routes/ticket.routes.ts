import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../app';
import { upload } from '../app';
import { requireAppAccess } from '../middleware/auth.middleware';
import fs from 'fs';
import path from 'path';

const router = Router();
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
const VALID_PRIORITIES = new Set(['LOW', 'MEDIUM', 'HIGH']);
const VALID_STATUSES = new Set(['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'RESOLVED', 'CLOSED', 'REOPENED', 'CANCELLED']);
const STATUS_TRANSITIONS: Record<string, Set<string>> = {
    NEW: new Set(['OPEN', 'CANCELLED']),
    OPEN: new Set(['IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'CANCELLED']),
    IN_PROGRESS: new Set(['WAITING_FOR_REQUESTER', 'RESOLVED', 'CANCELLED']),
    WAITING_FOR_REQUESTER: new Set(['IN_PROGRESS', 'RESOLVED', 'CANCELLED']),
    RESOLVED: new Set(['CLOSED', 'REOPENED']),
    CLOSED: new Set(['REOPENED']),
    REOPENED: new Set(['IN_PROGRESS', 'CANCELLED']),
    CANCELLED: new Set(['REOPENED']),
};

async function getAccessibleTicket(req: Request, res: Response) {
    const id = Number.parseInt(String(req.params.id), 10)
    if (!Number.isInteger(id)) {
        res.status(400).json({ error: 'Invalid ticket id' })
        return null
    }
    const ticket = await prisma.ticket.findUnique({ where: { id }, select: { id: true, requesterId: true } })
    if (!ticket) {
        res.status(404).json({ error: 'Ticket not found' })
        return null
    }
    const user = (req as any).user
    if (user.role === 'REQUESTER' && ticket.requesterId !== user.userId) {
        res.status(403).json({ error: 'Access denied' })
        return null
    }
    return ticket
}

function validContent(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 5000
}

async function generateTicketNumber(tx: any) {
    const date = new Date()
    const prefix = `TKT-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`
    const latestTicket = await tx.ticket.findFirst({
        where: { ticketNumber: { startsWith: prefix } },
        orderBy: { ticketNumber: 'desc' },
    })
    if (!latestTicket) return `${prefix}-001`
    const lastSeq = parseInt(latestTicket.ticketNumber.split('-')[2])
    const nextSeq = (lastSeq + 1).toString().padStart(3, '0')
    return `${prefix}-${nextSeq}`
}

// ─── Create Ticket ─────────────────────────────────────────
router.post('/tickets', requireAppAccess, async (req: Request, res: Response) => {
    const requesterId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    if (userRole !== 'REQUESTER') {
        res.status(403).json({ error: 'Only requesters can create tickets' }); return;
    }
    const { categoryId, relatedSystemId, summary, description, requestedPriority } = req.body;
    if (!categoryId || !relatedSystemId || typeof summary !== 'string' || !summary.trim() || typeof description !== 'string' || !description.trim() || !VALID_PRIORITIES.has(requestedPriority)) {
        res.status(400).json({ error: 'Missing required fields' }); return;
    }
    try {
        const ticket = await prisma.$transaction(async (tx) => {
            const ticketNumber = await generateTicketNumber(tx)
            return tx.ticket.create({
                data: { ticketNumber, requesterId, categoryId, relatedSystemId, summary: summary.trim(), description: description.trim(), requestedPriority, itPriority: requestedPriority },
            })
        })
        res.status(201).json(ticket)
    } catch {
        res.status(500).json({ error: 'Failed to create ticket' })
    }
});

// ─── List Tickets (Requester) ─────────────────────────────
router.get('/tickets', requireAppAccess, async (req: Request, res: Response) => {
    const requesterId = (req as any).user.userId;
    if ((req as any).user.role !== 'REQUESTER') return res.status(403).json({ error: 'Requester access required' })
    const search = (req.query.search as string) || ''
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined
    const requestedPriority = req.query.requestedPriority as string | undefined
    const itPriority = req.query.itPriority as string | undefined
    const status = req.query.status as string | undefined
    const sortField = (req.query.sort as string) || 'createdAt'
    const order = (req.query.order as string) || 'desc'
    const page = parseInt((req.query.page as string) || '1')
    const pageSize = parseInt((req.query.pageSize as string) || '10')

    try {
        const where: Record<string, unknown> = { requesterId }
        if (categoryId) where.categoryId = categoryId
        if (requestedPriority) where.requestedPriority = requestedPriority
        if (itPriority) where.itPriority = itPriority
        if (status) where.status = status
        if (search) {
            where.OR = [
                { ticketNumber: { contains: search, mode: 'insensitive' } },
                { summary: { contains: search, mode: 'insensitive' } },
            ]
        }
        const [totalItems, data] = await Promise.all([
            prisma.ticket.count({ where }),
            prisma.ticket.findMany({
                where,
                select: {
                    id: true, ticketNumber: true, summary: true,
                    category: { select: { id: true, name: true } },
                    relatedSystem: { select: { id: true, name: true } },
                    requestedPriority: true, itPriority: true,
                    status: true, owner: { select: { id: true, name: true } },
                    createdAt: true, updatedAt: true,
                },
                orderBy: { [sortField]: order as 'asc' | 'desc' },
                skip: (page - 1) * pageSize, take: pageSize,
            }),
        ])
        res.status(200).json({ data, meta: { totalItems, page, pageSize, totalPages: Math.ceil(totalItems / pageSize) } })
    } catch {
        res.status(500).json({ error: 'Failed to fetch tickets' })
    }
});

// ─── List Tickets (IT Staff Queue) ────────────────────────
router.get('/staff/tickets', requireAppAccess, async (req: Request, res: Response) => {
    const userRole = (req as any).user.role;
    if (userRole !== 'IT_STAFF' && userRole !== 'ADMIN') {
        res.status(403).json({ error: 'Access denied' }); return;
    }
    const search = (req.query.search as string) || ''
    const status = req.query.status as string | undefined
    const priority = req.query.priority as string | undefined
    const categoryId = req.query.categoryId ? Number.parseInt(req.query.categoryId as string, 10) : undefined
    const sort = (req.query.sort as string) || 'createdAt'
    const order = (req.query.order as string) || 'desc'
    const ownerId = req.query.ownerId ? parseInt(req.query.ownerId as string) : undefined
    const page = parseInt((req.query.page as string) || '1')
    const pageSize = parseInt((req.query.pageSize as string) || '10')

    try {
        if (status && !VALID_STATUSES.has(status)) return res.status(400).json({ error: 'Invalid status' })
        if (priority && !VALID_PRIORITIES.has(priority)) return res.status(400).json({ error: 'Invalid priority' })
        if (categoryId !== undefined && !Number.isInteger(categoryId)) return res.status(400).json({ error: 'Invalid categoryId' })
        if (!['createdAt', 'updatedAt', 'summary', 'status', 'itPriority'].includes(sort) || !['asc', 'desc'].includes(order)) return res.status(400).json({ error: 'Invalid sorting' })
        const where: any = {}
        if (status) where.status = status
        if (priority) where.itPriority = priority
        if (ownerId) where.ownerId = ownerId
        if (categoryId) where.categoryId = categoryId
        if (search) {
            where.OR = [
                { ticketNumber: { contains: search, mode: 'insensitive' } },
                { summary: { contains: search, mode: 'insensitive' } },
            ]
        }
        const [totalItems, data] = await Promise.all([
            prisma.ticket.count({ where }),
            prisma.ticket.findMany({
                where,
                include: {
                    category: true,
                    relatedSystem: true,
                    requester: { select: { id: true, name: true } },
                    owner: { select: { id: true, name: true } }
                },
                orderBy: { [sort]: order },
                skip: (page - 1) * pageSize, take: pageSize,
            }),
        ])
        res.status(200).json({ data, meta: { totalItems, page, pageSize, totalPages: Math.ceil(totalItems / pageSize) } })
    } catch {
        res.status(500).json({ error: 'Failed to fetch staff tickets' })
    }
});

// ─── Get Single Ticket ────────────────────────────────────
router.get('/tickets/:id', requireAppAccess, async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    try {
        const ticket = await prisma.ticket.findUnique({
                where: { id: parseInt(String(req.params.id), 10) },
            include: {
                requester: { select: { id: true, name: true } },
                category: { select: { id: true, name: true } },
                relatedSystem: { select: { id: true, name: true } },
                owner: { select: { id: true, name: true } },
                attachments: {
                    where: { isRemoved: false },
                    select: { id: true, originalFilename: true, mimeType: true, sizeBytes: true, isRemoved: true, createdAt: true },
                },
            },
        })
        if (!ticket) { res.status(404).json({ error: 'Ticket not found' }); return; }
        if (ticket.requesterId !== userId && userRole !== 'IT_STAFF' && userRole !== 'ADMIN') {
            res.status(403).json({ error: 'Access denied.' }); return;
        }
        res.status(200).json(ticket)
    } catch {
        res.status(500).json({ error: 'Failed to fetch ticket' })
    }
});

// ─── IT Staff: Update Ticket ──────────────────────────────
router.patch('/tickets/:id/status', requireAppAccess, async (req: Request, res: Response) => {
    const userRole = (req as any).user.role;
    if (userRole !== 'IT_STAFF' && userRole !== 'ADMIN') { res.status(403).json({ error: 'Access denied' }); return; }
    const { status } = req.body;
    if (!VALID_STATUSES.has(status)) return res.status(400).json({ error: 'Invalid status' })
    try {
        const current = await prisma.ticket.findUnique({ where: { id: parseInt(String(req.params.id), 10) }, select: { status: true } })
        if (!current) return res.status(404).json({ error: 'Ticket not found' })
        if (!STATUS_TRANSITIONS[current.status]?.has(status)) return res.status(409).json({ error: `Cannot transition from ${current.status} to ${status}` })
        const updated = await prisma.ticket.update({ where: { id: parseInt(String(req.params.id), 10) }, data: { status } });
        res.status(200).json(updated);
    } catch { res.status(500).json({ error: 'Failed to update status' }); }
});

router.post('/tickets/:id/requester-resolved', requireAppAccess, async (req: Request, res: Response) => {
    const user = (req as any).user
    if (user.role !== 'REQUESTER') return res.status(403).json({ error: 'Requester access required' })
    try {
        const ticket = await getAccessibleTicket(req, res)
        if (!ticket) return
        const updated = await prisma.ticket.update({
            where: { id: ticket.id },
            data: { requesterResolved: true, requesterResolvedAt: new Date() },
        })
        res.status(200).json(updated)
    } catch {
        res.status(500).json({ error: 'Failed to record resolution indication' })
    }
})

router.patch('/tickets/:id/owner', requireAppAccess, async (req: Request, res: Response) => {
    const userRole = (req as any).user.role;
    if (userRole !== 'IT_STAFF' && userRole !== 'ADMIN') { res.status(403).json({ error: 'Access denied' }); return; }
    const { ownerId } = req.body;
    if (ownerId !== null && (!Number.isInteger(ownerId) || !(await prisma.user.findFirst({ where: { id: ownerId, isActive: true, role: { in: ['IT_STAFF', 'ADMIN'] } } })))) return res.status(400).json({ error: 'Owner must be an active IT Staff or Administrator' })
    try {
        const updated = await prisma.ticket.update({ where: { id: parseInt(String(req.params.id), 10) }, data: { ownerId } });
        res.status(200).json(updated);
    } catch { res.status(500).json({ error: 'Failed to update owner' }); }
});

router.patch('/tickets/:id/priority', requireAppAccess, async (req: Request, res: Response) => {
    const userRole = (req as any).user.role;
    if (userRole !== 'IT_STAFF' && userRole !== 'ADMIN') { res.status(403).json({ error: 'Access denied' }); return; }
    const { itPriority } = req.body;
    if (!VALID_PRIORITIES.has(itPriority)) return res.status(400).json({ error: 'Invalid priority' })
    try {
        const updated = await prisma.ticket.update({ where: { id: parseInt(String(req.params.id), 10) }, data: { itPriority } });
        res.status(200).json(updated);
    } catch { res.status(500).json({ error: 'Failed to update priority' }); }
});

// ─── Collaboration: Public Comments ───────────────────────
router.get('/tickets/:id/comments', requireAppAccess, async (req: Request, res: Response) => {
    try {
        if (!await getAccessibleTicket(req, res)) return
        const comments = await prisma.publicComment.findMany({
            where: { ticketId: parseInt(String(req.params.id), 10) },
            include: { author: { select: { id: true, name: true, role: true } } },
            orderBy: { createdAt: 'asc' }
        });
        res.status(200).json(comments);
    } catch { res.status(500).json({ error: 'Failed to fetch comments' }); }
});

router.post('/tickets/:id/comments', requireAppAccess, async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { content } = req.body;
    if (!validContent(content)) return res.status(400).json({ error: 'Content must be between 1 and 5000 characters' })
    try {
        if (!await getAccessibleTicket(req, res)) return
        const comment = await prisma.publicComment.create({
            data: { content: content.trim(), ticketId: parseInt(String(req.params.id), 10), authorId: userId },
            include: { author: { select: { id: true, name: true, role: true } } }
        });
        res.status(201).json(comment);
    } catch { res.status(500).json({ error: 'Failed to create comment' }); }
});

// ─── Collaboration: Internal Notes ────────────────────────
router.get('/tickets/:id/notes', requireAppAccess, async (req: Request, res: Response) => {
    const userRole = (req as any).user.role;
    if (userRole !== 'IT_STAFF' && userRole !== 'ADMIN') { res.status(403).json({ error: 'Access denied' }); return; }
    try {
        if (!await getAccessibleTicket(req, res)) return
        const notes = await prisma.internalNote.findMany({
            where: { ticketId: parseInt(String(req.params.id), 10) },
            include: { author: { select: { id: true, name: true, role: true } } },
            orderBy: { createdAt: 'asc' }
        });
        res.status(200).json(notes);
    } catch { res.status(500).json({ error: 'Failed to fetch notes' }); }
});

router.post('/tickets/:id/notes', requireAppAccess, async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    if (userRole !== 'IT_STAFF' && userRole !== 'ADMIN') { res.status(403).json({ error: 'Access denied' }); return; }
    const { content } = req.body;
    if (!validContent(content)) return res.status(400).json({ error: 'Content must be between 1 and 5000 characters' })
    try {
        if (!await getAccessibleTicket(req, res)) return
        const note = await prisma.internalNote.create({
            data: { content: content.trim(), ticketId: parseInt(String(req.params.id), 10), authorId: userId },
            include: { author: { select: { id: true, name: true, role: true } } }
        });
        res.status(201).json(note);
    } catch { res.status(500).json({ error: 'Failed to create note' }); }
});

// ─── Upload Attachment ────────────────────────────────────
router.post('/tickets/:id/attachments', requireAppAccess, (req: Request, res: Response, next: NextFunction) => {
    upload.single('file')(req, res, async (err: any) => {
        const userId = (req as any).user.userId;
        const userRole = (req as any).user.role;

        if (err?.message === 'INVALID_TYPE') { res.status(415).json({ error: 'File type not allowed.' }); return; }
        if (err?.code === 'LIMIT_FILE_SIZE') { res.status(413).json({ error: 'File size exceeds limit.' }); return; }
        if (err || !req.file) { res.status(400).json({ error: 'Failed to upload attachment.' }); return; }

        try {
            const ticket = await prisma.ticket.findUnique({ where: { id: parseInt(String(req.params.id), 10) } });
            if (!ticket) { res.status(404).json({ error: 'Ticket not found' }); return; }
            if (ticket.requesterId !== userId && userRole !== 'IT_STAFF' && userRole !== 'ADMIN') {
                res.status(403).json({ error: 'Access denied.' }); return;
            }

            const activeCount = await prisma.attachment.count({ where: { ticketId: ticket.id, isRemoved: false } });
            if (activeCount >= 5) {
                res.status(422).json({ error: 'Ticket already has 5 active attachments.' }); return;
            }

            const attachment = await prisma.attachment.create({
                data: { ticketId: ticket.id, uploadedById: userId, originalFilename: req.file.originalname, storedFilename: req.file.filename, mimeType: req.file.mimetype, sizeBytes: req.file.size },
            });
            res.status(201).json(attachment);
        } catch { res.status(500).json({ error: 'Failed to save attachment' }); }
    });
});

// ─── Download Attachment ──────────────────────────────────
router.get('/attachments/:id/download', requireAppAccess, async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    try {
        const attachment = await prisma.attachment.findUnique({
            where: { id: parseInt(String(req.params.id), 10) },
            include: { ticket: { select: { requesterId: true } } },
        });
        if (!attachment || attachment.isRemoved) { res.status(404).json({ error: 'Not found' }); return; }
        if (attachment.ticket.requesterId !== userId && userRole !== 'IT_STAFF' && userRole !== 'ADMIN') {
            res.status(403).json({ error: 'Access denied.' }); return;
        }
        const filePath = path.join(UPLOADS_DIR, attachment.storedFilename);
        if (!fs.existsSync(filePath)) { res.status(500).json({ error: 'File missing.' }); return; }
        res.setHeader('Content-Type', attachment.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalFilename}"`);
        fs.createReadStream(filePath).pipe(res);
    } catch { res.status(500).json({ error: 'Download failed' }); }
});

// ─── Remove Attachment ────────────────────────────────────
router.patch('/attachments/:id/remove', requireAppAccess, async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    const { removalReason } = req.body;
    if (!removalReason || !removalReason.trim()) { res.status(400).json({ error: 'Reason required.' }); return; }
    try {
        const attachment = await prisma.attachment.findUnique({
            where: { id: parseInt(String(req.params.id), 10) },
            include: { ticket: { select: { requesterId: true } } },
        });
        if (!attachment || attachment.isRemoved) { res.status(404).json({ error: 'Not found' }); return; }
        if (attachment.ticket.requesterId !== userId && userRole !== 'IT_STAFF' && userRole !== 'ADMIN') {
            res.status(403).json({ error: 'Access denied.' }); return;
        }
        const updated = await prisma.attachment.update({
            where: { id: attachment.id },
            data: { isRemoved: true, removedAt: new Date(), removalReason: removalReason.trim() },
        });
        res.status(200).json(updated);
    } catch { res.status(500).json({ error: 'Failed to remove' }); }
});

export default router;
