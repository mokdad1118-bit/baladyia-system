import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { DARAA_MUNICIPALITIES } from "../prisma/daraa-municipalities";
import { MIGRATION_DEFAULT_MUNICIPALITY_ID } from "../src/lib/municipality-constants";
import { createLibSqlAdapter } from "../src/lib/libsql-adapter";

/** مزامنة بلديات محافظة درعا — آمن للتكرار عند كل إقلاع/نشر */
export async function syncDaraaMunicipalities() {
  const prisma = new PrismaClient({ adapter: createLibSqlAdapter() });
  try {
    for (const m of DARAA_MUNICIPALITIES) {
      const isLegacyBosra = m.code === "bosra-sham";
      await prisma.municipality.upsert({
        where: { code: m.code },
        create: {
          ...(isLegacyBosra ? { id: MIGRATION_DEFAULT_MUNICIPALITY_ID } : {}),
          code: m.code,
          name: m.name,
          sortOrder: m.sortOrder,
          governorate: "درعا",
        },
        update: { name: m.name, sortOrder: m.sortOrder, isActive: true },
      });
    }
    console.log(`[sync-municipalities] synced ${DARAA_MUNICIPALITIES.length} municipalities`);
  } finally {
    await prisma.$disconnect();
  }
}

