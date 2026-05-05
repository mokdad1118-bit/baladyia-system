import { db } from "@/lib/db";

/** GAS-2026-00001 style */
export async function nextGasRequestNumber() {
  const y = new Date().getUTCFullYear();
  return db.$transaction(async (tx) => {
    const cur = await tx.gasRequestSerial.upsert({
      where: { year: y },
      create: { year: y, lastN: 0 },
      update: {},
    });
    const n = cur.lastN + 1;
    await tx.gasRequestSerial.update({
      where: { year: y },
      data: { lastN: n },
    });
    return `GAS-${y}-${String(n).padStart(5, "0")}`;
  });
}
