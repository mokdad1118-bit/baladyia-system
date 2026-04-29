/**
 * ترقية مستخدم إلى ADMIN + تفعيل كل صلاحيات لوحة الإدارة.
 * الاستخدام: npx tsx scripts/promote-to-admin.ts your@email.com
 * يطابق حقل User.email (بعد toLowerCase في الاستعلام).
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { UserRole } from "../src/generated/prisma/enums";
import { createLibSqlAdapter } from "../src/lib/libsql-adapter";

const emailArg = process.argv[2]?.trim().toLowerCase();
if (!emailArg) {
  console.error("Usage: npx tsx scripts/promote-to-admin.ts user@example.com");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: createLibSqlAdapter() });

async function main() {
  const r = await prisma.user.updateMany({
    where: { email: emailArg },
    data: {
      role: UserRole.ADMIN,
      permManageServices: true,
      permManageUsers: true,
      permViewStats: true,
    },
  });
  console.log("Updated rows:", r.count);
  if (r.count === 0) {
    console.error(
      "No user with this email in User.email. Open Prisma Studio (npx prisma studio) and set email, or match phone/notificationEmail manually.",
    );
    process.exit(1);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
