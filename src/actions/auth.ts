"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import {
  citizenPhoneLookupKeys,
  digitsOnly,
  normalizeCitizenPhoneForStorage,
  notifEmailOrNull,
} from "@/lib/phone";
import { UserRole } from "@/generated/prisma/enums";

export async function registerCitizen(
  _prev: { error?: string } | undefined,
  formData: FormData,
) {
  const name = String(formData.get("name") ?? "").trim();
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const phoneDigits = digitsOnly(phoneRaw);
  const phone = normalizeCitizenPhoneForStorage(phoneRaw);
  const password = String(formData.get("password") ?? "");
  const notifRaw = String(formData.get("notificationEmail") ?? "").trim();
  if (!name || !phoneDigits || !password)
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
  const phoneVariants = new Set([
    ...citizenPhoneLookupKeys(phoneDigits),
    ...citizenPhoneLookupKeys(phone),
    phone,
  ]);
  for (const p of phoneVariants) {
    if (!p) continue;
    const phoneTaken = await db.user.findUnique({ where: { phone: p } });
    if (phoneTaken) return { error: "رقم واتساب مسجّل مسبقاً" };
  }
  if (notifNorm) {
    const t = await db.user.findFirst({
      where: { notificationEmail: notifNorm },
    });
    if (t) return { error: "بريد الإشعارات مُسجّل" };
  }
  try {
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
  } catch (e: unknown) {
    const code =
      typeof e === "object" && e !== null && "code" in e
        ? String((e as { code: unknown }).code)
        : "";
    if (code === "P2002") {
      return { error: "رقم واتساب أو بريد إشعارات مُستخدم مسبقاً" };
    }
    console.error("[registerCitizen]", e);
    return { error: "تعذّر حفظ الحساب. تحقق من الاتصال بقاعدة البيانات وحاول مرة أخرى." };
  }
  redirect("/citizen/login?registered=1");
}
