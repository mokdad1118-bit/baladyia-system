-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "gasRequestId" TEXT;

-- CreateIndex
CREATE INDEX "Notification_gasRequestId_idx" ON "Notification"("gasRequestId");
