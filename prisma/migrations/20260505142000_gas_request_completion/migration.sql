-- AlterTable
ALTER TABLE "GasRequest" ADD COLUMN "isCompleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "GasRequest" ADD COLUMN "completedAt" DATETIME;

-- CreateIndex
CREATE INDEX "GasRequest_isCompleted_idx" ON "GasRequest"("isCompleted");
