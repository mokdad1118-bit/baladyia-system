-- CreateTable
CREATE TABLE "PendingCitizenRegistration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "nationalId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "PendingCitizenRegistration_email_key" ON "PendingCitizenRegistration"("email");
CREATE INDEX "PendingCitizenRegistration_expiresAt_idx" ON "PendingCitizenRegistration"("expiresAt");
CREATE INDEX "PendingCitizenRegistration_phone_idx" ON "PendingCitizenRegistration"("phone");
CREATE INDEX "PendingCitizenRegistration_nationalId_idx" ON "PendingCitizenRegistration"("nationalId");
