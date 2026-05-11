import { db } from "./db";
import { UserRole } from "@/generated/prisma/enums";

export async function notifyUsers(input: {
  userIds: string[];
  type: string;
  title: string;
  message: string;
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
      requestId: input.requestId,
      gasRequestId: input.gasRequestId,
      returneeRegistrationId: input.returneeRegistrationId,
      socialServiceCaseId: input.socialServiceCaseId,
      citizenFeedbackId: input.citizenFeedbackId,
    })),
  });
}

/** يُبلَغ المديرون + الموظفون المعنيون عند وصول طلب */
export async function getStaffToNotify() {
  const all = await db.user.findMany({
    where: {
      isActive: true,
      role: { in: [UserRole.ADMIN, UserRole.EMPLOYEE] },
    },
    select: { id: true },
  });
  return all.map((u) => u.id);
}
