-- AlterTable
ALTER TABLE "ReturneeRegistration" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
-- LibSQL/SQLite: لا يُسمح بـ DEFAULT CURRENT_TIMESTAMP عند ADD COLUMN (غير ثابت).
-- قيمة ثابتة ثم مزامنة من createdAt للصفوف الموجودة.
ALTER TABLE "ReturneeRegistration" ADD COLUMN "updatedAt" DATETIME NOT NULL DEFAULT '1970-01-01 00:00:00';

UPDATE "ReturneeRegistration" SET "updatedAt" = "createdAt" WHERE "updatedAt" = '1970-01-01 00:00:00';

-- CreateIndex (idempotent for redeploys / partial applies)
CREATE INDEX IF NOT EXISTS "ReturneeRegistration_status_idx" ON "ReturneeRegistration"("status");
