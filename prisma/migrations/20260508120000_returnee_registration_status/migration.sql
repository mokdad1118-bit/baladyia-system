-- AlterTable
ALTER TABLE "ReturneeRegistration" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "ReturneeRegistration" ADD COLUMN "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "ReturneeRegistration_status_idx" ON "ReturneeRegistration"("status");
