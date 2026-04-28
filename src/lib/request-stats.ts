import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { RequestStatus } from "@/generated/prisma/enums";

export async function requestCounts(where?: Prisma.RequestWhereInput) {
  const base = where ?? {};
  const [total, pending, underReview, needsModification, completed, rejected] =
    await Promise.all([
      db.request.count({ where: base }),
      db.request.count({
        where: { ...base, status: RequestStatus.PENDING },
      }),
      db.request.count({
        where: { ...base, status: RequestStatus.UNDER_REVIEW },
      }),
      db.request.count({
        where: { ...base, status: RequestStatus.NEEDS_MODIFICATION },
      }),
      db.request.count({
        where: { ...base, status: RequestStatus.COMPLETED },
      }),
      db.request.count({
        where: { ...base, status: RequestStatus.REJECTED },
      }),
    ]);
  return {
    total,
    pending,
    underReview,
    needsModification,
    completed,
    rejected,
  };
}
