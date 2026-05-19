ALTER TABLE "User" ADD COLUMN "permViewRequests" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "permManageGas" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "permManageSocialServices" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "permManageCitizenFeedback" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "permViewCitizens" BOOLEAN NOT NULL DEFAULT false;

UPDATE "User"
SET
  "permViewRequests" = true,
  "permManageGas" = true,
  "permManageSocialServices" = true,
  "permManageCitizenFeedback" = true,
  "permViewCitizens" = true
WHERE "role" IN ('SUPER_ADMIN', 'MUNICIPALITY_ADMIN');
