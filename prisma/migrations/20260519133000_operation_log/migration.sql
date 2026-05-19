ALTER TABLE "User" ADD COLUMN "permViewOperationLog" BOOLEAN NOT NULL DEFAULT false;

UPDATE "User"
SET "permViewOperationLog" = true
WHERE "role" IN ('SUPER_ADMIN', 'MUNICIPALITY_ADMIN');

CREATE TABLE "OperationLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "municipalityId" TEXT,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "module" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "entityType" TEXT,
  "entityId" TEXT,
  "requestId" TEXT,
  "metadataJson" TEXT NOT NULL DEFAULT '{}',
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OperationLog_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "OperationLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "OperationLog_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "OperationLog_municipalityId_idx" ON "OperationLog"("municipalityId");
CREATE INDEX "OperationLog_actorId_idx" ON "OperationLog"("actorId");
CREATE INDEX "OperationLog_requestId_idx" ON "OperationLog"("requestId");
CREATE INDEX "OperationLog_action_idx" ON "OperationLog"("action");
CREATE INDEX "OperationLog_module_idx" ON "OperationLog"("module");
CREATE INDEX "OperationLog_createdAt_idx" ON "OperationLog"("createdAt");
CREATE INDEX "OperationLog_entityType_entityId_idx" ON "OperationLog"("entityType", "entityId");
