"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { isSuperAdminRole } from "@/lib/roles";
import { writeOperationLog } from "@/lib/operation-log";

const DARAA_ONESIGNAL_APP_ID = "30f2deb1-debf-4b7c-80c0-0d11dd28f01d";

export type BroadcastNotificationState =
  | { ok: true; message: string }
  | { error: string }
  | undefined;

type TargetRole = "citizen" | "municipality_admin" | "governorate_admin";

function cleanText(value: FormDataEntryValue | null, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

function normalizeTargetRole(value: string): TargetRole | null {
  if (value === "citizen" || value === "municipality_admin" || value === "governorate_admin") return value;
  return null;
}

function resolveOpenUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (!value.startsWith("/")) return null;
  const base = process.env.AUTH_URL?.trim() || process.env.NEXTAUTH_URL?.trim() || "";
  if (!base) return value;
  return new URL(value, base).toString();
}

function tagFilter(key: string, value: string) {
  return { field: "tag", key, relation: "=", value };
}

function andFilter() {
  return { operator: "AND" };
}

function buildFilters(targetRole: TargetRole, municipalityId: string | null) {
  const filters: Array<Record<string, string>> = [
    tagFilter("governorate", "daraa"),
    andFilter(),
    tagFilter("role", targetRole),
  ];
  if (municipalityId) {
    filters.push(andFilter(), tagFilter("municipalityId", municipalityId));
  }
  return filters;
}

export async function sendBroadcastNotification(
  _prev: BroadcastNotificationState,
  formData: FormData,
): Promise<BroadcastNotificationState> {
  const session = await auth();
  if (!session?.user) return { error: "غير مصرح." };

  const isGovernorateAdmin = isSuperAdminRole(session.user.role);
  const isMunicipalityAdmin = session.user.role === UserRole.MUNICIPALITY_ADMIN;
  if (!isGovernorateAdmin && !isMunicipalityAdmin) return { error: "هذه الصفحة مخصصة للمديرين فقط." };

  const title = cleanText(formData.get("title"), 80);
  const message = cleanText(formData.get("message"), 240);
  const imageUrl = cleanText(formData.get("imageUrl"), 500) || null;
  const openUrl = resolveOpenUrl(cleanText(formData.get("openUrl"), 500));
  const targetRole = normalizeTargetRole(cleanText(formData.get("targetRole"), 40));
  const scope = cleanText(formData.get("targetScope"), 40);
  let municipalityId = cleanText(formData.get("municipalityId"), 120) || null;

  if (!title) return { error: "أدخل عنوان الإشعار." };
  if (!message) return { error: "أدخل وصف الإشعار." };
  if (!targetRole) return { error: "نوع المستخدم غير صالح." };
  if (imageUrl && !/^https?:\/\//i.test(imageUrl)) return { error: "رابط الصورة يجب أن يبدأ بـ http أو https." };
  if (openUrl === null && cleanText(formData.get("openUrl"), 500)) {
    return { error: "رابط الفتح يجب أن يكون رابطاً داخلياً يبدأ بـ / أو رابطاً كاملاً." };
  }

  if (isMunicipalityAdmin) {
    if (targetRole !== "citizen") return { error: "مدير البلدية يستطيع إرسال إشعارات للمواطنين فقط." };
    municipalityId = session.user.municipalityId?.trim() || null;
    if (!municipalityId) return { error: "حسابك غير مرتبط ببلدية." };
  } else if (scope === "all") {
    municipalityId = null;
  } else if (!municipalityId) {
    return { error: "اختر البلدية أو جميع المواطنين." };
  }

  if (municipalityId) {
    const municipality = await db.municipality.findUnique({ where: { id: municipalityId }, select: { id: true } });
    if (!municipality) return { error: "البلدية غير موجودة." };
  }

  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID?.trim() || DARAA_ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY?.trim();
  if (!appId || !apiKey) return { error: "إعدادات OneSignal غير مكتملة على الخادم." };

  const payload: Record<string, unknown> = {
    app_id: appId,
    target_channel: "push",
    filters: buildFilters(targetRole, municipalityId),
    headings: { ar: title, en: title },
    contents: { ar: message, en: message },
    data: {
      governorate: "daraa",
      municipalityId: municipalityId ?? "all",
      role: targetRole,
      openUrl: openUrl ?? "",
    },
  };
  if (openUrl) payload.url = openUrl;
  if (imageUrl) {
    payload.chrome_web_image = imageUrl;
    payload.big_picture = imageUrl;
  }

  let responseBody = "";
  let status = "SENT";
  let onesignalMessageId: string | null = null;
  let errorMessage: string | null = null;

  try {
    const res = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
    responseBody = await res.text();
    const parsed = responseBody ? (JSON.parse(responseBody) as { id?: string; errors?: unknown }) : {};
    onesignalMessageId = parsed.id ?? null;
    if (!res.ok || parsed.errors) {
      status = "FAILED";
      errorMessage = responseBody.slice(0, 1000);
    }
  } catch (error) {
    status = "FAILED";
    errorMessage = error instanceof Error ? error.message : "تعذر الاتصال بـ OneSignal.";
  }

  await db.broadcastNotification.create({
    data: {
      actorId: session.user.id,
      municipalityId,
      targetScope: municipalityId ? "municipality" : "all",
      targetRole,
      title,
      message,
      imageUrl,
      openUrl,
      onesignalMessageId,
      onesignalResponse: responseBody.slice(0, 4000) || null,
      status,
      errorMessage,
    },
  });

  await writeOperationLog({
    actorId: session.user.id,
    municipalityId,
    action: "SEND_BROADCAST_NOTIFICATION",
    module: "NOTIFICATIONS",
    title: "إرسال إشعار OneSignal",
    description: title,
    entityType: "BROADCAST_NOTIFICATION",
    metadata: { targetRole, municipalityId, status, onesignalMessageId, errorMessage },
  });

  revalidatePath("/admin/broadcast-notifications");

  if (status === "FAILED") return { error: errorMessage || "تعذر إرسال الإشعار." };
  return { ok: true, message: "تم إرسال الإشعار وحفظه في السجل." };
}
