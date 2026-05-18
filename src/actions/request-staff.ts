"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notifyUsers } from "@/lib/notify";
import { requestStatusAr } from "@/lib/labels";
import { UserRole, RequestStatus } from "@/generated/prisma/enums";
import { redirect, unstable_rethrow } from "next/navigation";
import { requestOriginFromHeaders, staffActionRedirectPath } from "@/lib/staff-portal";
import { Prisma } from "@/generated/prisma/client";
import { digitsOnly } from "@/lib/phone";
import { isAdminPanelRole } from "@/lib/roles";
import { assertStaffCanAccessMunicipality } from "@/lib/municipality-scope";

const STAFF_REVALIDATE = [
  "/admin/requests",
  "/admin",
  "/requests",
  "/notifications",
  "/citizen/requests",
  "/citizen/notifications",
  "/employee/requests",
  "/staff/requests",
] as const;

function safeRevalidatePath(pathname: string) {
  try {
    revalidatePath(pathname);
  } catch {
    /* تجاهل — بعض الأنماط النادرة قد ترفضها بيئة الإنتاج */
  }
}

function revalidateStaffViews() {
  for (const p of STAFF_REVALIDATE) safeRevalidatePath(p);
}

function staffDetailPath(actorPortal: string, requestId: string, listPathHint: string): string {
  if (actorPortal === "employee") return `/employee/requests/${requestId}`;
  if (actorPortal === "staff" && listPathHint.startsWith("/staff")) return `/staff/requests/${requestId}`;
  return `/admin/requests/${requestId}`;
}

function staffStaleLoginPath(actorPortal: string): string {
  if (actorPortal === "employee") return "/employee/login";
  if (actorPortal === "staff") return "/staff/login";
  return "/admin/login";
}

/**
 * بعد إعادة إنشاء Turso أو تغيير المعرّفات، قد يبقى JWT يحمل user.id قديماً غير موجود في DB → فشل FK.
 * نحلّ المستخدم الفعلي من قاعدة البيانات بالمعرّف ثم البريد ثم واتساب (للموظف).
 */
async function resolveStaffActorDbId(opts: {
  sessionUserId: string;
  email: string | null | undefined;
  phone: string | null | undefined;
  role: UserRole;
}): Promise<string | null> {
  const roles: UserRole[] =
    opts.role === UserRole.SUPER_ADMIN || opts.role === UserRole.MUNICIPALITY_ADMIN
      ? [UserRole.SUPER_ADMIN, UserRole.MUNICIPALITY_ADMIN, UserRole.EMPLOYEE]
      : [UserRole.EMPLOYEE, UserRole.SUPER_ADMIN, UserRole.MUNICIPALITY_ADMIN];

  const base = { isActive: true as const, role: { in: roles } };

  const byId = await db.user.findFirst({
    where: { ...base, id: opts.sessionUserId },
  });
  if (byId) return byId.id;

  const em = opts.email?.trim().toLowerCase();
  if (em) {
    const byEmail = await db.user.findFirst({
      where: { ...base, email: em },
    });
    if (byEmail) return byEmail.id;
  }

  const ph = digitsOnly(opts.phone ?? "");
  if (ph && opts.role === UserRole.EMPLOYEE) {
    const byPhone = await db.user.findFirst({
      where: { ...base, phone: ph },
    });
    if (byPhone) return byPhone.id;
  }

  return null;
}

