import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@/generated/prisma/enums";
import { requestAttachmentPublicHref, resolveRequestUploadPath } from "@/lib/request-file-disk-path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ fileId: string }> };

function escHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function notFoundHtml(title: string, bodyHtml: string) {
  const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escHtml(title)}</title></head><body style="font-family:system-ui,Tahoma,sans-serif;padding:1.25rem;line-height:1.6;max-width:40rem">${bodyHtml}</body></html>`;
  return new NextResponse(html, {
    status: 404,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse(null, { status: 401 });
  }

  const { fileId } = await ctx.params;
  if (!fileId) {
    return new NextResponse(null, { status: 400 });
  }

  const file = await db.requestFile.findFirst({
    where: { id: fileId },
    select: {
      storedName: true,
      mimeType: true,
      originalName: true,
      request: { select: { citizenId: true } },
    },
  });

  if (!file) {
    return notFoundHtml(
      "مرفق غير معروف",
      `<h1 style="font-size:1.15rem">لم يُعثر على هذا المرفق</h1><p>قد يكون الرابط قديماً أو المعرّف غير صحيح.</p>`,
    );
  }

  const role = session.user.role as UserRole;
  const allowed =
    role === UserRole.ADMIN ||
    role === UserRole.EMPLOYEE ||
    (role === UserRole.CITIZEN && file.request.citizenId === session.user.id);

  if (!allowed) {
    return new NextResponse(null, { status: 403 });
  }

  const publicHref = requestAttachmentPublicHref(file.storedName);
  const resolved = resolveRequestUploadPath(file.storedName);

  if (!resolved.ok) {
    console.warn("[request-files] resolve failed", { fileId, storedName: file.storedName });
    return notFoundHtml(
      "مسار المرفق غير صالح",
      `<h1 style="font-size:1.15rem">مسار التخزين غير صالح</h1><p>القيمة المسجّلة: <code>${escHtml(file.storedName)}</code></p>`,
    );
  }

  let st;
  try {
    st = await stat(resolved.abs);
  } catch (e) {
    console.warn("[request-files] file missing on disk", {
      fileId,
      storedName: file.storedName,
      abs: resolved.abs,
      err: e instanceof Error ? e.message : String(e),
    });
    const tryLink =
      publicHref.startsWith("/") || publicHref.startsWith("http")
        ? `<p><a href="${escHtml(publicHref)}">تجربة الرابط المباشر للملف</a></p>`
        : "";
    return notFoundHtml(
      "الملف غير موجود على الخادم",
      `<h1 style="font-size:1.15rem">الملف غير موجود على الخادم</h1>
<p>المسار المتوقّع: <code>${escHtml(resolved.abs)}</code></p>
${tryLink}
<p style="margin-top:1rem;font-size:0.95rem;color:#444">على <strong>Render</strong> وغيرها من المنصات، مجلد الرفع داخل الحاوية يُمسح غالباً عند كل <strong>إعادة نشر</strong> ما لم تُضِف <strong>Persistent Disk</strong> وتربطه بمسار التخزين داخل الحاوية (مثلاً لـ Docker مع WORKDIR <code>/app</code>: المسار <code>/app/public/uploads</code>).</p>`,
    );
  }

  if (!st.isFile()) {
    return notFoundHtml("المرفق ليس ملفاً", `<p>المسار الموجود ليس ملفاً عادياً.</p>`);
  }

  const nodeStream = createReadStream(resolved.abs);
  const webBody = Readable.toWeb(nodeStream) as unknown as BodyInit;

  const headers = new Headers();
  headers.set("Content-Type", file.mimeType || "application/octet-stream");
  headers.set("Content-Length", String(st.size));
  const safeName = (file.originalName || "attachment").replace(/["\r\n]/g, "_");
  headers.set("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(safeName)}`);

  return new NextResponse(webBody, { status: 200, headers });
}
