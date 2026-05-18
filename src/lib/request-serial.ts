import { db } from "./db";

/** REQ-2026-00001 style — لكل بلدية */
export async function nextRequestNumber(municipalityId: string) {
  const y = new Date().getUTCFullYear();
  return db.$transaction(async (tx) => {
    const cur = await tx.requestSerial.upsert({
      where: { municipalityId_year: { municipalityId, year: y } },
      create: { municipalityId, year: y, lastN: 0 },
      update: {},
    });
    const n = cur.lastN + 1;
    await tx.requestSerial.update({
      where: { municipalityId_year: { municipalityId, year: y } },
      data: { lastN: n },
    });
    return `REQ-${y}-${String(n).padStart(5, "0")}`;
  });
}
