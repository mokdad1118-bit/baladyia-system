CREATE TABLE "BroadcastNotification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT,
    "municipalityId" TEXT,
    "targetScope" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "imageUrl" TEXT,
    "openUrl" TEXT,
    "onesignalMessageId" TEXT,
    "onesignalResponse" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BroadcastNotification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BroadcastNotification_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "BroadcastNotification_actorId_idx" ON "BroadcastNotification"("actorId");
CREATE INDEX "BroadcastNotification_municipalityId_idx" ON "BroadcastNotification"("municipalityId");
CREATE INDEX "BroadcastNotification_targetRole_idx" ON "BroadcastNotification"("targetRole");
CREATE INDEX "BroadcastNotification_createdAt_idx" ON "BroadcastNotification"("createdAt");
