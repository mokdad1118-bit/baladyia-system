import path from "node:path";
import { pathToFileURL } from "node:url";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { isPersistentDatabaseConfiguredFromEnv } from "./database-env-guard";

const defaultFileUrl = pathToFileURL(
  path.join(process.cwd(), "prisma", "dev.db"),
).href;

let warnedRemoteWithoutToken = false;

type DatabaseMode = "remote-libsql" | "local-file";

function resolveDatabaseMode(raw: string | undefined): DatabaseMode {
  if (
    raw &&
    (raw.startsWith("libsql://") ||
      raw.startsWith("libsql+") ||
      raw.startsWith("https://"))
  ) {
    return "remote-libsql";
  }
  return "local-file";
}

function normalizeLocalFileUrl(raw: string | undefined): string {
  if (!raw?.startsWith("file:")) return defaultFileUrl;

  const filePath = raw.slice("file:".length);
  if (!filePath || filePath === ":memory:") return raw;

  if (filePath.startsWith("//")) return raw;

  const normalized = filePath.replace(/\\/g, "/");
  const isWindowsAbsolute = /^[a-zA-Z]:\//.test(normalized);
  if (path.isAbsolute(filePath) || isWindowsAbsolute) {
    return pathToFileURL(filePath).href;
  }

  return pathToFileURL(path.resolve(process.cwd(), filePath)).href;
}

/** هل الاتصال الحالي Persistent (قاعدة بعيدة) أم ملف محلي داخل الحاوية؟ */
export function isPersistentDatabaseConfigured(): boolean {
  return isPersistentDatabaseConfiguredFromEnv();
}

/** إعدادات @prisma/adapter-libsql: ملف محلي، أو Turso / LibSQL عن بُعد */
export function createLibSqlAdapter() {
  const raw = process.env.DATABASE_URL?.trim();
  const authToken =
    process.env.TURSO_AUTH_TOKEN?.trim() ||
    process.env.LIBSQL_AUTH_TOKEN?.trim();
  const mode = resolveDatabaseMode(raw);

  if (mode === "remote-libsql" && raw) {
    if (!authToken && !warnedRemoteWithoutToken) {
      warnedRemoteWithoutToken = true;
      console.error(
        "[db] DATABASE_URL يشير إلى LibSQL عن بُعد دون TURSO_AUTH_TOKEN — الاتصال سيفشل.",
      );
    }
    return new PrismaLibSql({
      url: raw,
      authToken: authToken || undefined,
    });
  }

  if (raw?.startsWith("file:")) {
    return new PrismaLibSql({ url: normalizeLocalFileUrl(raw) });
  }

  return new PrismaLibSql({ url: defaultFileUrl });
}
