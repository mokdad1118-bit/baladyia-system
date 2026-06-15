import "dotenv/config";
import { execSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@libsql/client";
import { syncDaraaMunicipalities } from "./sync-municipalities";
import { MIGRATION_DEFAULT_MUNICIPALITY_ID } from "../src/lib/municipality-constants";

const MULTI_MUNICIPALITY_MIGRATION = "20260518133000_multi_municipality_daraa";

function databaseUrl(): string {
  return process.env.DATABASE_URL?.trim() || "";
}

function isRemoteLibsql(url: string): boolean {
  return url.startsWith("libsql://") || url.startsWith("libsql+") || url.startsWith("https://");
}

function splitSqlStatements(sql: string): string[] {
  return sql
    .split(/;\s*(?:\r?\n|$)/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function migrationErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const any = err as Error & { cause?: { message?: string } };
    const nested = any.cause?.message ?? "";
    return `${err.message} ${nested}`.toLowerCase();
  }
  return String(err).toLowerCase();
}

/** ترحيل سبق تنفيذه جزئياً على LibSQL (إعادة نشر، انقطاع، إلخ) */
function isBenignMigrationConflict(msg: string, stmt: string): boolean {
  if (msg.includes("duplicate column")) return true;
  if (/^create\s+table\b/i.test(stmt.trimStart()) && msg.includes("already exists")) return true;
  const s = stmt.trimStart();
  if (/^create\s+index\b/i.test(s) && msg.includes("already exists")) return true;
  return false;
}

type LibsqlClient = ReturnType<typeof createClient>;

async function tableExists(client: LibsqlClient, table: string) {
  const res = await client.execute({
    sql: "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1",
    args: [table],
  });
  return res.rows.length > 0;
}

async function columnExists(client: LibsqlClient, table: string, column: string) {
  if (!(await tableExists(client, table))) return false;
  const res = await client.execute(`PRAGMA table_info("${table}")`);
  return res.rows.some((row) => String(row.name) === column);
}

async function executeIfTableExists(client: LibsqlClient, table: string, sql: string) {
  if (await tableExists(client, table)) {
    await client.execute(sql);
  }
}

async function executeIgnore(client: LibsqlClient, sql: string) {
  try {
    await client.execute(sql);
  } catch (err) {
    const msg = migrationErrorMessage(err);
    if (
      msg.includes("already exists") ||
      msg.includes("duplicate column") ||
      msg.includes("no such index") ||
      msg.includes("no such table")
    ) {
      console.warn(`[prepare-db] skip idempotent statement: ${sql.slice(0, 120)}...`);
      return;
    }
    throw err;
  }
}

async function addColumnIfMissing(
  client: LibsqlClient,
  table: string,
  column: string,
  definition: string,
) {
  if ((await tableExists(client, table)) && !(await columnExists(client, table, column))) {
    await client.execute(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${definition}`);
  }
}

async function cleanInterruptedTableRebuilds(client: LibsqlClient) {
  const rebuiltTables = [
    "CitizenFeedback",
    "Department",
    "GasRequest",
    "GasRequestSerial",
    "Notification",
    "OperationLog",
    "PendingCitizenRegistration",
    "Request",
    "RequestSerial",
    "ReturneeRegistration",
    "ReturneeRegistrationSerial",
    "Service",
    "SocialServiceCase",
    "SocialServiceCaseSerial",
    "User",
  ];

  for (const table of rebuiltTables) {
    const temp = `new_${table}`;
    const hasBase = await tableExists(client, table);
    const hasTemp = await tableExists(client, temp);
    if (hasBase && hasTemp) {
      await client.execute(`DROP TABLE "${temp}"`);
    } else if (!hasBase && hasTemp) {
      await client.execute(`ALTER TABLE "${temp}" RENAME TO "${table}"`);
    }
  }
}

async function ensureSerialTable(client: LibsqlClient, table: string) {
  if (!(await tableExists(client, table))) {
    await client.execute(`
      CREATE TABLE "${table}" (
        "municipalityId" TEXT NOT NULL,
        "year" INTEGER NOT NULL,
        "lastN" INTEGER NOT NULL,
        PRIMARY KEY ("municipalityId", "year")
      )
    `);
    return;
  }

  if (!(await columnExists(client, table, "municipalityId"))) {
    await client.execute(`ALTER TABLE "${table}" RENAME TO "old_${table}"`);
    await client.execute(`
      CREATE TABLE "${table}" (
        "municipalityId" TEXT NOT NULL,
        "year" INTEGER NOT NULL,
        "lastN" INTEGER NOT NULL,
        PRIMARY KEY ("municipalityId", "year")
      )
    `);
    await client.execute(`
      INSERT INTO "${table}" ("municipalityId", "year", "lastN")
      SELECT '${MIGRATION_DEFAULT_MUNICIPALITY_ID}', "year", "lastN" FROM "old_${table}"
    `);
    await client.execute(`DROP TABLE "old_${table}"`);
  }
}

async function applyRemoteMultiMunicipalityMigration(client: LibsqlClient) {
  await cleanInterruptedTableRebuilds(client);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS "Municipality" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "governorate" TEXT NOT NULL DEFAULT 'درعا',
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await client.execute(`
    INSERT OR IGNORE INTO "Municipality"
      ("id", "name", "code", "governorate", "sortOrder", "isActive", "createdAt", "updatedAt")
    VALUES
      ('${MIGRATION_DEFAULT_MUNICIPALITY_ID}', 'بصرى الشام', 'bosra-sham', 'درعا', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  await addColumnIfMissing(client, "User", "municipalityId", "TEXT");
  await addColumnIfMissing(client, "User", "permViewRequests", "BOOLEAN NOT NULL DEFAULT false");
  await addColumnIfMissing(client, "User", "permManageGas", "BOOLEAN NOT NULL DEFAULT false");
  await addColumnIfMissing(client, "User", "permManageGasInventory", "BOOLEAN NOT NULL DEFAULT false");
  await addColumnIfMissing(client, "User", "permManageSocialServices", "BOOLEAN NOT NULL DEFAULT false");
  await addColumnIfMissing(client, "User", "permManageInPersonRequests", "BOOLEAN NOT NULL DEFAULT false");
  await addColumnIfMissing(client, "ReturneeRegistration", "source", "TEXT NOT NULL DEFAULT 'online'");
  await addColumnIfMissing(client, "SocialServiceCase", "source", "TEXT NOT NULL DEFAULT 'online'");
  await addColumnIfMissing(client, "User", "permManageCitizenFeedback", "BOOLEAN NOT NULL DEFAULT false");
  await addColumnIfMissing(client, "User", "permViewCitizens", "BOOLEAN NOT NULL DEFAULT false");
  await addColumnIfMissing(client, "User", "permViewOperationLog", "BOOLEAN NOT NULL DEFAULT false");
  await addColumnIfMissing(client, "User", "gasCylinderStock", "INTEGER NOT NULL DEFAULT 0");
  await addColumnIfMissing(client, "Department", "municipalityId", `TEXT NOT NULL DEFAULT '${MIGRATION_DEFAULT_MUNICIPALITY_ID}'`);
  await addColumnIfMissing(client, "Service", "municipalityId", `TEXT NOT NULL DEFAULT '${MIGRATION_DEFAULT_MUNICIPALITY_ID}'`);
  await addColumnIfMissing(client, "Request", "municipalityId", `TEXT NOT NULL DEFAULT '${MIGRATION_DEFAULT_MUNICIPALITY_ID}'`);
  await addColumnIfMissing(client, "Request", "source", `TEXT NOT NULL DEFAULT 'online'`);
  await addColumnIfMissing(client, "AreaNewsComment", "parentCommentId", "TEXT");
  await addColumnIfMissing(client, "Notification", "municipalityId", "TEXT");
  await addColumnIfMissing(client, "CitizenFeedback", "municipalityId", `TEXT NOT NULL DEFAULT '${MIGRATION_DEFAULT_MUNICIPALITY_ID}'`);
  await addColumnIfMissing(client, "PendingCitizenRegistration", "municipalityId", `TEXT NOT NULL DEFAULT '${MIGRATION_DEFAULT_MUNICIPALITY_ID}'`);
  await addColumnIfMissing(client, "GasRequest", "municipalityId", `TEXT NOT NULL DEFAULT '${MIGRATION_DEFAULT_MUNICIPALITY_ID}'`);
  await addColumnIfMissing(client, "ReturneeRegistration", "municipalityId", `TEXT NOT NULL DEFAULT '${MIGRATION_DEFAULT_MUNICIPALITY_ID}'`);
  await addColumnIfMissing(client, "SocialServiceCase", "municipalityId", `TEXT NOT NULL DEFAULT '${MIGRATION_DEFAULT_MUNICIPALITY_ID}'`);

  await executeIfTableExists(
    client,
    "User",
    `UPDATE "User" SET "role" = 'SUPER_ADMIN' WHERE "role" = 'ADMIN'`,
  );
  await executeIfTableExists(
    client,
    "User",
    `UPDATE "User" SET "municipalityId" = '${MIGRATION_DEFAULT_MUNICIPALITY_ID}' WHERE "municipalityId" IS NULL AND "role" <> 'SUPER_ADMIN'`,
  );
  await executeIfTableExists(
    client,
    "User",
    `UPDATE "User" SET "permViewRequests" = true, "permManageGas" = true, "permManageGasInventory" = true, "permManageSocialServices" = true, "permManageCitizenFeedback" = true, "permViewCitizens" = true, "permViewOperationLog" = true WHERE "role" IN ('SUPER_ADMIN', 'MUNICIPALITY_ADMIN')`,
  );

  await client.execute(`
    CREATE TABLE IF NOT EXISTS "OperationLog" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "municipalityId" TEXT,
      "actorId" TEXT,
      "action" TEXT NOT NULL,
      "module" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "description" TEXT NOT NULL DEFAULT '',
      "entityType" TEXT,
      "entityId" TEXT,
      "requestId" TEXT,
      "metadataJson" TEXT NOT NULL DEFAULT '{}',
      "ipAddress" TEXT,
      "userAgent" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS "AreaNewsCommentReply" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "postId" TEXT NOT NULL,
      "commentId" TEXT NOT NULL,
      "municipalityId" TEXT NOT NULL,
      "adminId" TEXT NOT NULL,
      "body" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await executeIfTableExists(
    client,
    "Department",
    `UPDATE "Department" SET "municipalityId" = '${MIGRATION_DEFAULT_MUNICIPALITY_ID}' WHERE "municipalityId" IS NULL OR "municipalityId" = ''`,
  );
  await executeIfTableExists(
    client,
    "Service",
    `UPDATE "Service" SET "municipalityId" = '${MIGRATION_DEFAULT_MUNICIPALITY_ID}' WHERE "municipalityId" IS NULL OR "municipalityId" = ''`,
  );

  await ensureSerialTable(client, "RequestSerial");
  await ensureSerialTable(client, "GasRequestSerial");
  await ensureSerialTable(client, "ReturneeRegistrationSerial");
  await ensureSerialTable(client, "SocialServiceCaseSerial");

  await executeIgnore(client, `DROP INDEX IF EXISTS "Department_code_key"`);
  await executeIgnore(client, `DROP INDEX IF EXISTS "User_gasArea_key"`);
  await executeIgnore(client, `DROP INDEX IF EXISTS "SocialServiceCase_category_nationalId_key"`);
  await executeIgnore(client, `DROP INDEX IF EXISTS "SocialServiceCase_category_husbandNationalId_key"`);
  await executeIgnore(client, `DROP INDEX IF EXISTS "SocialServiceCase_category_wifeNationalId_key"`);
  await executeIgnore(client, `DROP INDEX IF EXISTS "SocialServiceCase_category_familyBookNumber_key"`);

  const indexes = [
    `CREATE UNIQUE INDEX IF NOT EXISTS "Municipality_code_key" ON "Municipality"("code")`,
    `CREATE INDEX IF NOT EXISTS "CitizenFeedback_municipalityId_idx" ON "CitizenFeedback"("municipalityId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Department_municipalityId_code_key" ON "Department"("municipalityId", "code")`,
    `CREATE INDEX IF NOT EXISTS "GasRequest_municipalityId_idx" ON "GasRequest"("municipalityId")`,
    `CREATE INDEX IF NOT EXISTS "Notification_municipalityId_idx" ON "Notification"("municipalityId")`,
    `CREATE INDEX IF NOT EXISTS "OperationLog_municipalityId_idx" ON "OperationLog"("municipalityId")`,
    `CREATE INDEX IF NOT EXISTS "OperationLog_actorId_idx" ON "OperationLog"("actorId")`,
    `CREATE INDEX IF NOT EXISTS "OperationLog_requestId_idx" ON "OperationLog"("requestId")`,
    `CREATE INDEX IF NOT EXISTS "OperationLog_action_idx" ON "OperationLog"("action")`,
    `CREATE INDEX IF NOT EXISTS "OperationLog_module_idx" ON "OperationLog"("module")`,
    `CREATE INDEX IF NOT EXISTS "OperationLog_createdAt_idx" ON "OperationLog"("createdAt")`,
    `CREATE INDEX IF NOT EXISTS "OperationLog_entityType_entityId_idx" ON "OperationLog"("entityType", "entityId")`,
    `CREATE INDEX IF NOT EXISTS "AreaNewsCommentReply_postId_idx" ON "AreaNewsCommentReply"("postId")`,
    `CREATE INDEX IF NOT EXISTS "AreaNewsCommentReply_commentId_idx" ON "AreaNewsCommentReply"("commentId")`,
    `CREATE INDEX IF NOT EXISTS "AreaNewsCommentReply_municipalityId_idx" ON "AreaNewsCommentReply"("municipalityId")`,
    `CREATE INDEX IF NOT EXISTS "AreaNewsCommentReply_adminId_idx" ON "AreaNewsCommentReply"("adminId")`,
    `CREATE INDEX IF NOT EXISTS "AreaNewsCommentReply_createdAt_idx" ON "AreaNewsCommentReply"("createdAt")`,
    `CREATE INDEX IF NOT EXISTS "Request_municipalityId_idx" ON "Request"("municipalityId")`,
    `CREATE INDEX IF NOT EXISTS "ReturneeRegistration_municipalityId_idx" ON "ReturneeRegistration"("municipalityId")`,
    `CREATE INDEX IF NOT EXISTS "Service_municipalityId_idx" ON "Service"("municipalityId")`,
    `CREATE INDEX IF NOT EXISTS "SocialServiceCase_municipalityId_idx" ON "SocialServiceCase"("municipalityId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_municipalityId_gasArea_key" ON "User"("municipalityId", "gasArea")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "SocialServiceCase_municipalityId_category_nationalId_key" ON "SocialServiceCase"("municipalityId", "category", "nationalId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "SocialServiceCase_municipalityId_category_husbandNationalId_key" ON "SocialServiceCase"("municipalityId", "category", "husbandNationalId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "SocialServiceCase_municipalityId_category_wifeNationalId_key" ON "SocialServiceCase"("municipalityId", "category", "wifeNationalId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "SocialServiceCase_municipalityId_category_familyBookNumber_key" ON "SocialServiceCase"("municipalityId", "category", "familyBookNumber")`,
  ];

  for (const sql of indexes) {
    const tableMatch = sql.match(/ON\s+"([^"]+)"/i);
    if (!tableMatch || (await tableExists(client, tableMatch[1]))) {
      await executeIgnore(client, sql);
    }
  }
}

async function applyMigrationsToRemoteLibsql(url: string) {
  const authToken =
    process.env.TURSO_AUTH_TOKEN?.trim() || process.env.LIBSQL_AUTH_TOKEN?.trim();
  if (!authToken) {
    throw new Error(
      "DATABASE_URL is remote libsql but TURSO_AUTH_TOKEN/LIBSQL_AUTH_TOKEN is missing.",
    );
  }

  const client = createClient({ url, authToken });
  const migrationsRoot = path.join(process.cwd(), "prisma", "migrations");
  const entries = await readdir(migrationsRoot, { withFileTypes: true });
  const dirs = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));

  await client.execute(
    "CREATE TABLE IF NOT EXISTS _app_migrations (name TEXT PRIMARY KEY, appliedAt TEXT NOT NULL)",
  );

  for (const dir of dirs) {
    const sqlPath = path.join(migrationsRoot, dir, "migration.sql");
    const sql = await readFile(sqlPath, "utf8");
    const exists = await client.execute({
      sql: "SELECT name FROM _app_migrations WHERE name = ? LIMIT 1",
      args: [dir],
    });
    if (exists.rows.length > 0) continue;

    if (dir === MULTI_MUNICIPALITY_MIGRATION) {
      await applyRemoteMultiMunicipalityMigration(client);
      await client.execute({
        sql: "INSERT OR IGNORE INTO _app_migrations (name, appliedAt) VALUES (?, ?)",
        args: [dir, new Date().toISOString()],
      });
      console.log(`[prepare-db] applied remote migration: ${dir}`);
      continue;
    }

    const statements = splitSqlStatements(sql);
    if (statements.length === 0) continue;

    try {
      for (const stmt of statements) {
        try {
          await client.execute(stmt);
        } catch (stmtErr: unknown) {
          const msg = migrationErrorMessage(stmtErr);
          if (isBenignMigrationConflict(msg, stmt)) {
            console.warn(`[prepare-db] skip statement (already applied): ${stmt.slice(0, 120)}…`);
            continue;
          }
          throw stmtErr;
        }
      }
      await client.execute({
        sql: "INSERT INTO _app_migrations (name, appliedAt) VALUES (?, ?)",
        args: [dir, new Date().toISOString()],
      });
      console.log(`[prepare-db] applied remote migration: ${dir}`);
    } catch (e) {
      console.error(`[prepare-db] failed migration: ${dir}`);
      throw e;
    }
  }

  client.close();
}

async function main() {
  const url = databaseUrl();
  if (!url || !isRemoteLibsql(url)) {
    console.log("[prepare-db] local sqlite mode -> prisma migrate deploy");
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
    await syncDaraaMunicipalities();
    if (process.env.RUN_DB_SEED_ON_START === "1") {
      console.log("[prepare-db] RUN_DB_SEED_ON_START=1 -> prisma db seed");
      execSync("npx prisma db seed", { stdio: "inherit" });
    }
    return;
  }

  console.log("[prepare-db] remote libsql mode -> applying prisma/migrations via libsql client");
  await applyMigrationsToRemoteLibsql(url);
  await syncDaraaMunicipalities();
  if (process.env.RUN_DB_SEED_ON_START === "1") {
    console.log("[prepare-db] RUN_DB_SEED_ON_START=1 -> prisma db seed");
    execSync("npx prisma db seed", { stdio: "inherit" });
  }
}

main().catch((e) => {
  console.error("[prepare-db]", e);
  process.exit(1);
});
