-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "returneeRegistrationId" TEXT;

-- CreateIndex
CREATE INDEX "Notification_returneeRegistrationId_idx" ON "Notification"("returneeRegistrationId");
