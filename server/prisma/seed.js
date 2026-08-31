"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("../src/generated/prisma/client");
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log("🌱 Starting seed...");
    // ─── Categories ───────────────────────────────────────────
    const categories = [
        "Account and Access",
        "Hardware",
        "Software",
        "Network",
    ];
    for (const name of categories) {
        await prisma.category.upsert({
            where: { name },
            update: { isActive: true },
            create: { name, isActive: true },
        });
    }
    console.log("✅ Categories seeded");
    // ─── Related Systems ──────────────────────────────────────
    const relatedSystems = [
        "Email",
        "Campus Wi-Fi",
        "VPN",
        "LEB2 App",
        "Grade Submission App",
        "Printer",
        "Corporate Laptop",
    ];
    for (const name of relatedSystems) {
        await prisma.relatedSystem.upsert({
            where: { name },
            update: { isActive: true },
            create: { name, isActive: true },
        });
    }
    console.log("✅ Related systems seeded");
    // ─── Dev Requesters (Active) ──────────────────────────────
    const activeRequesters = [
        { name: "Jennifer Anderson", email: "jennifer.anderson@kmutt.ac.th" },
        { name: "Michael Brown", email: "michael.brown@kmutt.ac.th" },
        { name: "Sarah Johnson", email: "sarah.johnson@kmutt.ac.th" },
        { name: "David Lee", email: "david.lee@kmutt.ac.th" },
    ];
    for (const r of activeRequesters) {
        await prisma.devRequester.upsert({
            where: { email: r.email },
            update: { name: r.name, isActive: true },
            create: { ...r, isActive: true },
        });
    }
    console.log("✅ Active dev requesters seeded");
    // ─── Dev Requester (Inactive) ─────────────────────────────
    await prisma.devRequester.upsert({
        where: { email: "inactive.user@kmutt.ac.th" },
        update: { isActive: false },
        create: {
            name: "Inactive User",
            email: "inactive.user@kmutt.ac.th",
            isActive: false,
        },
    });
    console.log("✅ Inactive dev requester seeded");
    console.log("🎉 Seeding finished successfully!");
}
main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
