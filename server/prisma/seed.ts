import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...");

  const defaultPassword = bcrypt.hashSync('password123', 10);

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

  // ─── Users (Requesters) ───────────────────────────────────
  const activeRequesters = [
    { name: "Jennifer Anderson", email: "jennifer.anderson@kmutt.ac.th", role: "REQUESTER" as const },
    { name: "Michael Brown",     email: "michael.brown@kmutt.ac.th", role: "REQUESTER" as const },
    { name: "Sarah Johnson",     email: "sarah.johnson@kmutt.ac.th", role: "REQUESTER" as const },
    { name: "David Lee",         email: "david.lee@kmutt.ac.th", role: "REQUESTER" as const },
  ];
  for (const r of activeRequesters) {
    await prisma.user.upsert({
      where: { email: r.email },
      update: { name: r.name, isActive: true },
      create: { ...r, passwordHash: defaultPassword, isActive: true, mustChangePassword: true },
    });
  }
  console.log("✅ Active Requesters seeded");

  // ─── Users (IT Staff & Admin) ─────────────────────────────
  const staffAndAdmin = [
    { name: "IT Staff One", email: "it1@kmutt.ac.th", role: "IT_STAFF" as const },
    { name: "Admin System", email: "admin@kmutt.ac.th", role: "ADMIN" as const },
  ];
  for (const u of staffAndAdmin) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, isActive: true },
      create: { ...u, passwordHash: defaultPassword, isActive: true, mustChangePassword: true },
    });
  }
  console.log("✅ IT Staff and Admin seeded");

  // ─── Inactive User ────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "inactive.user@kmutt.ac.th" },
    update: { isActive: false },
    create: {
      name: "Inactive User",
      email: "inactive.user@kmutt.ac.th",
      passwordHash: defaultPassword,
      role: "REQUESTER" as const,
      isActive: false,
      mustChangePassword: true
    },
  });
  console.log("✅ Inactive user seeded");

  console.log("🎉 Seeding finished successfully!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
