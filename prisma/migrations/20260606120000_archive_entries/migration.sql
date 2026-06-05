ALTER TABLE "User" ADD COLUMN "permManageArchive" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "ArchiveEntry" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "municipalityId" TEXT NOT NULL,
  "createdById" TEXT,
  "requestNumber" TEXT NOT NULL,
  "citizenName" TEXT NOT NULL,
  "filePath" TEXT NOT NULL,
  "fileOriginal" TEXT NOT NULL,
  "fileMime" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "ArchiveEntry_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ArchiveEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "ArchiveEntry_municipalityId_idx" ON "ArchiveEntry"("municipalityId");
CREATE INDEX "ArchiveEntry_createdAt_idx" ON "ArchiveEntry"("createdAt");
CREATE INDEX "ArchiveEntry_requestNumber_idx" ON "ArchiveEntry"("requestNumber");
CREATE INDEX "ArchiveEntry_createdById_idx" ON "ArchiveEntry"("createdById");
