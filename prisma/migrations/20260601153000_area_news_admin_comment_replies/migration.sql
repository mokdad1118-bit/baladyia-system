CREATE TABLE "AreaNewsCommentReply" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "postId" TEXT NOT NULL,
  "commentId" TEXT NOT NULL,
  "municipalityId" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AreaNewsCommentReply_postId_fkey" FOREIGN KEY ("postId") REFERENCES "AreaNewsPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AreaNewsCommentReply_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "AreaNewsComment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AreaNewsCommentReply_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AreaNewsCommentReply_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "AreaNewsCommentReply_postId_idx" ON "AreaNewsCommentReply"("postId");
CREATE INDEX "AreaNewsCommentReply_commentId_idx" ON "AreaNewsCommentReply"("commentId");
CREATE INDEX "AreaNewsCommentReply_municipalityId_idx" ON "AreaNewsCommentReply"("municipalityId");
CREATE INDEX "AreaNewsCommentReply_adminId_idx" ON "AreaNewsCommentReply"("adminId");
CREATE INDEX "AreaNewsCommentReply_createdAt_idx" ON "AreaNewsCommentReply"("createdAt");
