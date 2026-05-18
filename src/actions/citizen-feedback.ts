"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { getStaffToNotify, notifyUsers } from "@/lib/notify";

export type SubmitCitizenFeedbackState =
  | { error: string }
  | { ok: true; message: string }
  | undefined;

export async function submitCitizenFeedback(
  _prev: SubmitCitizenFeedbackState,
  formData: FormData,
): Promise<SubmitCitizenFeedbackState> {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.CITIZEN) {
    return { error: "يجب تسجيل الدخول كمواطن لإرسال الشكوى أو المقترح." };
  }

  const message = String(formData.get("message") ?? "").trim();
  if (message.length < 10) {
    return { error: "يرجى كتابة ملاحظة أو شكوى واضحة (10 أحرف على الأقل)." };
  }
  if (message.length > 2000) {
    return { error: "النص طويل جداً. الحد الأقصى 2000 حرف." };
  }

  const municipalityId = session.user.municipalityId?.trim();
  if (!municipalityId) {
    return { error: "حسابك غير مرتبط ببلدية. لا يمكن إرسال الملاحظة." };
  }

  const row = await db.citizenFeedback.create({
    data: {
      municipalityId,
      citizenId: session.user.id,
      message,
    },
  });

  try {
    const staff = await getStaffToNotify(municipalityId);
    await notifyUsers({
      userIds: staff,
      type: "FEEDBACK_SUBMITTED",
      title: "شكوى أو اقتراح جديد",
      message: `وصلت ملاحظة من ${session.user.name ?? "مواطن"} (${message.slice(0, 120)}${message.length > 120 ? "…" : ""}).`,
      municipalityId,
      citizenFeedbackId: row.id,
    });
  } catch (e) {
    console.warn("[submitCitizenFeedback] notifyUsers:", e);
  }

  revalidatePath("/admin/citizen-feedback");
  revalidatePath("/citizen/feedback");
  revalidatePath("/feedback");
  revalidatePath("/notifications");
  revalidatePath("/citizen/notifications");

  return { ok: true, message: "شكراً لملاحظاتكم وتعاونكم معنا..." };
}
