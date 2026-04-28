import { db } from "./db";

/** REQ-2026-00001 style */
export async function nextRequestNumber() {
  const y = new Date().getUTCFullYear();
  return db.$transaction(async (tx) => {
    const cur = await tx.requestSerial.upsert({
      where: { year: y },
      create: { year: y, lastN: 0 },
      update: {},
    });
    const n = cur.lastN + 1;
    await tx.requestSerial.update({
      where: { year: y },
      data: { lastN: n },
    });
    return `REQ-${y}-${String(n).padStart(5, "0")}`;
  });
}
