"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { notifyUsers } from "@/lib/notify";

export type ReplyToCitizenFeedbackState = { error: string } | { ok: true } | undefined;

export async function replyToCitizenFeedback(
  _prev: ReplyToCitizenFeedbackState,
  formData: FormData,
): Promise<ReplyToCitizenFeedbackState> {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return { error: "غير مصرح." };
  }

  const feedbackId = String(formData.get("feedbackId") ?? "").trim();
  const reply = String(formData.get("reply") ?? "").trim();
  if (!feedbackId) return { error: "معرّف الشكوى غير صالح." };
  if (reply.length < 5) return { error: "يرجى كتابة رد واضح (5 أحرف على الأقل)." };
  if (reply.length > 2000) return { error: "الرد طويل جداً. الحد الأقصى 2000 حرف." };

  const row = await db.citizenFeedback.findUnique({
    where: { id: feedbackId },
    select: { id: true, citizenId: true, adminReply: true },
  });
  if (!row) return { error: "الشكوى غير موجودة." };

  const isUpdate = Boolean(row.adminReply?.trim());

  await db.citizenFeedback.update({
    where: { id: feedbackId },
    data: {
      adminReply: reply,
      adminReplyAt: new Date(),
      adminRepliedById: session.user.id,
    },
  });

  try {
    await notifyUsers({
      userIds: [row.citizenId],
      type: "FEEDBACK_REPLY",
      title: isUpdate ? "تحديث رد الإدارة على شكواك" : "رد الإدارة على شكواك أو مقترحك",
      message: reply,
      citizenFeedbackId: row.id,
    });
  } catch (e) {
    console.warn("[replyToCitizenFeedback] notifyUsers:", e);
  }

  revalidatePath("/admin/citizen-feedback");
  revalidatePath("/citizen/feedback");
  revalidatePath("/feedback");
  revalidatePath("/notifications");
  revalidatePath("/citizen/notifications");

  return { ok: true };
}
