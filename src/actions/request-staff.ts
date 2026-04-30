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

function revalidateStaffViews() {
  for (const p of STAFF_REVALIDATE) revalidatePath(p);
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

  const r = await db.request.findUnique({ where: { id } });
  if (!r) return;
  if (r.status === to) return;

  /** تفاعلي بدل مصفوفة الطلبات — أوفر توافقاً مع محول LibSQL/Turso من دفعات prisma */
  await db.$transaction(async (tx) => {
    await tx.request.update({
      where: { id },
      data: { status: to, assigneeId: s.user.id },
    });
    await tx.requestStatusLog.create({
      data: {
        requestId: id,
        actorId: s.user.id,
        fromStatus: r.status,
        toStatus: to,
        noteForCitizen: note || null,
      },
    });
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
  revalidatePath(`/admin/requests/${id}`);
  revalidatePath(`/requests/${id}`);
  revalidatePath(`/employee/requests/${id}`);
  revalidatePath(`/staff/requests/${id}`);

  const hdrs = await headers();
  const host = hdrs.get("host");
  redirect(staffActionRedirectPath(host, `${listRedirect}?updated=1`, requestOriginFromHeaders(hdrs)));
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
