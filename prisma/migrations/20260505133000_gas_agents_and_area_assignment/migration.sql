-- AlterTable
ALTER TABLE "User" ADD COLUMN "gasArea" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GasRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gasRequestNumber" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "assignedAgentId" TEXT,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "nationalId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GasRequest_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GasRequest_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_GasRequest" ("citizenId", "createdAt", "fullName", "gasRequestNumber", "id", "nationalId", "phone", "updatedAt", "area", "assignedAgentId")
SELECT "citizenId", "createdAt", "fullName", "gasRequestNumber", "id", "nationalId", "phone", "updatedAt", 'غير محددة', NULL FROM "GasRequest";
DROP TABLE "GasRequest";
ALTER TABLE "new_GasRequest" RENAME TO "GasRequest";
CREATE UNIQUE INDEX "GasRequest_gasRequestNumber_key" ON "GasRequest"("gasRequestNumber");
CREATE INDEX "GasRequest_createdAt_idx" ON "GasRequest"("createdAt");
CREATE INDEX "GasRequest_phone_idx" ON "GasRequest"("phone");
CREATE INDEX "GasRequest_nationalId_idx" ON "GasRequest"("nationalId");
CREATE INDEX "GasRequest_area_idx" ON "GasRequest"("area");
CREATE INDEX "GasRequest_assignedAgentId_idx" ON "GasRequest"("assignedAgentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_gasArea_key" ON "User"("gasArea");
