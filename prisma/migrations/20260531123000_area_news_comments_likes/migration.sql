CREATE TABLE "AreaNewsComment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "postId" TEXT NOT NULL,
  "municipalityId" TEXT NOT NULL,
  "citizenId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AreaNewsComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "AreaNewsPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AreaNewsComment_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AreaNewsComment_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AreaNewsLike" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "postId" TEXT NOT NULL,
  "municipalityId" TEXT NOT NULL,
  "citizenId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AreaNewsLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "AreaNewsPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AreaNewsLike_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AreaNewsLike_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "AreaNewsComment_postId_idx" ON "AreaNewsComment"("postId");
CREATE INDEX "AreaNewsComment_municipalityId_idx" ON "AreaNewsComment"("municipalityId");
CREATE INDEX "AreaNewsComment_citizenId_idx" ON "AreaNewsComment"("citizenId");
CREATE INDEX "AreaNewsComment_createdAt_idx" ON "AreaNewsComment"("createdAt");
CREATE UNIQUE INDEX "AreaNewsLike_postId_citizenId_key" ON "AreaNewsLike"("postId", "citizenId");
CREATE INDEX "AreaNewsLike_postId_idx" ON "AreaNewsLike"("postId");
CREATE INDEX "AreaNewsLike_municipalityId_idx" ON "AreaNewsLike"("municipalityId");
CREATE INDEX "AreaNewsLike_citizenId_idx" ON "AreaNewsLike"("citizenId");
