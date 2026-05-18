import { db } from "@/lib/db";

export async function nextSocialServiceCaseNumber(
  municipalityId: string,
  now = new Date(),
): Promise<string> {
  const year = now.getUTCFullYear();
  const serial = await db.$transaction(async (tx) => {
    const current = await tx.socialServiceCaseSerial.findUnique({
      where: { municipalityId_year: { municipalityId, year } },
    });
    if (!current) {
      await tx.socialServiceCaseSerial.create({ data: { municipalityId, year, lastN: 1 } });
      return 1;
    }
    const updated = await tx.socialServiceCaseSerial.update({
      where: { municipalityId_year: { municipalityId, year } },
      data: { lastN: { increment: 1 } },
      select: { lastN: true },
    });
    return updated.lastN;
  });
  return `SOC-${year}-${String(serial).padStart(5, "0")}`;
}
