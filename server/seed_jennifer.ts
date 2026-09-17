import { PrismaClient } from './src/generated/prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5434/localdb' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedForJennifer() {
    // หา Jennifer
    const jennifer = await prisma.user.findFirst({ where: { email: 'jennifer.anderson@kmutt.ac.th' } });
    const categories = await prisma.category.findMany({ where: { isActive: true } });
    const systems = await prisma.relatedSystem.findMany({ where: { isActive: true } });

    if (!jennifer || !categories.length || !systems.length) return;

    const rand = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
    
    const dummyTickets = [
        { summary: "Cannot connect to campus Wi-Fi in building A", priority: "HIGH", status: "OPEN" },
        { summary: "Request software installation for Photoshop", priority: "MEDIUM", status: "IN_PROGRESS" },
        { summary: "Printer in the lounge is out of paper", priority: "LOW", status: "OPEN" },
        { summary: "Forgot password for LEB2 portal", priority: "HIGH", status: "RESOLVED" },
        { summary: "Need access to the new shared drive", priority: "MEDIUM", status: "OPEN" },
        { summary: "My mouse is double clicking", priority: "LOW", status: "CLOSED" },
        { summary: "Can I get an external monitor?", priority: "LOW", status: "OPEN" },
        { summary: "VPN drops connection frequently", priority: "HIGH", status: "IN_PROGRESS" },
        { summary: "Email attachment limit reached", priority: "MEDIUM", status: "OPEN" },
        { summary: "Keyboard spacebar is broken", priority: "LOW", status: "OPEN" }
    ];

    let seq = 100;
    for (const data of dummyTickets) {
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
                description: `This is an auto-generated dummy description for Jennifer: ${data.summary}`,
                requestedPriority: data.priority,
                status: data.status,
                requesterId: jennifer.id,
                categoryId: cat.id,
                relatedSystemId: sys.id,
                itPriority: data.priority === 'HIGH' ? 'HIGH' : null
            }
        });
    }

    console.log(`Seeded 10 more tickets specifically for Jennifer!`);
}

seedForJennifer().catch(console.error).finally(() => process.exit(0));
