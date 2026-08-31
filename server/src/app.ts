import "dotenv/config"
import express from 'express'
import cors from 'cors'
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "./generated/prisma/client"
import multer from 'multer'
import path from 'path'
import fs from 'fs'

// ─── Upload Config ────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true })

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname)
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
    },
})

const upload = multer({
    storage,
    limits: { fileSize: MAX_SIZE },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true)
        else cb(new Error('INVALID_TYPE'))
    },
})

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })
const app = express()
app.use(cors({ origin: "http://localhost:5173" }))
app.use(express.json())

// ─── Health ───────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: "TokTickIT API" })
})

// ─── Categories ───────────────────────────────────────────
app.get('/api/categories', async (_req, res) => {
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            select: { id: true, name: true },
            orderBy: { id: 'asc' },
        })
        res.status(200).json(categories)
    } catch {
        res.status(500).json({ error: 'Failed to fetch categories' })
    }
})

// ─── Related Systems ──────────────────────────────────────
app.get('/api/related-systems', async (_req, res) => {
    try {
        const systems = await prisma.relatedSystem.findMany({
            where: { isActive: true },
            select: { id: true, name: true },
            orderBy: { id: 'asc' },
        })
        res.status(200).json(systems)
    } catch {
        res.status(500).json({ error: 'Failed to fetch related systems' })
    }
})

// ─── Dev Requesters ───────────────────────────────────────
app.get('/api/requesters', async (_req, res) => {
    try {
        const requesters = await prisma.devRequester.findMany({
            where: { isActive: true },
            select: { id: true, name: true, email: true },
            orderBy: { name: 'asc' },
        })
        res.status(200).json(requesters)
    } catch {
        res.status(500).json({ error: 'Failed to fetch requesters' })
    }
})

// ─── Ticket Helper ────────────────────────────────────────
async function generateTicketNumber(tx: typeof prisma): Promise<string> {
    const year = new Date().getFullYear()
    const last = await tx.ticket.findFirst({
        orderBy: { id: 'desc' },
        select: { ticketNumber: true },
    })
    let nextNum = 1
    if (last) {
        const parts = last.ticketNumber.split('-')
        nextNum = parseInt(parts[2], 10) + 1
    }
    return `TKT-${year}-${String(nextNum).padStart(6, '0')}`
}

// ─── Create Ticket ────────────────────────────────────────
app.post('/api/tickets', async (req, res) => {
    const requesterId = parseInt(req.headers['x-requester-id'] as string)
    if (!requesterId || isNaN(requesterId)) {
        res.status(400).json({ error: 'Requester ID is required' })
        return
    }

    const requester = await prisma.devRequester.findUnique({ where: { id: requesterId } })
    if (!requester || !requester.isActive) {
        res.status(403).json({ error: 'Requester not found or inactive' })
        return
    }

    const { categoryId, relatedSystemId, summary, description, requestedPriority } = req.body
    const errors: Record<string, string> = {}

    if (!categoryId || !Number.isInteger(categoryId)) errors.categoryId = 'Category is required'
    if (!relatedSystemId || !Number.isInteger(relatedSystemId)) errors.relatedSystemId = 'Related system is required'
    if (!summary || typeof summary !== 'string' || summary.trim().length < 5 || summary.trim().length > 200)
        errors.summary = 'Summary must be between 5 and 200 characters'
    if (!description || typeof description !== 'string' || description.trim().length < 10 || description.trim().length > 2000)
        errors.description = 'Description must be between 10 and 2000 characters'
    if (!['LOW', 'MEDIUM', 'HIGH'].includes(requestedPriority))
        errors.requestedPriority = 'Priority must be LOW, MEDIUM, or HIGH'

    if (Object.keys(errors).length > 0) {
        res.status(400).json({ error: 'Validation failed', details: errors })
        return
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } })
    if (!category || !category.isActive) {
        res.status(400).json({ error: 'Category not found or inactive' })
        return
    }
    const relatedSystem = await prisma.relatedSystem.findUnique({ where: { id: relatedSystemId } })
    if (!relatedSystem || !relatedSystem.isActive) {
        res.status(400).json({ error: 'Related system not found or inactive' })
        return
    }

    try {
        const ticket = await prisma.$transaction(async (tx) => {
            const ticketNumber = await generateTicketNumber(tx as typeof prisma)
            return tx.ticket.create({
                data: {
                    ticketNumber,
                    requesterId,
                    categoryId,
                    relatedSystemId,
                    summary: summary.trim(),
                    description: description.trim(),
                    requestedPriority,
                },
            })
        })
        res.status(201).json(ticket)
    } catch {
        res.status(500).json({ error: 'Failed to create ticket' })
    }
})

