"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { getStaffToNotify, notifyUsers } from "@/lib/notify";
import { digitsOnly, isValidWhatsappLength } from "@/lib/phone";
import { nextGasRequestNumber } from "@/lib/gas-request-serial";
import { writeOperationLog } from "@/lib/operation-log";
import { parseGasAgentBarcodeValue } from "@/lib/gas-agent-barcode";

export type SubmitGasRequestState = { error: string } | undefined;

export async function submitGasRequest(
  _prev: SubmitGasRequestState,
  formData: FormData,
): Promise<SubmitGasRequestState> {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.CITIZEN) {
    return { error: "يجب تسجيل الدخول كمواطن لتقديم طلب خدمات الغاز." };
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = digitsOnly(String(formData.get("phone") ?? ""));
  const nationalId = digitsOnly(String(formData.get("nationalId") ?? ""));
  const gasAgentId = parseGasAgentBarcodeValue(
    String(formData.get("gasAgentToken") ?? formData.get("gasAgentId") ?? "").trim(),
  );

  if (fullName.length < 3) return { error: "يرجى إدخال الاسم الثلاثي." };
  if (!isValidWhatsappLength(phone)) return { error: "رقم الهاتف غير صالح (أرقام فقط ٨-١٥)." };
  if (nationalId.length < 10 || nationalId.length > 11) {
    return { error: "الرقم الوطني يجب أن يكون 10 أو 11 رقماً." };
  }
  if (!gasAgentId) {
    return { error: "يرجى اختيار معتمد الغاز." };
  }

  const citizenMun = session.user.municipalityId?.trim();
  if (!citizenMun) {
    return { error: "حسابك غير مرتبط ببلدية." };
  }

  const agent = await db.user.findFirst({
    where: {
      id: gasAgentId,
      role: UserRole.GAS_AGENT,
      isActive: true,
      municipalityId: citizenMun,
      gasArea: { not: null },
    },
    select: { id: true, gasArea: true },
  });
  const area = agent?.gasArea?.trim() ?? "";
  if (!agent || area.length < 2) {
    return { error: "معتمد الغاز المختار غير متاح حالياً." };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const duplicateToday = await db.gasRequest.findFirst({
    where: {
      citizenId: session.user.id,
      assignedAgentId: agent.id,
      createdAt: { gte: today },
    },
    select: { gasRequestNumber: true },
  });
  if (duplicateToday) {
    return { error: `تم تسجيل استلام جرة غاز اليوم مسبقاً. رقم السجل: ${duplicateToday.gasRequestNumber}` };
  }

  const number = await nextGasRequestNumber(citizenMun);
  const now = new Date();
  const created = await db.gasRequest.create({
    data: {
      municipalityId: citizenMun,
      gasRequestNumber: number,
      citizenId: session.user.id,
      area,
      assignedAgentId: agent.id,
      fullName,
      phone,
      nationalId,
      isCompleted: true,
      completedAt: now,
    },
  });
  await writeOperationLog({
    session,
    municipalityId: citizenMun,
    action: "CREATE",
    module: "GAS",
    title: "تقديم طلب غاز",
    description: `تم تقديم طلب الغاز ${number}`,
    entityType: "GAS_REQUEST",
    entityId: created.id,
    metadata: { gasRequestNumber: number, fullName, phone, nationalId, area, assignedAgentId: agent.id },
  });

  try {
    const staff = await getStaffToNotify(citizenMun);
    await notifyUsers({
      userIds: staff,
      type: "GAS_SUBMITTED",
      title: "طلب غاز جديد",
      message: `طلب غاز رقم ${number} — ${fullName}.`,
      municipalityId: citizenMun,
      gasRequestId: created.id,
    });
    await notifyUsers({
      userIds: [session.user.id],
      type: "GAS_SUBMITTED",
      title: "تم استلام طلب الغاز",
      message: `تم استلام طلب الغاز رقم ${number}. الحالة: قيد المتابعة.`,
      municipalityId: citizenMun,
      gasRequestId: created.id,
    });
  } catch (e) {
    console.warn("[submitGasRequest] notifyUsers:", e);
  }

  revalidatePath("/admin/gas-services");
  revalidatePath("/gas-agent");
  revalidatePath("/gas-services");
  revalidatePath("/services/gas");
  revalidatePath("/citizen/services/gas");
  revalidatePath("/notifications");
  revalidatePath("/citizen/notifications");
  revalidatePath("/requests");
  revalidatePath("/citizen/requests");

  redirect(`/services/gas?ok=1&no=${encodeURIComponent(number)}`);
}

export async function completeGasRequestAction(requestId: string): Promise<{ ok: true } | { error: string }> {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.GAS_AGENT) {
    return { error: "غير مصرح." };
  }
  const row = await db.gasRequest.findFirst({
    where: {
      id: requestId,
      assignedAgentId: session.user.id,
    },
    select: {
      id: true,
      isCompleted: true,
      citizenId: true,
      gasRequestNumber: true,
      municipalityId: true,
    },
  });
  if (!row) return { error: "الطلب غير موجود أو غير مخصص لك." };
  if (!row.isCompleted) {
    await db.gasRequest.update({
      where: { id: row.id },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });
    await writeOperationLog({
      session,
      municipalityId: row.municipalityId,
      action: "COMPLETE",
      module: "GAS",
      title: "إكمال طلب غاز",
      description: `تم إكمال طلب الغاز ${row.gasRequestNumber}`,
      entityType: "GAS_REQUEST",
      entityId: row.id,
      metadata: row,
    });
    try {
      await notifyUsers({
        userIds: [row.citizenId],
        type: "GAS_COMPLETED",
        title: "تحديث طلب الغاز",
        message: `تم تغيير حالة طلب الغاز ${row.gasRequestNumber} إلى: تم التسليم.`,
        municipalityId: row.municipalityId,
        gasRequestId: row.id,
      });
    } catch (e) {
      console.warn("[completeGasRequestAction] notifyUsers:", e);
    }
  }
  revalidatePath("/gas-agent");
  revalidatePath("/admin/gas-services");
  revalidatePath("/notifications");
  revalidatePath("/citizen/notifications");
  revalidatePath("/requests");
  revalidatePath("/citizen/requests");
  return { ok: true };
}
