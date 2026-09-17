import { PrismaClient } from './src/generated/prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5434/localdb' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
    const requester = await prisma.user.findFirst({ where: { role: 'REQUESTER' }});
    const category = await prisma.category.findFirst();
    const system = await prisma.relatedSystem.findFirst();

    if (!requester || !category || !system) return;

    await prisma.ticket.create({
        data: {
            ticketNumber: 'TKT-202609-001',
            summary: 'Cannot login to LEB2',
            description: 'It shows 401 Unauthorized',
            requestedPriority: 'HIGH',
            status: 'OPEN',
            requesterId: requester.id,
            categoryId: category.id,
            relatedSystemId: system.id
        }
    });

    await prisma.ticket.create({
        data: {
            ticketNumber: 'TKT-202609-002',
            summary: 'Wifi is very slow today',
            description: 'I am at CB2 and it keeps disconnecting',
            requestedPriority: 'MEDIUM',
            status: 'IN_PROGRESS',
            requesterId: requester.id,
            categoryId: category.id,
            relatedSystemId: system.id
        }
    });
    console.log('Seeded 2 dummy tickets');
}

seed().catch(console.error).finally(() => process.exit(0));
