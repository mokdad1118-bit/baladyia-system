-- Multi-municipality (محافظة درعا): جدول البلديات، municipalityId، أدوار SUPER_ADMIN / MUNICIPALITY_ADMIN
-- معرّف البلدية الافتراضية لترحيل البيانات القديمة (بصرى الشام) — يُكمّل seed بقية بلديات المحافظة

CREATE TABLE "Municipality" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "governorate" TEXT NOT NULL DEFAULT 'درعا',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "Municipality" ("id", "name", "code", "governorate", "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES (
  'mun-migrate-default',
  'بصرى الشام',
  'bosra-sham',
  'درعا',
  0,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_CitizenFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "municipalityId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminReply" TEXT,
    "adminReplyAt" DATETIME,
    "adminRepliedById" TEXT,
    CONSTRAINT "CitizenFeedback_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CitizenFeedback_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CitizenFeedback_adminRepliedById_fkey" FOREIGN KEY ("adminRepliedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CitizenFeedback" ("municipalityId", "adminRepliedById", "adminReply", "adminReplyAt", "citizenId", "createdAt", "id", "message")
SELECT 'mun-migrate-default', "adminRepliedById", "adminReply", "adminReplyAt", "citizenId", "createdAt", "id", "message" FROM "CitizenFeedback";
DROP TABLE "CitizenFeedback";
ALTER TABLE "new_CitizenFeedback" RENAME TO "CitizenFeedback";
CREATE INDEX "CitizenFeedback_citizenId_idx" ON "CitizenFeedback"("citizenId");
CREATE INDEX "CitizenFeedback_municipalityId_idx" ON "CitizenFeedback"("municipalityId");
CREATE INDEX "CitizenFeedback_createdAt_idx" ON "CitizenFeedback"("createdAt");
CREATE INDEX "CitizenFeedback_adminRepliedById_idx" ON "CitizenFeedback"("adminRepliedById");

CREATE TABLE "new_Department" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "municipalityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Department_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Department" ("municipalityId", "code", "createdAt", "description", "id", "isActive", "name", "updatedAt")
SELECT 'mun-migrate-default', "code", "createdAt", "description", "id", "isActive", "name", "updatedAt" FROM "Department";
DROP TABLE "Department";
ALTER TABLE "new_Department" RENAME TO "Department";
CREATE UNIQUE INDEX "Department_municipalityId_code_key" ON "Department"("municipalityId", "code");

CREATE TABLE "new_GasRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "municipalityId" TEXT NOT NULL,
    "gasRequestNumber" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "assignedAgentId" TEXT,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "nationalId" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GasRequest_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GasRequest_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GasRequest_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_GasRequest" ("municipalityId", "area", "assignedAgentId", "citizenId", "completedAt", "createdAt", "fullName", "gasRequestNumber", "id", "isCompleted", "nationalId", "phone", "updatedAt")
SELECT 'mun-migrate-default', "area", "assignedAgentId", "citizenId", "completedAt", "createdAt", "fullName", "gasRequestNumber", "id", "isCompleted", "nationalId", "phone", "updatedAt" FROM "GasRequest";
DROP TABLE "GasRequest";
ALTER TABLE "new_GasRequest" RENAME TO "GasRequest";
CREATE UNIQUE INDEX "GasRequest_gasRequestNumber_key" ON "GasRequest"("gasRequestNumber");
CREATE INDEX "GasRequest_municipalityId_idx" ON "GasRequest"("municipalityId");
CREATE INDEX "GasRequest_createdAt_idx" ON "GasRequest"("createdAt");
CREATE INDEX "GasRequest_phone_idx" ON "GasRequest"("phone");
CREATE INDEX "GasRequest_nationalId_idx" ON "GasRequest"("nationalId");
CREATE INDEX "GasRequest_area_idx" ON "GasRequest"("area");
CREATE INDEX "GasRequest_assignedAgentId_idx" ON "GasRequest"("assignedAgentId");
CREATE INDEX "GasRequest_isCompleted_idx" ON "GasRequest"("isCompleted");

CREATE TABLE "new_GasRequestSerial" (
    "municipalityId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "lastN" INTEGER NOT NULL,
    PRIMARY KEY ("municipalityId", "year"),
    CONSTRAINT "GasRequestSerial_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_GasRequestSerial" ("municipalityId", "year", "lastN")
SELECT 'mun-migrate-default', "year", "lastN" FROM "GasRequestSerial";
DROP TABLE "GasRequestSerial";
ALTER TABLE "new_GasRequestSerial" RENAME TO "GasRequestSerial";

CREATE TABLE "new_Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "municipalityId" TEXT,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "requestId" TEXT,
    "gasRequestId" TEXT,
    "returneeRegistrationId" TEXT,
    "socialServiceCaseId" TEXT,
    "citizenFeedbackId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Notification_gasRequestId_fkey" FOREIGN KEY ("gasRequestId") REFERENCES "GasRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Notification_returneeRegistrationId_fkey" FOREIGN KEY ("returneeRegistrationId") REFERENCES "ReturneeRegistration" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Notification_socialServiceCaseId_fkey" FOREIGN KEY ("socialServiceCaseId") REFERENCES "SocialServiceCase" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Notification_citizenFeedbackId_fkey" FOREIGN KEY ("citizenFeedbackId") REFERENCES "CitizenFeedback" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Notification" ("municipalityId", "citizenFeedbackId", "createdAt", "gasRequestId", "id", "message", "read", "requestId", "returneeRegistrationId", "socialServiceCaseId", "title", "type", "userId")
SELECT NULL, "citizenFeedbackId", "createdAt", "gasRequestId", "id", "message", "read", "requestId", "returneeRegistrationId", "socialServiceCaseId", "title", "type", "userId" FROM "Notification";
DROP TABLE "Notification";
ALTER TABLE "new_Notification" RENAME TO "Notification";
CREATE INDEX "Notification_municipalityId_idx" ON "Notification"("municipalityId");
CREATE INDEX "Notification_gasRequestId_idx" ON "Notification"("gasRequestId");
CREATE INDEX "Notification_returneeRegistrationId_idx" ON "Notification"("returneeRegistrationId");
CREATE INDEX "Notification_socialServiceCaseId_idx" ON "Notification"("socialServiceCaseId");
CREATE INDEX "Notification_citizenFeedbackId_idx" ON "Notification"("citizenFeedbackId");

CREATE TABLE "new_PendingCitizenRegistration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "municipalityId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "nationalId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PendingCitizenRegistration_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PendingCitizenRegistration" ("municipalityId", "createdAt", "email", "expiresAt", "id", "name", "nationalId", "passwordHash", "phone")
SELECT 'mun-migrate-default', "createdAt", "email", "expiresAt", "id", "name", "nationalId", "passwordHash", "phone" FROM "PendingCitizenRegistration";
DROP TABLE "PendingCitizenRegistration";
ALTER TABLE "new_PendingCitizenRegistration" RENAME TO "PendingCitizenRegistration";
CREATE UNIQUE INDEX "PendingCitizenRegistration_email_key" ON "PendingCitizenRegistration"("email");
CREATE INDEX "PendingCitizenRegistration_expiresAt_idx" ON "PendingCitizenRegistration"("expiresAt");
CREATE INDEX "PendingCitizenRegistration_phone_idx" ON "PendingCitizenRegistration"("phone");
CREATE INDEX "PendingCitizenRegistration_nationalId_idx" ON "PendingCitizenRegistration"("nationalId");

CREATE TABLE "new_Request" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "municipalityId" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "departmentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "submittedFullName" TEXT,
    "submittedPhone" TEXT,
    "submittedNotificationEmail" TEXT,
    "formPayload" TEXT DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Request_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Request_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Request_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Request_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Request_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Request" ("municipalityId", "assigneeId", "citizenId", "createdAt", "departmentId", "formPayload", "id", "requestNumber", "serviceId", "status", "submittedFullName", "submittedNotificationEmail", "submittedPhone", "updatedAt")
SELECT 'mun-migrate-default', "assigneeId", "citizenId", "createdAt", "departmentId", "formPayload", "id", "requestNumber", "serviceId", "status", "submittedFullName", "submittedNotificationEmail", "submittedPhone", "updatedAt" FROM "Request";
DROP TABLE "Request";
ALTER TABLE "new_Request" RENAME TO "Request";
CREATE UNIQUE INDEX "Request_requestNumber_key" ON "Request"("requestNumber");
CREATE INDEX "Request_municipalityId_idx" ON "Request"("municipalityId");

CREATE TABLE "new_RequestSerial" (
    "municipalityId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "lastN" INTEGER NOT NULL,
    PRIMARY KEY ("municipalityId", "year"),
    CONSTRAINT "RequestSerial_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RequestSerial" ("municipalityId", "year", "lastN")
SELECT 'mun-migrate-default', "year", "lastN" FROM "RequestSerial";
DROP TABLE "RequestSerial";
ALTER TABLE "new_RequestSerial" RENAME TO "RequestSerial";

CREATE TABLE "new_ReturneeRegistration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "municipalityId" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "birthDate" DATETIME NOT NULL,
    "nationalId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "returnStatementPath" TEXT NOT NULL,
    "returnStatementOriginal" TEXT NOT NULL,
    "returnStatementMime" TEXT NOT NULL,
    "returnStatementSize" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReturneeRegistration_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReturneeRegistration_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ReturneeRegistration" ("municipalityId", "birthDate", "citizenId", "createdAt", "email", "fullName", "id", "nationalId", "phone", "registrationNumber", "returnStatementMime", "returnStatementOriginal", "returnStatementPath", "returnStatementSize", "status", "updatedAt")
SELECT 'mun-migrate-default', "birthDate", "citizenId", "createdAt", "email", "fullName", "id", "nationalId", "phone", "registrationNumber", "returnStatementMime", "returnStatementOriginal", "returnStatementPath", "returnStatementSize", "status", "updatedAt" FROM "ReturneeRegistration";
DROP TABLE "ReturneeRegistration";
ALTER TABLE "new_ReturneeRegistration" RENAME TO "ReturneeRegistration";
CREATE UNIQUE INDEX "ReturneeRegistration_registrationNumber_key" ON "ReturneeRegistration"("registrationNumber");
CREATE INDEX "ReturneeRegistration_municipalityId_idx" ON "ReturneeRegistration"("municipalityId");
CREATE INDEX "ReturneeRegistration_createdAt_idx" ON "ReturneeRegistration"("createdAt");
CREATE INDEX "ReturneeRegistration_nationalId_idx" ON "ReturneeRegistration"("nationalId");
CREATE INDEX "ReturneeRegistration_status_idx" ON "ReturneeRegistration"("status");

CREATE TABLE "new_ReturneeRegistrationSerial" (
    "municipalityId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "lastN" INTEGER NOT NULL,
    PRIMARY KEY ("municipalityId", "year"),
    CONSTRAINT "ReturneeRegistrationSerial_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ReturneeRegistrationSerial" ("municipalityId", "year", "lastN")
SELECT 'mun-migrate-default', "year", "lastN" FROM "ReturneeRegistrationSerial";
DROP TABLE "ReturneeRegistrationSerial";
ALTER TABLE "new_ReturneeRegistrationSerial" RENAME TO "ReturneeRegistrationSerial";

CREATE TABLE "new_Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "municipalityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "price" TEXT NOT NULL DEFAULT '0',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "departmentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Service_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Service_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Service" ("municipalityId", "createdAt", "departmentId", "description", "id", "isActive", "name", "price", "updatedAt")
SELECT 'mun-migrate-default', "createdAt", "departmentId", "description", "id", "isActive", "name", "price", "updatedAt" FROM "Service";
DROP TABLE "Service";
ALTER TABLE "new_Service" RENAME TO "Service";
CREATE INDEX "Service_municipalityId_idx" ON "Service"("municipalityId");

CREATE TABLE "new_SocialServiceCase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "municipalityId" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "fullName" TEXT,
    "birthDate" DATETIME,
    "nationalId" TEXT,
    "phone" TEXT NOT NULL,
    "husbandFullName" TEXT,
    "husbandBirthDate" DATETIME,
    "husbandNationalId" TEXT,
    "wifeFullName" TEXT,
    "wifeBirthDate" DATETIME,
    "wifeNationalId" TEXT,
    "familyBookNumber" TEXT,
    "email" TEXT NOT NULL,
    "attachmentsJson" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SocialServiceCase_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SocialServiceCase_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SocialServiceCase" ("municipalityId", "attachmentsJson", "birthDate", "caseNumber", "category", "citizenId", "createdAt", "email", "familyBookNumber", "fullName", "husbandBirthDate", "husbandFullName", "husbandNationalId", "id", "nationalId", "phone", "status", "updatedAt", "wifeBirthDate", "wifeFullName", "wifeNationalId")
SELECT 'mun-migrate-default', "attachmentsJson", "birthDate", "caseNumber", "category", "citizenId", "createdAt", "email", "familyBookNumber", "fullName", "husbandBirthDate", "husbandFullName", "husbandNationalId", "id", "nationalId", "phone", "status", "updatedAt", "wifeBirthDate", "wifeFullName", "wifeNationalId" FROM "SocialServiceCase";
DROP TABLE "SocialServiceCase";
ALTER TABLE "new_SocialServiceCase" RENAME TO "SocialServiceCase";
CREATE UNIQUE INDEX "SocialServiceCase_caseNumber_key" ON "SocialServiceCase"("caseNumber");
CREATE INDEX "SocialServiceCase_municipalityId_idx" ON "SocialServiceCase"("municipalityId");
CREATE INDEX "SocialServiceCase_createdAt_idx" ON "SocialServiceCase"("createdAt");
CREATE INDEX "SocialServiceCase_category_idx" ON "SocialServiceCase"("category");
CREATE INDEX "SocialServiceCase_status_idx" ON "SocialServiceCase"("status");
CREATE INDEX "SocialServiceCase_nationalId_idx" ON "SocialServiceCase"("nationalId");
CREATE INDEX "SocialServiceCase_husbandNationalId_idx" ON "SocialServiceCase"("husbandNationalId");
CREATE INDEX "SocialServiceCase_wifeNationalId_idx" ON "SocialServiceCase"("wifeNationalId");
CREATE INDEX "SocialServiceCase_familyBookNumber_idx" ON "SocialServiceCase"("familyBookNumber");
CREATE UNIQUE INDEX "SocialServiceCase_municipalityId_category_nationalId_key" ON "SocialServiceCase"("municipalityId", "category", "nationalId");
CREATE UNIQUE INDEX "SocialServiceCase_municipalityId_category_husbandNationalId_key" ON "SocialServiceCase"("municipalityId", "category", "husbandNationalId");
CREATE UNIQUE INDEX "SocialServiceCase_municipalityId_category_wifeNationalId_key" ON "SocialServiceCase"("municipalityId", "category", "wifeNationalId");
CREATE UNIQUE INDEX "SocialServiceCase_municipalityId_category_familyBookNumber_key" ON "SocialServiceCase"("municipalityId", "category", "familyBookNumber");

CREATE TABLE "new_SocialServiceCaseSerial" (
    "municipalityId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "lastN" INTEGER NOT NULL,
    PRIMARY KEY ("municipalityId", "year"),
    CONSTRAINT "SocialServiceCaseSerial_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SocialServiceCaseSerial" ("municipalityId", "year", "lastN")
SELECT 'mun-migrate-default', "year", "lastN" FROM "SocialServiceCaseSerial";
DROP TABLE "SocialServiceCaseSerial";
ALTER TABLE "new_SocialServiceCaseSerial" RENAME TO "SocialServiceCaseSerial";

CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "phone" TEXT,
    "nationalId" TEXT,
    "notificationEmail" TEXT,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CITIZEN',
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "permManageServices" BOOLEAN NOT NULL DEFAULT false,
    "permManageUsers" BOOLEAN NOT NULL DEFAULT false,
    "permViewStats" BOOLEAN NOT NULL DEFAULT false,
    "municipalityId" TEXT,
    "departmentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "gasArea" TEXT,
    CONSTRAINT "User_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" (
  "id", "email", "phone", "nationalId", "notificationEmail", "passwordHash", "name", "role",
  "isVerified", "isActive", "permManageServices", "permManageUsers", "permViewStats",
  "municipalityId", "departmentId", "createdAt", "updatedAt", "gasArea"
)
SELECT
  "id", "email", "phone", "nationalId", "notificationEmail", "passwordHash", "name",
  CASE WHEN "role" = 'ADMIN' THEN 'SUPER_ADMIN' ELSE "role" END,
  "isVerified", "isActive", "permManageServices", "permManageUsers", "permViewStats",
  CASE WHEN "role" = 'ADMIN' THEN NULL ELSE 'mun-migrate-default' END,
  "departmentId", "createdAt", "updatedAt", "gasArea"
FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE UNIQUE INDEX "User_nationalId_key" ON "User"("nationalId");
CREATE UNIQUE INDEX "User_notificationEmail_key" ON "User"("notificationEmail");
CREATE UNIQUE INDEX "User_municipalityId_gasArea_key" ON "User"("municipalityId", "gasArea");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

CREATE UNIQUE INDEX "Municipality_code_key" ON "Municipality"("code");
