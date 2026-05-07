import "dotenv/config";
import { execSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@libsql/client";

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
  const s = stmt.trimStart();
  if (/^create\s+index\b/i.test(s) && msg.includes("already exists")) return true;
  return false;
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
    return;
  }

  console.log("[prepare-db] remote libsql mode -> applying prisma/migrations via libsql client");
  await applyMigrationsToRemoteLibsql(url);
}

main().catch((e) => {
  console.error("[prepare-db]", e);
  process.exit(1);
});
