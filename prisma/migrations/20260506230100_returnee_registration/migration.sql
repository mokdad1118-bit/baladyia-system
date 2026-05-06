-- CreateTable
CREATE TABLE "ReturneeRegistration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "registrationNumber" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "birthDate" DATETIME NOT NULL,
    "nationalId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "returnStatementPath" TEXT NOT NULL,
    "returnStatementOriginal" TEXT NOT NULL,
    "returnStatementMime" TEXT NOT NULL,
    "returnStatementSize" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReturneeRegistration_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReturneeRegistrationSerial" (
    "year" INTEGER NOT NULL PRIMARY KEY,
    "lastN" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ReturneeRegistration_registrationNumber_key" ON "ReturneeRegistration"("registrationNumber");

-- CreateIndex
CREATE INDEX "ReturneeRegistration_createdAt_idx" ON "ReturneeRegistration"("createdAt");

-- CreateIndex
CREATE INDEX "ReturneeRegistration_nationalId_idx" ON "ReturneeRegistration"("nationalId");
