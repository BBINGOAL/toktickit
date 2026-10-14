-- Additive upgrade: no earlier rows or relations are removed.
CREATE TYPE "ActionStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
ALTER TABLE "Ticket"
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "workCycle" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "resolvedAt" TIMESTAMP(3),
  ADD COLUMN "cancelledReason" TEXT;
-- Approximation only: previous labs did not record a formal resolution date.
UPDATE "Ticket" SET "resolvedAt" = "updatedAt" WHERE "status" IN ('RESOLVED', 'CLOSED');

CREATE TABLE "ActionTaken" (
  "id" SERIAL PRIMARY KEY,
  "ticketId" INTEGER NOT NULL,
  "workCycle" INTEGER NOT NULL,
  "actionDateTime" TIMESTAMP(3) NOT NULL,
  "description" TEXT NOT NULL,
  "result" TEXT NOT NULL DEFAULT '',
  "performedById" INTEGER NOT NULL,
  "assigneeId" INTEGER NOT NULL,
  "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
  "followUpNote" TEXT NOT NULL DEFAULT '',
  "attachmentNotes" TEXT NOT NULL DEFAULT '',
  "followsUpActionId" INTEGER,
  "status" "ActionStatus" NOT NULL DEFAULT 'PLANNED',
  "cancellationReason" TEXT,
  "version" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ActionTaken_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ActionTaken_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ActionTaken_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ActionTaken_followsUpActionId_fkey" FOREIGN KEY ("followsUpActionId") REFERENCES "ActionTaken"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
);
CREATE TABLE "ActionTakenEvent" (
  "id" SERIAL PRIMARY KEY, "actionId" INTEGER NOT NULL, "actorId" INTEGER NOT NULL,
  "kind" TEXT NOT NULL, "before" JSONB, "after" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActionTakenEvent_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "ActionTaken"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ActionTakenEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "TicketWorkflowEvent" (
  "id" SERIAL PRIMARY KEY, "ticketId" INTEGER NOT NULL, "actorId" INTEGER NOT NULL,
  "kind" TEXT NOT NULL, "before" JSONB, "after" JSONB NOT NULL, "workCycle" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TicketWorkflowEvent_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "TicketWorkflowEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "MutationRequest" (
  "id" SERIAL PRIMARY KEY, "userId" INTEGER NOT NULL, "scope" TEXT NOT NULL, "key" TEXT NOT NULL,
  "payloadDigest" TEXT NOT NULL, "responseStatus" INTEGER NOT NULL, "response" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MutationRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "MutationRequest_userId_scope_key_key" ON "MutationRequest"("userId", "scope", "key");
CREATE INDEX "ActionTaken_ticketId_workCycle_actionDateTime_id_idx" ON "ActionTaken"("ticketId", "workCycle", "actionDateTime", "id");
CREATE INDEX "ActionTaken_assigneeId_status_updatedAt_id_idx" ON "ActionTaken"("assigneeId", "status", "updatedAt", "id");
CREATE INDEX "ActionTaken_followsUpActionId_idx" ON "ActionTaken"("followsUpActionId");
CREATE INDEX "ActionTakenEvent_actionId_createdAt_id_idx" ON "ActionTakenEvent"("actionId", "createdAt", "id");
CREATE INDEX "TicketWorkflowEvent_ticketId_createdAt_id_idx" ON "TicketWorkflowEvent"("ticketId", "createdAt", "id");
CREATE INDEX "Ticket_requesterId_status_idx" ON "Ticket"("requesterId", "status");
CREATE INDEX "Ticket_ownerId_status_idx" ON "Ticket"("ownerId", "status");
CREATE INDEX "Ticket_itPriority_status_idx" ON "Ticket"("itPriority", "status");
CREATE INDEX "Ticket_updatedAt_id_idx" ON "Ticket"("updatedAt", "id");
CREATE INDEX "Ticket_resolvedAt_idx" ON "Ticket"("resolvedAt");
