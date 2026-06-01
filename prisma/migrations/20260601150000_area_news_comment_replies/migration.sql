ALTER TABLE "AreaNewsComment" ADD COLUMN "parentCommentId" TEXT;
CREATE INDEX "AreaNewsComment_parentCommentId_idx" ON "AreaNewsComment"("parentCommentId");
