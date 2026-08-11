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
app.use(cors({
    origin: "http://localhost:5173",
}))

app.use(express.json())

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: "TokTickIT API"
    })
}
)
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            select: { id: true, name: true },
            orderBy: { id: 'asc' },
        })
        res.status(200).json(categories)
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch categories' })
    }
})
export default app
