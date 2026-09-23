import { PrismaClient } from './src/generated/prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5434/localdb' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedMany() {
    const requesters = await prisma.user.findMany({ where: { role: 'REQUESTER', isActive: true } });
    const categories = await prisma.category.findMany({ where: { isActive: true } });
    const systems = await prisma.relatedSystem.findMany({ where: { isActive: true } });

    if (!requesters.length || !categories.length || !systems.length) return;

    // Helper to get random item from array
    const rand = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
    
    // We will clear existing tickets first so we don't have duplicates or mess
    await prisma.ticket.deleteMany();

    const dummyTickets = [
        { summary: "Forgot LEB2 Password", priority: "MEDIUM", status: "OPEN" },
        { summary: "Campus Wi-Fi disconnects every 5 mins", priority: "HIGH", status: "IN_PROGRESS" },
        { summary: "Need access to VPN for research", priority: "LOW", status: "OPEN" },
        { summary: "Printer in CB2 is out of toner", priority: "MEDIUM", status: "RESOLVED" },
        { summary: "My Corporate Laptop won't turn on", priority: "HIGH", status: "OPEN" },
        { summary: "Email quota exceeded", priority: "MEDIUM", status: "IN_PROGRESS" },
        { summary: "Grade Submission App shows error 500", priority: "HIGH", status: "OPEN" },
        { summary: "Software license expired (MATLAB)", priority: "MEDIUM", status: "CLOSED" },
        { summary: "Requesting second monitor", priority: "LOW", status: "OPEN" },
        { summary: "Keyboard keys are sticky", priority: "LOW", status: "RESOLVED" },
        { summary: "Cannot access department shared drive", priority: "MEDIUM", status: "OPEN" },
        { tempSeq: 12, summary: "Zoom account upgrade request", priority: "LOW", status: "IN_PROGRESS" },
        { tempSeq: 13, summary: "Internet speed is too slow in Library", priority: "MEDIUM", status: "OPEN" },
        { tempSeq: 14, summary: "Blue screen of death on startup", priority: "HIGH", status: "IN_PROGRESS" },
        { tempSeq: 15, summary: "Need help installing Adobe Premiere", priority: "LOW", status: "OPEN" }
    ];

    let seq = 1;
    for (const data of dummyTickets) {
        const reqUser = rand(requesters);
        const cat = rand(categories);
        const sys = rand(systems);
        
        const date = new Date();
        const prefix = `TKT-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const ticketNumber = `${prefix}-${seq.toString().padStart(3, '0')}`;
        seq++;

        await prisma.ticket.create({
            data: {
                ticketNumber,
                summary: data.summary,
                description: `This is an auto-generated dummy description for: ${data.summary}`,
                requestedPriority: data.priority,
                status: data.status,
                requesterId: reqUser.id,
                categoryId: cat.id,
                relatedSystemId: sys.id,
                itPriority: data.priority === 'HIGH' ? 'HIGH' : null // Mock some IT priority
            }
        });
    }

    console.log(`Seeded ${dummyTickets.length} tickets successfully across ${requesters.length} requesters!`);
}

seedMany().catch(console.error).finally(() => process.exit(0));