// ─── Helper: Validate Requester ───────────────────────────
async function validateRequester(id: number) {
    if (!id || isNaN(id)) return null
    return prisma.devRequester.findUnique({ where: { id } })
}

// ─── List Tickets ─────────────────────────────────────────
app.get('/api/tickets', async (req, res) => {
    const requesterId = parseInt(req.headers['x-requester-id'] as string)
    if (!requesterId || isNaN(requesterId)) {
        res.status(400).json({ error: 'Requester ID is required' }); return
    }
    const requester = await validateRequester(requesterId)
    if (!requester || !requester.isActive) {
        res.status(403).json({ error: 'Requester not found or inactive' }); return
    }

    // Parse query params
    const search = (req.query.search as string) || ''
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined
    const requestedPriority = req.query.requestedPriority as string | undefined
    const itPriority = req.query.itPriority as string | undefined
    const status = req.query.status as string | undefined
    const sortField = (req.query.sort as string) || 'createdAt'
    const order = (req.query.order as string) || 'desc'
    const page = parseInt((req.query.page as string) || '1')
    const pageSize = parseInt((req.query.pageSize as string) || '10')

    // Validate
    const validSorts = ['ticketNumber', 'createdAt', 'updatedAt']
    if (!validSorts.includes(sortField)) {
        res.status(400).json({ error: 'sort must be one of: ticketNumber, createdAt, updatedAt' }); return
    }
    if (![10, 25, 50].includes(pageSize)) {
        res.status(400).json({ error: 'pageSize must be 10, 25, or 50' }); return
    }
    if (!Number.isInteger(page) || page < 1) {
        res.status(400).json({ error: 'page must be a positive integer' }); return
    }

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
                    status: true, ticketOwner: true,
                    createdAt: true, updatedAt: true,
                },
                orderBy: { [sortField]: order as 'asc' | 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
        ])

        res.status(200).json({
            data,
            pagination: {
                page, pageSize,
                totalItems,
                totalPages: Math.ceil(totalItems / pageSize),
            },
        })
    } catch {
        res.status(500).json({ error: 'Failed to fetch tickets' })
    }
})

// ─── Get Ticket Detail ────────────────────────────────────
app.get('/api/tickets/:id', async (req, res) => {
    const requesterId = parseInt(req.headers['x-requester-id'] as string)
    if (!requesterId || isNaN(requesterId)) {
        res.status(400).json({ error: 'Requester ID is required' }); return
    }
    const requester = await validateRequester(requesterId)
    if (!requester || !requester.isActive) {
        res.status(403).json({ error: 'Requester not found or inactive' }); return
    }

    try {
        const ticket = await prisma.ticket.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                requester: { select: { id: true, name: true } },
                category: { select: { id: true, name: true } },
                relatedSystem: { select: { id: true, name: true } },
                attachments: {
                    where: { isRemoved: false },
                    select: {
                        id: true, originalFilename: true, mimeType: true,
                        sizeBytes: true, isRemoved: true,
                        removedAt: true, removalReason: true, createdAt: true,
                    },
                },
            },
        })

        if (!ticket) { res.status(404).json({ error: 'Ticket not found' }); return }
        if (ticket.requesterId !== requesterId) {
            res.status(403).json({ error: 'Access denied. You do not own this ticket.' }); return
        }
        res.status(200).json(ticket)
    } catch {
        res.status(500).json({ error: 'Failed to fetch ticket' })
    }
})

