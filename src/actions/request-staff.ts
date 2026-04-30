"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notifyUsers } from "@/lib/notify";
import { requestStatusAr } from "@/lib/labels";
import { UserRole, RequestStatus } from "@/generated/prisma/enums";
import { redirect } from "next/navigation";
import { requestOriginFromHeaders, staffActionRedirectPath } from "@/lib/staff-portal";

const STAFF_REVALIDATE = [
  "/admin/requests",
  "/admin",
  "/requests",
  "/notifications",
  "/employee/requests",
  "/staff/requests",
] as const;

function isNextRedirectError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "digest" in e &&
    typeof (e as { digest: unknown }).digest === "string" &&
    (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

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

export async function updateRequestStatus(formData: FormData) {
  const s = await auth();
  const actorPortal = String(formData.get("actorPortal") ?? "");
  if (actorPortal !== "staff" && actorPortal !== "employee") return;
  if (!s?.user || (s.user.role !== UserRole.EMPLOYEE && s.user.role !== UserRole.ADMIN)) return;

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

  try {
    const r = await db.request.findUnique({ where: { id } });
    if (!r) return;
    if (r.status === to) return;

    /** بدون معاملة prisma — أنسب لبعض إعدادات LibSQL/Turso وتجنّب أعطال غامضة */
    await db.request.update({
      where: { id },
      data: { status: to, assigneeId: s.user.id },
    });
    await db.requestStatusLog.create({
      data: {
        requestId: id,
        actorId: s.user.id,
        fromStatus: r.status,
        toStatus: to,
        noteForCitizen: note || "",
      },
    });

    const statusLine = `الطلب ${r.requestNumber} أصبح: ${requestStatusAr[to]}`;
    const noteLine =
      to === RequestStatus.NEEDS_MODIFICATION && note
        ? ` — مطلوب تعديل: ${note}`
        : note
          ? ` — ${note}`
          : "";
    try {
      await notifyUsers({
        userIds: [r.citizenId],
        type: "STATUS_CHANGE",
        title: "تغيير حالة الطلب",
        message: `${statusLine}${noteLine}`,
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
  } catch (e) {
    if (isNextRedirectError(e)) throw e;
    console.error("[updateRequestStatus] failed:", e);
    redirect(staffActionRedirectPath(host, `${detailPath}?statusError=1`, origin));
  }
}

export async function addRequestNote(formData: FormData) {
  const s = await auth();
  const actorPortal = String(formData.get("actorPortal") ?? "");
  if (actorPortal !== "staff" && actorPortal !== "employee") return;
  if (!s?.user || (s.user.role !== UserRole.EMPLOYEE && s.user.role !== UserRole.ADMIN)) return;

  const requestId = String(formData.get("requestId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const detailPathRaw = String(formData.get("detailPath") ?? "").trim().split("?")[0];
  let detailPath = `/admin/requests/${requestId}`;
  if (detailPathRaw.startsWith("/employee/requests/")) detailPath = detailPathRaw;
  else if (detailPathRaw.startsWith("/staff/requests/")) detailPath = detailPathRaw;

  if (!requestId || !body) return;

  const r = await db.request.findUnique({ where: { id: requestId } });
  if (!r) return;

  await db.requestNote.create({
    data: { requestId, authorId: s.user.id, body },
  });
  revalidateStaffViews();
  revalidatePath(detailPath);
  const hdrs = await headers();
  const host = hdrs.get("host");
  redirect(staffActionRedirectPath(host, `${detailPath}?noted=1`, requestOriginFromHeaders(hdrs)));
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
}
