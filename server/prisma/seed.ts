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
      update: { name: r.name, isActive: true, passwordHash: defaultPassword },
      create: { ...r, passwordHash: defaultPassword, isActive: true, mustChangePassword: true },
    });
  }
  console.log("✅ Active Requesters seeded");

  // ─── Users (IT Staff & Admin) ─────────────────────────────
  const staffAndAdmin = [
    { name: "IT Staff One", email: "it1@kmutt.ac.th", role: "IT_STAFF" as const },
    { name: "IT Staff Two", email: "it2@kmutt.ac.th", role: "IT_STAFF" as const },
    { name: "IT Staff Three", email: "it3@kmutt.ac.th", role: "IT_STAFF" as const },
    { name: "Admin System", email: "admin@kmutt.ac.th", role: "ADMIN" as const },
  ];
  for (const u of staffAndAdmin) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, isActive: true, passwordHash: defaultPassword },
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
  await prisma.user.upsert({
    where: { email: "inactive.staff@kmutt.ac.th" },
    update: { isActive: false, role: "IT_STAFF" },
    create: {
      name: "Inactive IT Staff",
      email: "inactive.staff@kmutt.ac.th",
      passwordHash: defaultPassword,
      role: "IT_STAFF" as const,
      isActive: false,
      mustChangePassword: true,
    },
  });

  const network = await prisma.category.findUnique({ where: { name: "Network" } });
  const hardware = await prisma.category.findUnique({ where: { name: "Hardware" } });
  const vpn = await prisma.relatedSystem.findUnique({ where: { name: "VPN" } });
  const wifi = await prisma.relatedSystem.findUnique({ where: { name: "Campus Wi-Fi" } });
  const requesters = await prisma.user.findMany({ where: { role: "REQUESTER", isActive: true }, orderBy: { id: "asc" }, take: 4 });
  const staff = await prisma.user.findUnique({ where: { email: "it1@kmutt.ac.th" } });

  if (network && hardware && vpn && wifi && requesters.length >= 4 && staff) {
    const tickets = [
      { number: "SEED-001", requesterId: requesters[0].id, categoryId: network.id, relatedSystemId: wifi.id, summary: "Campus Wi-Fi disconnects frequently", priority: "HIGH" as const, status: "OPEN" as const, ownerId: null },
      { number: "SEED-002", requesterId: requesters[1].id, categoryId: hardware.id, relatedSystemId: vpn.id, summary: "VPN cannot connect from home", priority: "MEDIUM" as const, status: "IN_PROGRESS" as const, ownerId: staff.id },
      { number: "SEED-003", requesterId: requesters[2].id, categoryId: hardware.id, relatedSystemId: wifi.id, summary: "Laptop keyboard is damaged", priority: "LOW" as const, status: "WAITING_FOR_REQUESTER" as const, ownerId: null },
      { number: "SEED-004", requesterId: requesters[3].id, categoryId: network.id, relatedSystemId: vpn.id, summary: "VPN access request", priority: "MEDIUM" as const, status: "RESOLVED" as const, ownerId: staff.id },
      { number: "SEED-005", requesterId: requesters[0].id, categoryId: network.id, relatedSystemId: wifi.id, summary: "Guest Wi-Fi password request", priority: "LOW" as const, status: "NEW" as const, ownerId: null },
      { number: "SEED-006", requesterId: requesters[1].id, categoryId: hardware.id, relatedSystemId: vpn.id, summary: "External monitor request", priority: "LOW" as const, status: "CLOSED" as const, ownerId: staff.id },
    ];
    for (const t of tickets) {
      await prisma.ticket.upsert({
        where: { ticketNumber: t.number },
        update: { requesterId: t.requesterId, categoryId: t.categoryId, relatedSystemId: t.relatedSystemId, summary: t.summary, requestedPriority: t.priority, itPriority: t.priority, status: t.status, ownerId: t.ownerId },
        create: { ticketNumber: t.number, requesterId: t.requesterId, categoryId: t.categoryId, relatedSystemId: t.relatedSystemId, summary: t.summary, description: `Seeded ticket for ${t.summary}`, requestedPriority: t.priority, itPriority: t.priority, status: t.status, ownerId: t.ownerId },
      });
    }

    const firstTicket = await prisma.ticket.findUnique({ where: { ticketNumber: "SEED-001" } });
    if (firstTicket) {
      const commentContent = "I am still unable to connect from the library.";
      const noteContent = "Check access point logs before contacting the requester.";
      if (!await prisma.publicComment.findFirst({ where: { ticketId: firstTicket.id, authorId: requesters[0].id, content: commentContent } })) {
        await prisma.publicComment.create({ data: { ticketId: firstTicket.id, authorId: requesters[0].id, content: commentContent } });
      }
      if (!await prisma.internalNote.findFirst({ where: { ticketId: firstTicket.id, authorId: staff.id, content: noteContent } })) {
        await prisma.internalNote.create({ data: { ticketId: firstTicket.id, authorId: staff.id, content: noteContent } });
      }
    }
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
