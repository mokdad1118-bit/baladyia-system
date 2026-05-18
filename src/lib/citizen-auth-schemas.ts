import { z } from "zod";
import { digitsOnly, isValidWhatsappLength } from "@/lib/phone";

export const citizenRegisterSchema = z
  .object({
    municipalityId: z.string().trim().min(1, "يرجى اختيار البلدية"),
    fullName: z
      .string()
      .trim()
      .min(3, "الاسم الثلاثي مطلوب (٣ أحرف على الأقل)")
      .max(120, "الاسم طويل جداً"),
    email: z
      .string()
      .trim()
      .min(1, "البريد الإلكتروني مطلوب")
      .transform((s) => s.toLowerCase())
      .pipe(z.string().email("البريد الإلكتروني غير صالح")),
    phoneRaw: z.string().trim().min(1, "رقم الهاتف مطلوب"),
    nationalIdRaw: z.string().trim().min(1, "الرقم الوطني مطلوب"),
    password: z
      .string()
      .min(8, "كلمة المرور ٨ أحرف على الأقل")
      .max(128, "كلمة المرور طويلة جداً")
      .regex(/[A-Za-z]/, "كلمة المرور يجب أن تحتوي حرفاً إنجليزياً واحداً على الأقل")
      .regex(/[0-9]/, "كلمة المرور يجب أن تحتوي رقماً واحداً على الأقل"),
  })
  .superRefine((data, ctx) => {
    const nid = digitsOnly(data.nationalIdRaw);
    if (nid.length < 10 || nid.length > 11) {
      ctx.addIssue({ code: "custom", path: ["nationalIdRaw"], message: "الرقم الوطني: ١٠ أو ١١ رقماً" });
    }
    const phoneDigits = digitsOnly(data.phoneRaw);
    if (!isValidWhatsappLength(phoneDigits)) {
      ctx.addIssue({ code: "custom", path: ["phoneRaw"], message: "رقم الهاتف: ٨–١٥ رقماً" });
    }
  });

export type CitizenRegisterInput = z.infer<typeof citizenRegisterSchema>;

export function parseCitizenRegisterForm(fd: FormData) {
  return citizenRegisterSchema.safeParse({
    municipalityId: String(fd.get("municipalityId") ?? ""),
    fullName: String(fd.get("fullName") ?? ""),
    email: String(fd.get("email") ?? ""),
    phoneRaw: String(fd.get("phone") ?? ""),
    nationalIdRaw: String(fd.get("nationalId") ?? ""),
    password: String(fd.get("password") ?? ""),
  });
}

export const otpCodeSchema = z
  .string()
  .trim()
  .transform((s) => s.replace(/\D/g, ""))
  .refine((s) => s.length === 6, "أدخل الرمز المكوّن من ٦ أرقام");

export const forgotIdentifierSchema = z
  .string()
  .trim()
  .min(3, "أدخل البريد أو رقم الهاتف")
  .max(200);
