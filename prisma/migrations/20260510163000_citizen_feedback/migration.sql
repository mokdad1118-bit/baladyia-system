-- CreateTable
CREATE TABLE "CitizenFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "citizenId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CitizenFeedback_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CitizenFeedback_citizenId_idx" ON "CitizenFeedback"("citizenId");

-- CreateIndex
CREATE INDEX "CitizenFeedback_createdAt_idx" ON "CitizenFeedback"("createdAt");
