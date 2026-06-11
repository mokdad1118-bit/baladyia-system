"use server";

import { mkdir } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { FileKind, UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { getStaffToNotify, notifyUsers } from "@/lib/notify";
import { writeOperationLog } from "@/lib/operation-log";
import { acceptsForFileKind } from "@/lib/file-validation";
import { MAX_CITIZEN_ATTACHMENT_BYTES } from "@/lib/upload-limits";

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

  const image = formData.get("image") as File | null;
  if (!image || image.size === 0) {
    return { error: "يرجى إرفاق صورة مع الشكوى." };
  }
  if (image.size > MAX_CITIZEN_ATTACHMENT_BYTES) {
    return { error: "حجم الصورة كبير جداً." };
  }
  const imageMime = image.type || "application/octet-stream";
  const imageValidation = acceptsForFileKind(FileKind.IMAGE, imageMime);
  if (!imageValidation.ok) {
    return { error: imageValidation.message ?? "المرفق يجب أن يكون صورة." };
  }

  const municipalityId = session.user.municipalityId?.trim();
  if (!municipalityId) {
    return { error: "حسابك غير مرتبط ببلدية. لا يمكن إرسال الملاحظة." };
  }

  const outDir = path.join(process.cwd(), "public", "uploads", "feedback", String(new Date().getUTCFullYear()));
  await mkdir(outDir, { recursive: true });
  const imageExt = path.extname((image as File & { name?: string }).name || "") || ".img";
  const storedImage = `${randomUUID()}${imageExt}`;
  await pipeline(
    Readable.fromWeb(image.stream() as unknown as NodeReadableStream),
    createWriteStream(path.join(outDir, storedImage)),
  );
  const imagePath = `/uploads/feedback/${new Date().getUTCFullYear()}/${storedImage}`;

  const row = await db.citizenFeedback.create({
    data: {
      municipalityId,
      citizenId: session.user.id,
      message,
      imagePath,
      imageOriginal: (image as File & { name?: string }).name || "feedback-image",
      imageMime,
      imageSize: image.size,
    },
  });
  const municipality = await db.municipality.findUnique({
    where: { id: municipalityId },
    select: { name: true },
  });
  const municipalityName = municipality?.name ?? "بلدية غير محددة";
  await writeOperationLog({
    session,
    municipalityId,
    action: "CREATE",
    module: "FEEDBACK",
    title: "إرسال شكوى أو اقتراح",
    description: `تم إرسال شكوى/اقتراح من ${session.user.name ?? "مواطن"}`,
    entityType: "CITIZEN_FEEDBACK",
    entityId: row.id,
    metadata: { message, municipalityName, imagePath },
  });

  try {
    const staff = await getStaffToNotify(municipalityId);
    await notifyUsers({
      userIds: staff,
      type: "FEEDBACK_SUBMITTED",
      title: "شكوى أو اقتراح جديد",
      message: `وصلت ملاحظة من ${session.user.name ?? "مواطن"} - ${municipalityName}: ${message.slice(0, 120)}${message.length > 120 ? "…" : ""}`,
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
