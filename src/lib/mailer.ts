import nodemailer from "nodemailer";

function smtpConfigured(): boolean {
  return Boolean(
    process.env.EMAIL_HOST?.trim() &&
      process.env.EMAIL_USER?.trim() &&
      process.env.EMAIL_PASS?.trim(),
  );
}

export function isMailerConfigured(): boolean {
  return smtpConfigured();
}

export async function sendCitizenOtpEmail(params: {
  to: string;
  subject: string;
  textBody: string;
  htmlBody: string;
}): Promise<void> {
  if (!smtpConfigured()) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[mailer] SMTP غير مُضبط — محتوى الرسالة (تطوير فقط):\n", params.textBody);
      return;
    }
    throw new Error("SMTP غير مُضبط (EMAIL_HOST / EMAIL_USER / EMAIL_PASS)");
  }
  const port = Number(process.env.EMAIL_PORT?.trim() || "587");
  const useSecure =
    process.env.EMAIL_SECURE?.trim().toLowerCase() === "true" || port === 465;
  /** كلمات مرور تطبيق Google تُعرض أحياناً بمسافات؛ Nodemailer يحتاج السلسلة دون مسافات */
  const pass = process.env.EMAIL_PASS!.replace(/\s/g, "").trim();
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST!.trim(),
    port: Number.isFinite(port) ? port : 587,
    secure: useSecure,
    requireTLS: !useSecure && port === 587,
    auth: {
      user: process.env.EMAIL_USER!.trim(),
      pass,
    },
  });
  await transporter.sendMail({
    from: `"بلدية بصرى" <${process.env.EMAIL_USER!.trim()}>`,
    to: params.to,
    subject: params.subject,
    text: params.textBody,
    html: params.htmlBody,
  });
}

export function buildArabicOtpEmailBodies(params: { code: string; heading: string; intro: string }) {
  const { code, heading, intro } = params;
  const textBody = `${heading}\n\n${intro}\n\nرمز التحقق: ${code}\n\nصالح لمدة 10 دقائق.\nإذا لم تطلب هذا الرمز، تجاهل الرسالة.\n`;
  const htmlBody = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8" /></head>
<body style="font-family: 'Segoe UI', Tahoma, sans-serif; direction: rtl; text-align: right; line-height: 1.6; color: #111;">
  <h2 style="color:#0f5132;">${heading}</h2>
  <p>${intro}</p>
  <p style="font-size: 1.75rem; letter-spacing: 0.35em; font-weight: 700; color: #0f5132;">${code}</p>
  <p style="color:#555;">صالح لمدة <strong>10 دقائق</strong>.</p>
  <p style="color:#888; font-size:0.9rem;">إذا لم تطلب هذا الرمز، يمكنك تجاهل هذه الرسالة بأمان.</p>
</body>
</html>`.trim();
  return { textBody, htmlBody };
}
