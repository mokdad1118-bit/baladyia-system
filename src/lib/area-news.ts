import { db } from "@/lib/db";

export function visibleAreaNewsWhere(municipalityId: string) {
  return {
    isPublished: true,
    OR: [{ municipalityId: null }, { municipalityId }],
  };
}

export async function countUnreadAreaNews(citizenId: string, municipalityId: string) {
  const read = await db.areaNewsRead.findUnique({
    where: { citizenId },
    select: { lastReadAt: true },
  });
  return db.areaNewsPost.count({
    where: {
      ...visibleAreaNewsWhere(municipalityId),
      ...(read?.lastReadAt ? { createdAt: { gt: read.lastReadAt } } : {}),
    },
  });
}

export async function markAreaNewsRead(citizenId: string) {
  await db.areaNewsRead.upsert({
    where: { citizenId },
    create: { citizenId, lastReadAt: new Date() },
    update: { lastReadAt: new Date() },
  });
}