// ─── Upload Attachment ────────────────────────────────────
app.post('/api/tickets/:id/attachments', (req, res, next) => {
    upload.single('file')(req, res, async (err) => {
        const requesterId = parseInt(req.headers['x-requester-id'] as string)
        if (!requesterId || isNaN(requesterId)) {
            res.status(400).json({ error: 'Requester ID is required' }); return
        }
        const requester = await validateRequester(requesterId)
        if (!requester || !requester.isActive) {
            res.status(403).json({ error: 'Requester not found or inactive' }); return
        }

        if (err?.message === 'INVALID_TYPE') {
            res.status(415).json({ error: 'File type not allowed. Allowed types: JPG, PNG, WEBP, PDF.' }); return
        }
        if (err?.code === 'LIMIT_FILE_SIZE') {
            res.status(413).json({ error: 'File size exceeds the 5 MB limit.' }); return
        }
        if (err) { res.status(500).json({ error: 'Failed to upload attachment' }); return }
        if (!req.file) { res.status(400).json({ error: 'No file was uploaded.' }); return }

        try {
            const ticket = await prisma.ticket.findUnique({ where: { id: parseInt(req.params.id) } })
            if (!ticket) { res.status(404).json({ error: 'Ticket not found' }); return }
            if (ticket.requesterId !== requesterId) {
                res.status(403).json({ error: 'Access denied. You do not own this ticket.' }); return
            }

            const activeCount = await prisma.attachment.count({
                where: { ticketId: ticket.id, isRemoved: false },
            })
            if (activeCount >= 5) {
                res.status(422).json({ error: 'Ticket already has 5 active attachments. Remove one before adding another.' }); return
            }

            const attachment = await prisma.attachment.create({
                data: {
                    ticketId: ticket.id,
                    originalFilename: req.file.originalname,
                    storedFilename: req.file.filename,
                    mimeType: req.file.mimetype,
                    sizeBytes: req.file.size,
                },
            })
            res.status(201).json(attachment)
        } catch {
            res.status(500).json({ error: 'Failed to upload attachment' })
        }
    })
})

// ─── Get Attachment Metadata ──────────────────────────────
app.get('/api/attachments/:id', async (req, res) => {
    const requesterId = parseInt(req.headers['x-requester-id'] as string)
    if (!requesterId || isNaN(requesterId)) {
        res.status(400).json({ error: 'Requester ID is required' }); return
    }
    try {
        const attachment = await prisma.attachment.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { ticket: { select: { requesterId: true } } },
        })
        if (!attachment) { res.status(404).json({ error: 'Attachment not found' }); return }
        if (attachment.ticket.requesterId !== requesterId) {
            res.status(403).json({ error: 'Access denied.' }); return
        }
        res.status(200).json(attachment)
    } catch {
        res.status(500).json({ error: 'Failed to fetch attachment' })
    }
})

// ─── Download Attachment ──────────────────────────────────
app.get('/api/attachments/:id/download', async (req, res) => {
    const requesterId = parseInt(req.headers['x-requester-id'] as string)
    if (!requesterId || isNaN(requesterId)) {
        res.status(400).json({ error: 'Requester ID is required' }); return
    }
    try {
        const attachment = await prisma.attachment.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { ticket: { select: { requesterId: true } } },
        })
        if (!attachment) { res.status(404).json({ error: 'Attachment not found' }); return }
        if (attachment.isRemoved) {
            res.status(410).json({ error: 'This attachment has been removed and is no longer available.' }); return
        }
        if (attachment.ticket.requesterId !== requesterId) {
            res.status(403).json({ error: 'Access denied.' }); return
        }
        const filePath = path.join(UPLOADS_DIR, attachment.storedFilename)
        if (!fs.existsSync(filePath)) {
            res.status(500).json({ error: 'File could not be retrieved.' }); return
        }
        res.setHeader('Content-Type', attachment.mimeType)
        res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalFilename}"`)
        fs.createReadStream(filePath).pipe(res)
    } catch {
        res.status(500).json({ error: 'Failed to download attachment' })
    }
})

// ─── Soft Remove Attachment ───────────────────────────────
app.patch('/api/attachments/:id/remove', async (req, res) => {
    const requesterId = parseInt(req.headers['x-requester-id'] as string)
    if (!requesterId || isNaN(requesterId)) {
        res.status(400).json({ error: 'Requester ID is required' }); return
    }
    const { removalReason } = req.body
    if (!removalReason || typeof removalReason !== 'string' || removalReason.trim().length === 0) {
        res.status(400).json({ error: 'A removal reason is required.' }); return
    }
    try {
        const attachment = await prisma.attachment.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { ticket: { select: { requesterId: true } } },
        })
        if (!attachment) { res.status(404).json({ error: 'Attachment not found' }); return }
        if (attachment.ticket.requesterId !== requesterId) {
            res.status(403).json({ error: 'Access denied. You do not own this attachment.' }); return
        }
        if (attachment.isRemoved) {
            res.status(409).json({ error: 'Attachment has already been removed.' }); return
        }
        const updated = await prisma.attachment.update({
            where: { id: attachment.id },
            data: { isRemoved: true, removedAt: new Date(), removalReason: removalReason.trim() },
        })
        res.status(200).json(updated)
    } catch {
        res.status(500).json({ error: 'Failed to remove attachment' })
    }
})


export default app
