"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

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

  await db.citizenFeedback.create({
    data: {
      citizenId: session.user.id,
      message,
    },
  });

  revalidatePath("/admin/citizen-feedback");
  revalidatePath("/citizen/feedback");
  revalidatePath("/feedback");

  return { ok: true, message: "شكراً لملاحظاتكم وتعاونكم معنا..." };
}
