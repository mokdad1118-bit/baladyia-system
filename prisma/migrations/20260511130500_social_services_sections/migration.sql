-- Add social services requests table and notification link
ALTER TABLE "Notification" ADD COLUMN "socialServiceCaseId" TEXT;
CREATE INDEX "Notification_socialServiceCaseId_idx" ON "Notification"("socialServiceCaseId");

CREATE TABLE "SocialServiceCase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseNumber" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "fullName" TEXT,
    "birthDate" DATETIME,
    "nationalId" TEXT,
    "phone" TEXT NOT NULL,
    "husbandFullName" TEXT,
    "husbandBirthDate" DATETIME,
    "husbandNationalId" TEXT,
    "wifeFullName" TEXT,
    "wifeBirthDate" DATETIME,
    "wifeNationalId" TEXT,
    "familyBookNumber" TEXT,
    "email" TEXT NOT NULL,
    "attachmentsJson" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SocialServiceCase_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "SocialServiceCaseSerial" (
    "year" INTEGER NOT NULL PRIMARY KEY,
    "lastN" INTEGER NOT NULL
);

CREATE UNIQUE INDEX "SocialServiceCase_caseNumber_key" ON "SocialServiceCase"("caseNumber");
CREATE INDEX "SocialServiceCase_createdAt_idx" ON "SocialServiceCase"("createdAt");
CREATE INDEX "SocialServiceCase_category_idx" ON "SocialServiceCase"("category");
CREATE INDEX "SocialServiceCase_status_idx" ON "SocialServiceCase"("status");
CREATE INDEX "SocialServiceCase_nationalId_idx" ON "SocialServiceCase"("nationalId");
CREATE INDEX "SocialServiceCase_husbandNationalId_idx" ON "SocialServiceCase"("husbandNationalId");
CREATE INDEX "SocialServiceCase_wifeNationalId_idx" ON "SocialServiceCase"("wifeNationalId");
CREATE INDEX "SocialServiceCase_familyBookNumber_idx" ON "SocialServiceCase"("familyBookNumber");
CREATE UNIQUE INDEX "SocialServiceCase_category_nationalId_key" ON "SocialServiceCase"("category", "nationalId");
CREATE UNIQUE INDEX "SocialServiceCase_category_husbandNationalId_key" ON "SocialServiceCase"("category", "husbandNationalId");
CREATE UNIQUE INDEX "SocialServiceCase_category_wifeNationalId_key" ON "SocialServiceCase"("category", "wifeNationalId");
CREATE UNIQUE INDEX "SocialServiceCase_category_familyBookNumber_key" ON "SocialServiceCase"("category", "familyBookNumber");
