import "dotenv/config"
import express from 'express'
import cors from 'cors'
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "./generated/prisma/client"

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

export default app
