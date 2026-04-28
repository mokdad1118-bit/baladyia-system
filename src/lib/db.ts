import { PrismaClient } from "@/generated/prisma/client";
import { createLibSqlAdapter } from "@/lib/libsql-adapter";

const globalFor = globalThis as unknown as { prisma: PrismaClient | undefined };

export const db: PrismaClient =
  globalFor.prisma ??
  new PrismaClient({
    adapter: createLibSqlAdapter(),
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalFor.prisma = db;
