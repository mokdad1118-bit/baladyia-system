import path from "node:path";
import { pathToFileURL } from "node:url";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const defaultFileUrl = pathToFileURL(
  path.join(process.cwd(), "prisma", "dev.db"),
).href;

/** إعدادات @prisma/adapter-libsql: ملف محلي، أو Turso / LibSQL عن بُعد */
export function createLibSqlAdapter() {
  const raw = process.env.DATABASE_URL?.trim();
  const authToken =
    process.env.TURSO_AUTH_TOKEN?.trim() ||
    process.env.LIBSQL_AUTH_TOKEN?.trim();

  if (
    raw &&
    (raw.startsWith("libsql://") ||
      raw.startsWith("libsql+") ||
      raw.startsWith("https://"))
  ) {
    return new PrismaLibSql({
      url: raw,
      authToken: authToken || undefined,
    });
  }

  if (raw?.startsWith("file:")) {
    return new PrismaLibSql({ url: raw });
  }

  return new PrismaLibSql({ url: defaultFileUrl });
}
