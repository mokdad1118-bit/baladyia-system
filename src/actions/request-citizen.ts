"use server";

import { revalidatePath } from "next/cache";
import { mkdir } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { acceptsForFileKind } from "@/lib/file-validation";
import { citizenMunicipalityIdOrThrow } from "@/lib/municipality-scope";
import { getStaffToNotify, notifyUsers } from "@/lib/notify";
import { notifEmailOrNull, digitsOnly, isValidWhatsappLength } from "@/lib/phone";
import { nextRequestNumber } from "@/lib/request-serial";
import { UserRole, RequestStatus } from "@/generated/prisma/enums";
import { redirect, unstable_rethrow } from "next/navigation";
import { MAX_CITIZEN_ATTACHMENT_BYTES } from "@/lib/upload-limits";
import { writeOperationLog } from "@/lib/operation-log";

async function defaultAssigneeId(municipalityId: string) {
  const e = await db.user.findFirst({
    where: { isActive: true, role: UserRole.EMPLOYEE, municipalityId },
    orderBy: { createdAt: "asc" },
  });
  return e?.id ?? null;
}

function parseNotifEmail(raw: string):
  | { ok: true; value: string | null }
  | { ok: false; error: string } {
  const t = raw.trim();
  if (!t) return { ok: true, value: null };
  const v = notifEmailOrNull(t);
  if (!v) return { ok: false, error: "بريد الإشعارات غير صالح" };
  return { ok: true, value: v };
}

