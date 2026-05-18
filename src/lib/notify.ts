import { db } from "./db";
import { UserRole } from "@/generated/prisma/enums";

export async function notifyUsers(input: {
  userIds: string[];
  type: string;
  title: string;
  message: string;
  municipalityId?: string | null;
  requestId?: string;
  gasRequestId?: string;
  returneeRegistrationId?: string;
  socialServiceCaseId?: string;
  citizenFeedbackId?: string;
}) {
  if (input.userIds.length === 0) return;
  await db.notification.createMany({
    data: input.userIds.map((userId) => ({
      userId,
      type: input.type,
      title: input.title,
      message: input.message,
      municipalityId: input.municipalityId ?? null,
      requestId: input.requestId,
      gasRequestId: input.gasRequestId,
      returneeRegistrationId: input.returneeRegistrationId,
      socialServiceCaseId: input.socialServiceCaseId,
      citizenFeedbackId: input.citizenFeedbackId,
    })),
  });
}

/** يُبلَغ موظفو البلدية + مديرها + مشرفو المحافظة عند وصول طلب */
export async function getStaffToNotify(municipalityId: string) {
  const [local, supers] = await Promise.all([
    db.user.findMany({
      where: {
        isActive: true,
        municipalityId,
        role: { in: [UserRole.MUNICIPALITY_ADMIN, UserRole.EMPLOYEE] },
      },
      select: { id: true },
    }),
    db.user.findMany({
      where: { isActive: true, role: UserRole.SUPER_ADMIN },
      select: { id: true },
    }),
  ]);
  return [...local, ...supers].map((u) => u.id);
}
