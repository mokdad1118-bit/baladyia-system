import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@/generated/prisma/enums";
import { resolveRequestUploadPath } from "@/lib/request-file-disk-path";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ fileId: string }> };

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
    return new NextResponse(null, { status: 404 });
  }

  const role = session.user.role as UserRole;
  const allowed =
    role === UserRole.ADMIN ||
    role === UserRole.EMPLOYEE ||
    (role === UserRole.CITIZEN && file.request.citizenId === session.user.id);

  if (!allowed) {
    return new NextResponse(null, { status: 403 });
  }

  const resolved = resolveRequestUploadPath(file.storedName);
  if (!resolved.ok) {
    return new NextResponse(null, { status: 404 });
  }

  let st;
  try {
    st = await stat(resolved.abs);
  } catch {
    return new NextResponse(null, { status: 404 });
  }
  if (!st.isFile()) {
    return new NextResponse(null, { status: 404 });
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
