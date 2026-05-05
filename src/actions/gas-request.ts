"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { digitsOnly, isValidWhatsappLength } from "@/lib/phone";
import { nextGasRequestNumber } from "@/lib/gas-request-serial";

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
  const area = String(formData.get("area") ?? "").trim();

  if (fullName.length < 3) return { error: "يرجى إدخال الاسم الثلاثي." };
  if (!isValidWhatsappLength(phone)) return { error: "رقم الهاتف غير صالح (أرقام فقط ٨-١٥)." };
  if (nationalId.length < 10 || nationalId.length > 11) {
    return { error: "الرقم الوطني يجب أن يكون 10 أو 11 رقماً." };
  }
  if (area.length < 2) {
    return { error: "يرجى اختيار المنطقة." };
  }

  const agent = await db.user.findFirst({
    where: {
      role: UserRole.GAS_AGENT,
      isActive: true,
      gasArea: area,
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!agent) {
    return { error: "لا يوجد معتمد غاز مخصص لهذه المنطقة حالياً." };
  }

  const number = await nextGasRequestNumber();
  await db.gasRequest.create({
    data: {
      gasRequestNumber: number,
      citizenId: session.user.id,
      area,
      assignedAgentId: agent.id,
      fullName,
      phone,
      nationalId,
    },
  });

  revalidatePath("/admin/gas-services");
  revalidatePath("/gas-agent");
  revalidatePath("/gas-services");
  revalidatePath("/services/gas");
  revalidatePath("/citizen/services/gas");

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
    select: { id: true, isCompleted: true },
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
  }
  revalidatePath("/gas-agent");
  revalidatePath("/admin/gas-services");
  return { ok: true };
}
