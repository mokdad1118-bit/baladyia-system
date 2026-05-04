import nodemailer from "nodemailer";

function resendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function smtpConfigured(): boolean {
  return Boolean(
    process.env.EMAIL_HOST?.trim() &&
      process.env.EMAIL_USER?.trim() &&
      process.env.EMAIL_PASS?.trim(),
  );
}

export function isMailerConfigured(): boolean {
  return resendConfigured() || smtpConfigured();
}

/**
 * رسالة مفهومة للمستخدم/المسؤول بدل نص JSON الطويل من Resend.
 * أهم حالة: 403 عند استخدام Resend بدون نطاق موثّق — التجارب تذهب فقط لبريد مالك الحساب.
 */
export function friendlyCitizenMailFailure(raw: string): string {
  const r = raw || "";
  if (
    /Resend\s+403/i.test(r) &&
    (/testing emails|only send testing|verify a domain|validation_error|sandbox only|set RESEND_FROM_EMAIL/i.test(
      r,
    ))
  ) {
    return (
      "حساب Resend في وضع التجربة: يُسمح بإرسال الرسائل فقط إلى بريد مالك حساب Resend في لوحة التحكم. " +
      "لإرسال رموز التفعيل لأي مواطن: افتح resend.com/domains وثبّت نطاقك (أضف سجلات DNS كما يظهر)، " +
      "ثم في استضافة التطبيق (Render وغيرها) عيّن RESEND_FROM_EMAIL إلى عنوان من ذلك النطاق، مثل noreply@example.com."
    );
  }
  if (/ETIMEDOUT|ECONNREFUSED|ECONNRESET|socket|timeout/i.test(r)) {
    return (
      "تعذّر الاتصال بخادم البريد. على السيرفرات السحابية غالباً يُمنع SMTP — استخدم RESEND_API_KEY " +
      "وثبّت نطاقاً في Resend واضبط RESEND_FROM_EMAIL."
    );
  }
  if (r.length > 380) {
    return `${r.slice(0, 380)}…`;
  }
  return r || "تعذّر إرسال البريد.";
}

async function sendViaResend(params: {
  to: string;
  subject: string;
  textBody: string;
  htmlBody: string;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY!.trim();
  /**
   * لا نستخدم EMAIL_USER (غالباً Gmail) كمرسل عبر Resend — الخدمة لا ترسل من gmail.com إلا بعد توثيق نطاقك.
   * RESEND_FROM_EMAIL = عنوان من نطاقك الموثّق في Resend؛ بدونه يُستخدم نطاق التجربة فقط.
   */
  const fromRaw =
    process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev";
  const fromHeader = fromRaw.includes("<") ? fromRaw : `Baladya <${fromRaw}>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromHeader,
      to: [params.to],
      subject: params.subject,
      text: params.textBody,
      html: params.htmlBody,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    let parsed: { message?: string; name?: string } = {};
    try {
      parsed = JSON.parse(body) as { message?: string; name?: string };
    } catch {
      throw new Error(`Resend ${res.status}: ${body.slice(0, 280)}`);
    }
    const msg = parsed.message ?? "";
    if (
      res.status === 403 &&
      (/testing emails|only send testing|verify a domain/i.test(msg) || parsed.name === "validation_error")
    ) {
      throw new Error(
        "Resend 403: verify a domain at resend.com/domains, set RESEND_FROM_EMAIL to an address on that domain (sandbox only delivers to your Resend login email).",
      );
    }
    throw new Error(`Resend ${res.status}: ${msg.slice(0, 280) || body.slice(0, 280)}`);
  }
}

export async function sendCitizenOtpEmail(params: {
  to: string;
  subject: string;
  textBody: string;
  htmlBody: string;
}): Promise<void> {
  if (resendConfigured()) {
    await sendViaResend(params);
    return;
  }

  if (!smtpConfigured()) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[mailer] لا Resend ولا SMTP — محتوى الرسالة (تطوير فقط):\n", params.textBody);
      return;
    }
    throw new Error("أضف RESEND_API_KEY أو SMTP (EMAIL_HOST / EMAIL_USER / EMAIL_PASS)");
  }
  const port = Number(process.env.EMAIL_PORT?.trim() || "587");
  const useSecure =
    process.env.EMAIL_SECURE?.trim().toLowerCase() === "true" || port === 465;
  /** كلمات مرور تطبيق Google تُعرض أحياناً بمسافات؛ Nodemailer يحتاج السلسلة دون مسافات */
  const pass = process.env.EMAIL_PASS!.replace(/\s/g, "").trim();
  const host = process.env.EMAIL_HOST!.trim();
  const transporter = nodemailer.createTransport({
    host,
    port: Number.isFinite(port) ? port : 587,
    secure: useSecure,
    requireTLS: !useSecure && port === 587,
    connectionTimeout: 90_000,
    greetingTimeout: 30_000,
    socketTimeout: 90_000,
    tls: { servername: host },
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
