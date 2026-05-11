-- AlterTable
ALTER TABLE "CitizenFeedback" ADD COLUMN "adminReply" TEXT;
ALTER TABLE "CitizenFeedback" ADD COLUMN "adminReplyAt" DATETIME;
ALTER TABLE "CitizenFeedback" ADD COLUMN "adminRepliedById" TEXT;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "citizenFeedbackId" TEXT;

-- CreateIndex
CREATE INDEX "CitizenFeedback_adminRepliedById_idx" ON "CitizenFeedback"("adminRepliedById");

-- CreateIndex
CREATE INDEX "Notification_citizenFeedbackId_idx" ON "Notification"("citizenFeedbackId");
