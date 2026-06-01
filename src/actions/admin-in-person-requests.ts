"use server";

import { mkdir } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { acceptsForFileKind } from "@/lib/file-validation";
import { MAX_CITIZEN_ATTACHMENT_BYTES } from "@/lib/upload-limits";
import { assertStaffCanAccessMunicipality } from "@/lib/municipality-scope";
import { getStaffToNotify, notifyUsers } from "@/lib/notify";
import { digitsOnly, isValidWhatsappLength, notifEmailOrNull } from "@/lib/phone";
import { hashPassword } from "@/lib/password";
import { nextRequestNumber } from "@/lib/request-serial";
import { writeOperationLog } from "@/lib/operation-log";
import { RequestStatus, UserRole } from "@/generated/prisma/enums";

async function defaultAssigneeId(municipalityId: string) {
  const e = await db.user.findFirst({
    where: { isActive: true, role: UserRole.EMPLOYEE, municipalityId },
    orderBy: { createdAt: "asc" },
  });
  return e?.id ?? null;
}

function parseEmail(raw: string): string | null {
  return notifEmailOrNull(raw.trim()) ?? null;
}

async function resolveCitizen(input: {
  municipalityId: string;
  fullName: string;
  phone: string;
  nationalId: string;
  notificationEmail: string | null;
}) {
  const byNationalId = await db.user.findFirst({
    where: { role: UserRole.CITIZEN, nationalId: input.nationalId },
  });
  const byPhone = await db.user.findFirst({
    where: { role: UserRole.CITIZEN, phone: input.phone },
  });
  const existing = byNationalId ?? byPhone;

  if (byNationalId && byPhone && byNationalId.id !== byPhone.id) {
    return { error: "الرقم الوطني ورقم الواتساب مسجلان لحسابين مختلفين." };
  }
  if (existing && existing.municipalityId && existing.municipalityId !== input.municipalityId) {
    return { error: "حساب المواطن مسجل ضمن بلدية أخرى." };
  }

  if (existing) {
    const updated = await db.user.update({
      where: { id: existing.id },
      data: {
        name: input.fullName,
        phone: input.phone,
        nationalId: input.nationalId,
        notificationEmail: input.notificationEmail,
        municipalityId: input.municipalityId,
      },
    });
    return { citizen: updated };
  }

  const passwordHash = await hashPassword(randomUUID());
  const created = await db.user.create({
    data: {
      name: input.fullName,
      phone: input.phone,
      nationalId: input.nationalId,
      notificationEmail: input.notificationEmail,
      passwordHash,
      role: UserRole.CITIZEN,
      isVerified: true,
      isActive: true,
      municipalityId: input.municipalityId,
    },
  });
  return { citizen: created };
}

