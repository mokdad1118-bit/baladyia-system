-- CreateTable
CREATE TABLE "GasRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gasRequestNumber" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "nationalId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GasRequest_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GasRequestSerial" (
    "year" INTEGER NOT NULL PRIMARY KEY,
    "lastN" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "GasRequest_gasRequestNumber_key" ON "GasRequest"("gasRequestNumber");

-- CreateIndex
CREATE INDEX "GasRequest_createdAt_idx" ON "GasRequest"("createdAt");

-- CreateIndex
CREATE INDEX "GasRequest_phone_idx" ON "GasRequest"("phone");

-- CreateIndex
CREATE INDEX "GasRequest_nationalId_idx" ON "GasRequest"("nationalId");
