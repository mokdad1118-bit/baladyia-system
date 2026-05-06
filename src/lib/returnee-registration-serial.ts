import { db } from "@/lib/db";

/** RET-2026-00001 style */
export async function nextReturneeRegistrationNumber() {
  const y = new Date().getUTCFullYear();
  return db.$transaction(async (tx) => {
    const cur = await tx.returneeRegistrationSerial.upsert({
      where: { year: y },
      create: { year: y, lastN: 0 },
      update: {},
    });
    const n = cur.lastN + 1;
    await tx.returneeRegistrationSerial.update({
      where: { year: y },
      data: { lastN: n },
    });
    return `RET-${y}-${String(n).padStart(5, "0")}`;
  });
}
