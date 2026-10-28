import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../app';
import { upload } from '../app';
import { requireAppAccess } from '../middleware/auth.middleware';
import fs from 'fs';
import path from 'path';

const router = Router();
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
const VALID_PRIORITIES = new Set(['LOW', 'MEDIUM', 'HIGH']);

async function getAccessibleTicket(req: Request, res: Response) {
    const id = Number.parseInt(String(req.params.id), 10)
    if (!Number.isInteger(id)) {
        res.status(400).json({ error: 'Invalid ticket id' })
        return null
    }
    const ticket = await prisma.ticket.findUnique({ where: { id }, select: { id: true, requesterId: true } })
    if (!ticket) {
        res.status(404).json({ error: 'Resource not found', code: 'NOT_FOUND' })
        return null
    }
    const user = (req as any).user
    if (user.role === 'REQUESTER' && ticket.requesterId !== user.userId) {
        res.status(404).json({ error: 'Resource not found', code: 'NOT_FOUND' })
        return null
    }
    return ticket
}

function validContent(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 5000
}

async function generateTicketNumber(tx: any) {
    const date = new Date()
    const prefix = `TKT-${date.getFullYear()}-`
    // Serialize number allocation within the transaction, including concurrent requests.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(334002)`
    const latestTicket = await tx.ticket.findFirst({
        where: { ticketNumber: { startsWith: prefix } },
        orderBy: { ticketNumber: 'desc' },
    })
    if (!latestTicket) return `${prefix}000001`
    const lastSeq = parseInt(latestTicket.ticketNumber.split('-')[2])
    const nextSeq = (lastSeq + 1).toString().padStart(6, '0')
    return `${prefix}${nextSeq}`
}

// ─── Create Ticket ─────────────────────────────────────────
router.post('/tickets', requireAppAccess, async (req: Request, res: Response) => {
    const requesterId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    if (userRole !== 'REQUESTER') {
        res.status(403).json({ error: 'Only requesters can create tickets' }); return;
    }
    const { categoryId, relatedSystemId, summary, description, requestedPriority } = req.body;
    const details: Record<string, string> = {}
    if (!Number.isInteger(categoryId) || categoryId <= 0) details.categoryId = 'Invalid category'
    if (!Number.isInteger(relatedSystemId) || relatedSystemId <= 0) details.relatedSystemId = 'Invalid related system'
    if (typeof summary !== 'string' || summary.trim().length < 5 || summary.trim().length > 200) details.summary = 'Summary must be between 5 and 200 characters'
    if (typeof description !== 'string' || description.trim().length < 10 || description.trim().length > 2000) details.description = 'Description must be between 10 and 2000 characters'
    if (!VALID_PRIORITIES.has(requestedPriority)) details.requestedPriority = 'Invalid requested priority'
    if (Object.keys(details).length) return res.status(400).json({ error: 'Validation failed', details })
    try {
        if (!await prisma.category.findFirst({ where: { id: categoryId, isActive: true } })) return res.status(400).json({ error: 'Invalid category' })
        if (!await prisma.relatedSystem.findFirst({ where: { id: relatedSystemId, isActive: true } })) return res.status(400).json({ error: 'Invalid related system' })
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
// Requester list lives in dashboard.routes.ts (shared drill-down filters).
// Queue lives in dashboard.routes.ts with shared validated predicates.

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
        if (err) { res.status(400).json({ error: 'Failed to upload attachment.' }); return; }
        if (!req.file) { res.status(400).json({ error: 'No file was uploaded.' }); return; }

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
        // Hide existence from other Requesters before exposing removal state.
        if (!attachment || (attachment.ticket.requesterId !== userId && userRole !== 'IT_STAFF' && userRole !== 'ADMIN')) {
            res.status(404).json({ error: 'Resource not found', code: 'NOT_FOUND' }); return;
        }
        if (attachment.isRemoved) { res.status(410).json({ error: 'This attachment has been removed and is no longer available.' }); return; }
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
        if (!attachment) { res.status(404).json({ error: 'Not found' }); return; }
        if (attachment.ticket.requesterId !== userId && userRole !== 'IT_STAFF' && userRole !== 'ADMIN') {
            res.status(403).json({ error: 'Access denied.' }); return;
        }
        if (attachment.isRemoved) return res.status(409).json({ error: 'Attachment already removed.' })
        const updated = await prisma.attachment.update({
            where: { id: attachment.id },
            data: { isRemoved: true, removedAt: new Date(), removalReason: removalReason.trim() },
        });
        res.status(200).json(updated);
    } catch { res.status(500).json({ error: 'Failed to remove' }); }
});

export default router;