export async function updateRequestStatus(formData: FormData) {
  const s = await auth();
  const actorPortal = String(formData.get("actorPortal") ?? "");
  if (actorPortal !== "staff" && actorPortal !== "employee") return;
  if (!s?.user || (s.user.role !== UserRole.EMPLOYEE && !isAdminPanelRole(s.user.role))) return;

  const id = String(formData.get("requestId") ?? "");
  const to = String(formData.get("toStatus") ?? "") as RequestStatus;
  const note = String(formData.get("noteForCitizen") ?? "").trim();
  const listPathHint = String(formData.get("listPath") ?? "").trim().split("?")[0];

  let listRedirect = "/admin/requests";
  if (actorPortal === "employee") {
    listRedirect = listPathHint.startsWith("/employee") ? listPathHint : "/employee/requests";
  } else if (actorPortal === "staff" && listPathHint.startsWith("/staff")) {
    listRedirect = listPathHint;
  }

  if (!id || !Object.values(RequestStatus).includes(to as RequestStatus)) {
    return;
  }

  const hdrs = await headers();
  const host = hdrs.get("host");
  const origin = requestOriginFromHeaders(hdrs);
  const detailPath = staffDetailPath(actorPortal, id, listPathHint);

  const r = await db.request.findUnique({ where: { id } });
  if (!r) return;
  try {
    assertStaffCanAccessMunicipality(s, r.municipalityId);
  } catch {
    return;
  }
  /** بدون تغيير حالة وبدون تنبيه = لا شيء. تنبيه فقط مع نفس الحالة كان يُتجاهل سابقاً ولا يصل للمواطن. */
  if (r.status === to && !note) return;

  const actorDbId = await resolveStaffActorDbId({
    sessionUserId: s.user.id,
    email: s.user.email,
    phone: s.user.phone,
    role: s.user.role as UserRole,
  });
  if (!actorDbId) {
    const next = encodeURIComponent(detailPath);
    redirect(
      staffActionRedirectPath(
        host,
        `${staffStaleLoginPath(actorPortal)}?next=${next}&reason=stale_session`,
        origin,
      ),
    );
  }

  try {
    /** بدون معاملة prisma — أنسب لبعض إعدادات LibSQL/Turso وتجنّب أعطال غامضة */
    await db.request.update({
      where: { id },
      data: { status: to, assigneeId: actorDbId },
    });
    await db.requestStatusLog.create({
      data: {
        requestId: id,
        actorId: actorDbId,
        fromStatus: r.status,
        toStatus: to,
        ...(note ? { noteForCitizen: note } : {}),
      },
    });
  } catch (e) {
    unstable_rethrow(e);
    const prismaMsg =
      e instanceof Prisma.PrismaClientKnownRequestError
        ? `${e.code} ${e.meta ? JSON.stringify(e.meta) : ""}`
        : "";
    console.error("[updateRequestStatus] database failed:", prismaMsg || e);
    redirect(staffActionRedirectPath(host, `${detailPath}?statusError=1`, origin));
  }

  const statusChanged = r.status !== to;
  const statusLine = `الطلب ${r.requestNumber} أصبح: ${requestStatusAr[to]}`;
  const noteLine =
    to === RequestStatus.NEEDS_MODIFICATION && note
      ? ` — مطلوب تعديل: ${note}`
      : note
        ? ` — ${note}`
        : "";
  const notifyTitle = statusChanged ? "تغيير حالة الطلب" : "تنبيه بخصوص طلبك";
  const notifyMessage = statusChanged
    ? `${statusLine}${noteLine}`
    : note
      ? `بخصوص الطلب ${r.requestNumber}: ${note}`
      : statusLine;
  try {
    await notifyUsers({
      userIds: [r.citizenId],
      type: statusChanged ? "STATUS_CHANGE" : "STAFF_MESSAGE",
      title: notifyTitle,
      message: notifyMessage,
      municipalityId: r.municipalityId,
      requestId: id,
    });
  } catch (notifyErr) {
    console.error("[updateRequestStatus] notifyUsers failed:", notifyErr);
  }

  revalidateStaffViews();
  safeRevalidatePath(`/admin/requests/${id}`);
  safeRevalidatePath(`/requests/${id}`);
  safeRevalidatePath(`/employee/requests/${id}`);
  safeRevalidatePath(`/staff/requests/${id}`);

  redirect(staffActionRedirectPath(host, `${listRedirect}?updated=1`, origin));
}

export async function addRequestNote(formData: FormData) {
  const s = await auth();
  const actorPortal = String(formData.get("actorPortal") ?? "");
  if (actorPortal !== "staff" && actorPortal !== "employee") return;
  if (!s?.user || (s.user.role !== UserRole.EMPLOYEE && !isAdminPanelRole(s.user.role))) return;

  const requestId = String(formData.get("requestId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const detailPathRaw = String(formData.get("detailPath") ?? "").trim().split("?")[0];
  let detailPath = `/admin/requests/${requestId}`;
  if (detailPathRaw.startsWith("/employee/requests/")) detailPath = detailPathRaw;
  else if (detailPathRaw.startsWith("/staff/requests/")) detailPath = detailPathRaw;

  if (!requestId || !body) return;

  const r = await db.request.findUnique({ where: { id: requestId } });
  if (!r) return;
  try {
    assertStaffCanAccessMunicipality(s, r.municipalityId);
  } catch {
    return;
  }

  const hdrs0 = await headers();
  const host0 = hdrs0.get("host");
  const origin0 = requestOriginFromHeaders(hdrs0);

  const actorDbId = await resolveStaffActorDbId({
    sessionUserId: s.user.id,
    email: s.user.email,
    phone: s.user.phone,
    role: s.user.role as UserRole,
  });
  if (!actorDbId) {
    const next = encodeURIComponent(detailPath);
    redirect(
      staffActionRedirectPath(
        host0,
        `${staffStaleLoginPath(actorPortal)}?next=${next}&reason=stale_session`,
        origin0,
      ),
    );
  }

  await db.requestNote.create({
    data: { requestId, authorId: actorDbId, body },
  });
  revalidateStaffViews();
  revalidatePath(detailPath);
  redirect(staffActionRedirectPath(host0, `${detailPath}?noted=1`, origin0));
}

export async function markNotificationRead(notifId: string) {
  const s = await auth();
  if (!s?.user) return;
  await db.notification.updateMany({
    where: { id: notifId, userId: s.user.id, read: false },
    data: { read: true },
  });
}

export async function markAllNotificationsRead() {
  const s = await auth();
  if (!s?.user) return;
  await db.notification.updateMany({
    where: { userId: s.user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/notifications");
  revalidatePath("/citizen/notifications");
}
