ALTER TABLE "Request" ADD COLUMN "inPersonNumber" TEXT;
CREATE UNIQUE INDEX "Request_inPersonNumber_key" ON "Request"("inPersonNumber");
