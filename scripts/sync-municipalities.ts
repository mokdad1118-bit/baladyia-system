import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { DARAA_MUNICIPALITIES } from "../prisma/daraa-municipalities";
import { MIGRATION_DEFAULT_MUNICIPALITY_ID } from "../src/lib/municipality-constants";
import { createLibSqlAdapter } from "../src/lib/libsql-adapter";

/** مزامنة بلديات محافظة درعا — آمن للتكرار عند كل إقلاع/نشر */
export async function syncDaraaMunicipalities() {
  const prisma = new PrismaClient({ adapter: createLibSqlAdapter() });
  try {
    const seedCodes = DARAA_MUNICIPALITIES.map((m) => m.code);
    const existingSeedCount = await prisma.municipality.count({ where: { code: { in: seedCodes } } });
    const createMissingSeeds = existingSeedCount <= 1;

    for (const m of DARAA_MUNICIPALITIES) {
      const isLegacyBosra = m.code === "bosra-sham";
      const existing = await prisma.municipality.findUnique({ where: { code: m.code } });
      if (existing) {
        await prisma.municipality.update({
          where: { code: m.code },
          data: { name: m.name, sortOrder: m.sortOrder },
        });
      } else if (createMissingSeeds) {
        await prisma.municipality.create({
          data: {
            ...(isLegacyBosra ? { id: MIGRATION_DEFAULT_MUNICIPALITY_ID } : {}),
            code: m.code,
            name: m.name,
            sortOrder: m.sortOrder,
            governorate: "درعا",
          },
        });
      }
    }
    console.log(`[sync-municipalities] synced ${DARAA_MUNICIPALITIES.length} municipalities`);
  } finally {
    await prisma.$disconnect();
  }
}