export async function submitRequest(
  _p: { error?: string } | undefined,
  formData: FormData,
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== UserRole.CITIZEN) {
      return { error: "يجب تسجيل الدخول كمواطن لتقديم الطلب" };
    }

    const serviceId = String(formData.get("serviceId") ?? "");
    if (!serviceId) return { error: "بيانات ناقصة" };

    const fullName = String(formData.get("fullName") ?? "").trim();
    const phoneRaw = String(formData.get("phone") ?? "").trim();
    const phoneNorm = digitsOnly(phoneRaw);
    const notifParsed = parseNotifEmail(String(formData.get("notificationEmail") ?? ""));
    if (!notifParsed.ok) return { error: notifParsed.error };
    const notif = notifParsed.value;

    if (fullName.length < 2) return { error: "يرجى إدخال الاسم الثلاثي" };
    if (!isValidWhatsappLength(phoneNorm)) {
      return { error: "رقم واتساب: أرقام فقط (٨–١٥ رقماً)" };
    }

    const otherPhone = await db.user.findFirst({
      where: {
        phone: phoneNorm,
        id: { not: session.user.id },
      },
    });
    if (otherPhone) {
      return { error: "رقم واتساب مُسجّل لحساب آخر" };
    }

    if (notif) {
      const nTaken = await db.user.findFirst({
        where: {
          notificationEmail: notif,
          id: { not: session.user.id },
        },
      });
      if (nTaken) {
        return { error: "بريد الإشعارات مُسجّل مسبقاً" };
      }
    }

    let municipalityId: string;
    try {
      municipalityId = citizenMunicipalityIdOrThrow(session);
    } catch {
      return { error: "يجب أن يكون حسابك مرتبطاً ببلدية. تواصل مع الدعم أو أعد إنشاء الحساب." };
    }

    const service = await db.service.findFirst({
      where: { id: serviceId, isActive: true, municipalityId },
      include: { documents: { orderBy: { sortOrder: "asc" } } },
    });
    if (!service) return { error: "الخدمة غير متوفرة" };

    const outDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      String(new Date().getUTCFullYear()),
    );
    await mkdir(outDir, { recursive: true });

    const fileRecords: {
      serviceDocumentId: string;
      storedName: string;
      originalName: string;
      mimeType: string;
      size: number;
    }[] = [];

    for (const d of service.documents) {
      const key = `file_${d.id}`;
      const file = formData.get(key) as File | null;
      if (d.isRequired) {
        if (!file || file.size === 0) {
          return { error: `مطلوب: ${d.name}` };
        }
      }
      if (!file || file.size === 0) continue;
      if (file.size > MAX_CITIZEN_ATTACHMENT_BYTES) {
        return {
          error: `${d.name}: حجم الملف كبير جداً (الحد الأقصى ${Math.round(MAX_CITIZEN_ATTACHMENT_BYTES / (1024 * 1024))} ميغابايت لكل ملف).`,
        };
      }
      const mime = file.type || "application/octet-stream";
      const v = acceptsForFileKind(d.fileType, mime);
      if (!v.ok) {
        return { error: `${d.name}: ${v.message}` };
      }
      const ext =
        path.extname((file as File & { name?: string }).name || "") ||
        (mime === "application/pdf" ? ".pdf" : ".bin");
      const stored = `${randomUUID()}${ext}`;
      const full = path.join(outDir, stored);
      await pipeline(
        Readable.fromWeb(file.stream() as unknown as NodeReadableStream),
        createWriteStream(full),
      );
      const rel = `/uploads/${new Date().getUTCFullYear()}/${stored}`;
      fileRecords.push({
        serviceDocumentId: d.id,
        storedName: rel,
        originalName: (file as File & { name?: string }).name || "file",
        mimeType: mime,
        size: file.size,
      });
    }

    const number = await nextRequestNumber(municipalityId);
    const assigneeId = await defaultAssigneeId(municipalityId);
    const staff = await getStaffToNotify(municipalityId);

    const me = await db.user.findFirst({
      where: { id: session.user.id, role: UserRole.CITIZEN, isActive: true },
    });
    if (!me) return { error: "تسجيل دخول المواطنين فقط" };
    await db.user.update({
      where: { id: me.id },
      data: {
        name: fullName,
        phone: phoneNorm,
        notificationEmail: notif,
      },
    });
    const citizenId = me.id;

    const req = await db.request.create({
      data: {
        municipalityId,
        requestNumber: number,
        serviceId: service.id,
        citizenId,
        assigneeId,
        status: RequestStatus.PENDING,
        submittedFullName: fullName,
        submittedPhone: phoneNorm,
        submittedNotificationEmail: notif,
        source: "online",
        formPayload: "{}",
        files: { create: fileRecords },
      },
    });
    await writeOperationLog({
      session,
      municipalityId,
      action: "CREATE",
      module: "REQUESTS",
      title: "تقديم طلب خدمات مدينة",
      description: `تم تقديم الطلب ${number} للخدمة: ${service.name}`,
      entityType: "REQUEST",
      entityId: req.id,
      requestId: req.id,
      metadata: {
        requestNumber: number,
        serviceId: service.id,
        serviceName: service.name,
        citizenId,
        fullName,
        phone: phoneNorm,
        filesCount: fileRecords.length,
      },
    });

    try {
      await notifyUsers({
        userIds: staff,
        type: "REQUEST_SUBMIT",
        title: "طلب جديد",
        message: `وصل طلب رقم ${number} للخدمة: ${service.name}.`,
        municipalityId,
        requestId: req.id,
      });
      await notifyUsers({
        userIds: [citizenId],
        type: "REQUEST_SUBMIT",
        title: "تم استلام الطلب",
        message: `طلبك ${number} قيد المعالجة. يمكنك المتابعة من «طلباتي».`,
        municipalityId,
        requestId: req.id,
      });
    } catch (notifyErr) {
      console.error("[submitRequest] notifyUsers failed after create:", notifyErr);
    }

    revalidatePath("/requests");
    revalidatePath("/notifications");
    revalidatePath("/citizen/requests");
    revalidatePath("/citizen/notifications");
    revalidatePath("/admin/requests");
    revalidatePath("/admin");

    redirect(`/requests?success=1&no=${number}`);
  } catch (e) {
    unstable_rethrow(e);
    console.error("[submitRequest] failed:", e);
    return {
      error:
        "تعذر إرسال الطلب حالياً. تأكد أن كل ملف لا يتجاوز ٥ ميغابايت، وأن إجمال حجم المرفقات معقول، ثم حاول مرة أخرى.",
    };
  }
}
