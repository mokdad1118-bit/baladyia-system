import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { assertStaffCanAccessMunicipality } from "@/lib/municipality-scope";
import { resolveRequestUploadPath } from "@/lib/request-file-disk-path";
import { isAdminPanelRole } from "@/lib/roles";
import { staffCanManageArchive } from "@/lib/staff-permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ fileId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse(null, { status: 401 });

  const { fileId } = await ctx.params;
  if (!fileId) return new NextResponse(null, { status: 400 });

  const entry = await db.archiveEntry.findUnique({
    where: { id: fileId },
    select: {
      municipalityId: true,
      filePath: true,
      fileOriginal: true,
      fileMime: true,
    },
  });
  if (!entry) return new NextResponse(null, { status: 404 });

  const role = session.user.role as UserRole;
  if ((!isAdminPanelRole(role) && role !== UserRole.EMPLOYEE) || !staffCanManageArchive(session)) {
    return new NextResponse(null, { status: 403 });
  }
  try {
    assertStaffCanAccessMunicipality(session, entry.municipalityId);
  } catch {
    return new NextResponse(null, { status: 403 });
  }

  const resolved = resolveRequestUploadPath(entry.filePath);
  if (!resolved.ok) return new NextResponse(null, { status: 404 });

  let st;
  try {
    st = await stat(resolved.abs);
  } catch {
    return new NextResponse(null, { status: 404 });
  }
  if (!st.isFile()) return new NextResponse(null, { status: 404 });

  const nodeStream = createReadStream(resolved.abs);
  const webBody = Readable.toWeb(nodeStream) as unknown as BodyInit;
  const headers = new Headers();
  headers.set("Content-Type", entry.fileMime || "application/octet-stream");
  headers.set("Content-Length", String(st.size));
  const safeName = (entry.fileOriginal || "archive-file").replace(/["\r\n]/g, "_");
  headers.set("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(safeName)}`);
  return new NextResponse(webBody, { status: 200, headers });
}
