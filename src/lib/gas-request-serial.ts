import { db } from "@/lib/db";

/** GAS-2026-00001 style — لكل بلدية */
export async function nextGasRequestNumber(municipalityId: string) {
  const y = new Date().getUTCFullYear();
  return db.$transaction(async (tx) => {
    const cur = await tx.gasRequestSerial.upsert({
      where: { municipalityId_year: { municipalityId, year: y } },
      create: { municipalityId, year: y, lastN: 0 },
      update: {},
    });
    const n = cur.lastN + 1;
    await tx.gasRequestSerial.update({
      where: { municipalityId_year: { municipalityId, year: y } },
      data: { lastN: n },
    });
    return `GAS-${y}-${String(n).padStart(5, "0")}`;
  });
}
