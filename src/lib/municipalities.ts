import { db } from "@/lib/db";

/** بلديات محافظة درعا النشطة — للنماذج والقوائم */
export async function listActiveMunicipalities() {
  return db.municipality.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, code: true },
  });
}

export async function getMunicipalityNameById(id: string | null | undefined) {
  const trimmed = id?.trim();
  if (!trimmed) return null;
  const row = await db.municipality.findFirst({
    where: { id: trimmed },
    select: { name: true },
  });
  return row?.name ?? null;
}