export async function submitInPersonRequest(
  _p: { error?: string } | undefined,
  formData: FormData,
) {
  try {
    const session = await auth();
    if (!session?.user) return { error: "يجب تسجيل الدخول." };

    const serviceId = String(formData.get("serviceId") ?? "").trim();
    const fullName = String(formData.get("fullName") ?? "").trim();
    const phone = digitsOnly(String(formData.get("phone") ?? ""));
    const nationalId = digitsOnly(String(formData.get("nationalId") ?? ""));
    const notificationEmailRaw = String(formData.get("notificationEmail") ?? "").trim();
    const notificationEmail = notificationEmailRaw ? parseEmail(notificationEmailRaw) : null;

    if (!serviceId) return { error: "يرجى اختيار الخدمة." };
    if (fullName.length < 2) return { error: "يرجى إدخال اسم المواطن." };
    if (!isValidWhatsappLength(phone)) return { error: "رقم الواتساب غير صالح." };
    if (nationalId.length < 8 || nationalId.length > 20) return { error: "الرقم الوطني غير صالح." };
    if (notificationEmailRaw && !notificationEmail) return { error: "بريد الإشعارات غير صالح." };

    const service = await db.service.findFirst({
      where: { id: serviceId, isActive: true },
      include: { documents: { orderBy: { sortOrder: "asc" } }, municipality: { select: { id: true, name: true } } },
    });
    if (!service) return { error: "الخدمة غير متوفرة." };

    try {
      assertStaffCanAccessMunicipality(session, service.municipalityId);
    } catch {
      return { error: "لا تملك صلاحية إنشاء طلب لهذه البلدية." };
    }

    const resolvedCitizen = await resolveCitizen({
      municipalityId: service.municipalityId,
      fullName,
      phone,
      nationalId,
      notificationEmail,
    });
    if ("error" in resolvedCitizen) return { error: resolvedCitizen.error };

    const outDir = path.join(process.cwd(), "public", "uploads", String(new Date().getUTCFullYear()));
    await mkdir(outDir, { recursive: true });

    const fileRecords: {
      serviceDocumentId: string;
      storedName: string;
      originalName: string;
      mimeType: string;
      size: number;
    }[] = [];

    for (const d of service.documents) {
      const file = formData.get(`file_${d.id}`) as File | null;
      if (d.isRequired && (!file || file.size === 0)) return { error: `مطلوب: ${d.name}` };
      if (!file || file.size === 0) continue;
      if (file.size > MAX_CITIZEN_ATTACHMENT_BYTES) {
        return { error: `${d.name}: حجم الملف كبير جداً.` };
      }
      const mime = file.type || "application/octet-stream";
      const v = acceptsForFileKind(d.fileType, mime);
      if (!v.ok) return { error: `${d.name}: ${v.message}` };

      const ext = path.extname((file as File & { name?: string }).name || "") || (mime === "application/pdf" ? ".pdf" : ".bin");
      const stored = `${randomUUID()}${ext}`;
      await pipeline(
        Readable.fromWeb(file.stream() as unknown as NodeReadableStream),
        createWriteStream(path.join(outDir, stored)),
      );
      fileRecords.push({
        serviceDocumentId: d.id,
        storedName: `/uploads/${new Date().getUTCFullYear()}/${stored}`,
        originalName: (file as File & { name?: string }).name || "file",
        mimeType: mime,
        size: file.size,
      });
    }

    const number = await nextRequestNumber(service.municipalityId);
    const assigneeId = await defaultAssigneeId(service.municipalityId);
    const req = await db.request.create({
      data: {
        municipalityId: service.municipalityId,
        requestNumber: number,
        serviceId: service.id,
        citizenId: resolvedCitizen.citizen.id,
        assigneeId,
        status: RequestStatus.PENDING,
        submittedFullName: fullName,
        submittedPhone: phone,
        submittedNotificationEmail: notificationEmail,
        source: "in_person",
        formPayload: "{}",
        files: { create: fileRecords },
      },
    });

    await writeOperationLog({
      session,
      municipalityId: service.municipalityId,
      action: "CREATE",
      module: "REQUESTS",
      title: "إنشاء طلب حضوري",
      description: `تم إنشاء الطلب الحضوري ${number} للخدمة: ${service.name}`,
      entityType: "REQUEST",
      entityId: req.id,
      requestId: req.id,
      metadata: {
        source: "in_person",
        requestNumber: number,
        serviceId: service.id,
        serviceName: service.name,
        citizenId: resolvedCitizen.citizen.id,
        filesCount: fileRecords.length,
      },
    });

    try {
      await notifyUsers({
        userIds: await getStaffToNotify(service.municipalityId),
        type: "REQUEST_SUBMIT",
        title: "طلب حضوري جديد",
        message: `تم إنشاء طلب حضوري رقم ${number} للخدمة: ${service.name}.`,
        municipalityId: service.municipalityId,
        requestId: req.id,
      });
    } catch (e) {
      console.error("[submitInPersonRequest] notifyUsers failed", e);
    }

    revalidatePath("/admin/requests");
    revalidatePath("/admin/services/in-person");
    redirect(`/admin/requests?source=in_person&success=1&no=${encodeURIComponent(number)}`);
  } catch (e) {
    unstable_rethrow(e);
    console.error("[submitInPersonRequest] failed:", e);
    return { error: "تعذر حفظ الطلب الحضوري حالياً. تحقق من البيانات والمرفقات ثم حاول مرة أخرى." };
  }
}
