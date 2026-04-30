import "dotenv/config";
import { hash } from "bcrypt";
import { PrismaClient } from "../src/generated/prisma/client";
import { UserRole } from "../src/generated/prisma/enums";
import { createLibSqlAdapter } from "../src/lib/libsql-adapter";

const ROUNDS = 10;
const DEFAULT_EMAIL = "admin@bosra.local";
const DEFAULT_PASSWORD = "Admin123";
const DEFAULT_NAME = "مدير النظام";

async function main() {
  const email = (process.env.BOOTSTRAP_ADMIN_EMAIL || DEFAULT_EMAIL).trim().toLowerCase();
  const password = (process.env.BOOTSTRAP_ADMIN_PASSWORD || DEFAULT_PASSWORD).trim();
  const name = (process.env.BOOTSTRAP_ADMIN_NAME || DEFAULT_NAME).trim();
  const resetPassword = process.env.BOOTSTRAP_ADMIN_RESET_PASSWORD === "1";

  if (!email || !password) {
    throw new Error("BOOTSTRAP_ADMIN_EMAIL/BOOTSTRAP_ADMIN_PASSWORD cannot be empty.");
  }

  const prisma = new PrismaClient({
    adapter: createLibSqlAdapter(),
  });

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email,
          name,
          passwordHash: await hash(password, ROUNDS),
          role: UserRole.ADMIN,
          isActive: true,
          permManageServices: true,
          permManageUsers: true,
          permViewStats: true,
        },
      });
      console.log(`[bootstrap-admin] created admin user: ${email}`);
      return;
    }

    await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: UserRole.ADMIN,
        isActive: true,
        permManageServices: true,
        permManageUsers: true,
        permViewStats: true,
        ...(resetPassword ? { passwordHash: await hash(password, ROUNDS) } : {}),
      },
    });
    console.log(
      `[bootstrap-admin] ensured admin user: ${email}${resetPassword ? " (password reset)" : ""}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("[bootstrap-admin]", e);
  process.exit(1);
});
