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

export default app
