ALTER TABLE "User" ADD COLUMN "permManageAreaNews" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "AreaNewsPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "municipalityId" TEXT,
    "authorId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AreaNewsPost_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AreaNewsPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "AreaNewsRead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "citizenId" TEXT NOT NULL,
    "lastReadAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AreaNewsRead_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "AreaNewsPost_municipalityId_idx" ON "AreaNewsPost"("municipalityId");
CREATE INDEX "AreaNewsPost_authorId_idx" ON "AreaNewsPost"("authorId");
CREATE INDEX "AreaNewsPost_createdAt_idx" ON "AreaNewsPost"("createdAt");
CREATE UNIQUE INDEX "AreaNewsRead_citizenId_key" ON "AreaNewsRead"("citizenId");
