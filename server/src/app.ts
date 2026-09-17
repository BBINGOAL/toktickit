import "dotenv/config"
import express from 'express'
import cors from 'cors'
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "./generated/prisma/client"
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/auth.routes'
import ticketRoutes from './routes/ticket.routes'


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

export const upload = multer({
    storage,
    limits: { fileSize: MAX_SIZE },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true)
        else cb(new Error('INVALID_TYPE'))
    },
})

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
export const prisma = new PrismaClient({ adapter })
const app = express()
app.use(cors({
    origin: 'http://localhost:5173', // เปลี่ยนพอร์ตถ้า Frontend ของคุณไม่ได้รันที่ 5173
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())

// ─── Auth Routes ──────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api', ticketRoutes)


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


export default app;