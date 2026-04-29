"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { digitsOnly, notifEmailOrNull } from "@/lib/phone";
import { UserRole } from "@/generated/prisma/enums";

export async function registerCitizen(
  _prev: { error?: string } | undefined,
  formData: FormData,
) {
  const name = String(formData.get("name") ?? "").trim();
  const phone = digitsOnly(String(formData.get("phone") ?? "").trim());
  const password = String(formData.get("password") ?? "");
  const notifRaw = String(formData.get("notificationEmail") ?? "").trim();
  if (!name || !phone || !password)
    return { error: "يرجى تعبئة الحقول المطلوبة" };
  if (phone.length < 8 || phone.length > 15)
    return { error: "رقم واتساب: أرقام (٨–١٥ رقماً)" };
  if (password.length < 6)
    return { error: "كلمة المرور 6 أحرف على الأقل" };
  const notifNorm = notifRaw
    ? notifEmailOrNull(notifRaw)
    : null;
  if (notifRaw && notifNorm == null)
    return { error: "بريد الإشعارات غير صالح" };
  const phoneTaken = await db.user.findUnique({ where: { phone } });
  if (phoneTaken) return { error: "رقم واتساب مسجّل مسبقاً" };
  if (notifNorm) {
    const t = await db.user.findFirst({
      where: { notificationEmail: notifNorm },
    });
    if (t) return { error: "بريد الإشعارات مُسجّل" };
  }
  await db.user.create({
    data: {
      name,
      email: null,
      phone,
      passwordHash: await hashPassword(password),
      notificationEmail: notifNorm || null,
      role: UserRole.CITIZEN,
    },
  });
  redirect("/citizen/login?registered=1");
}
