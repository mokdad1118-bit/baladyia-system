ALTER TABLE "User" ADD COLUMN "permManageGasInventory" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "gasCylinderStock" INTEGER NOT NULL DEFAULT 0;

UPDATE "User"
SET "permManageGasInventory" = true
WHERE "role" IN ('SUPER_ADMIN', 'MUNICIPALITY_ADMIN');
