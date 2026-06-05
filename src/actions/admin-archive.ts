"use server";

import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { pipeline } from "node:stream/promises";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { FileKind } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { acceptsForFileKind } from "@/lib/file-validation";
import { assertStaffCanAccessMunicipality } from "@/lib/municipality-scope";
import { writeOperationLog } from "@/lib/operation-log";
import { staffCanManageArchive } from "@/lib/staff-permissions";
import { MAX_CITIZEN_ATTACHMENT_BYTES } from "@/lib/upload-limits";

export async function createArchiveEntry(
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user || !staffCanManageArchive(session)) {
    return { error: "غير مصرّح." };
  }

  const municipalityId = String(formData.get("municipalityId") ?? "").trim();
  const requestNumber = String(formData.get("requestNumber") ?? "").trim();
  const citizenName = String(formData.get("citizenName") ?? "").trim();
  const file = formData.get("archiveFile") as File | null;

  if (!municipalityId) return { error: "يرجى اختيار البلدية." };
  try {
    assertStaffCanAccessMunicipality(session, municipalityId);
  } catch {
    return { error: "لا تملك صلاحية إضافة أرشيف لهذه البلدية." };
  }
  if (requestNumber.length < 2) return { error: "يرجى إدخال رقم الطلب." };
  if (citizenName.length < 2) return { error: "يرجى إدخال اسم المواطن." };
  if (!file || file.size === 0) return { error: "يرجى إرفاق صورة أو ملف PDF." };
  if (file.size > MAX_CITIZEN_ATTACHMENT_BYTES) {
    return { error: `حجم الملف كبير جداً. الحد الأقصى ${Math.round(MAX_CITIZEN_ATTACHMENT_BYTES / (1024 * 1024))} ميغابايت.` };
  }

  const mime = file.type || "application/octet-stream";
  const valid = acceptsForFileKind(FileKind.ANY, mime);
  if (!valid.ok) return { error: valid.message ?? "الملفات المسموح بها: صورة أو PDF فقط." };

  const year = String(new Date().getUTCFullYear());
  const outDir = path.join(process.cwd(), "public", "uploads", year, "archive");
  await mkdir(outDir, { recursive: true });
  const originalName = (file as File & { name?: string }).name || "archive-file";
  const ext = path.extname(originalName) || (mime === "application/pdf" ? ".pdf" : ".bin");
  const stored = `${randomUUID()}${ext}`;
  await pipeline(
    Readable.fromWeb(file.stream() as unknown as NodeReadableStream),
    createWriteStream(path.join(outDir, stored)),
  );
  const filePath = `/uploads/${year}/archive/${stored}`;

  const created = await db.archiveEntry.create({
    data: {
      municipalityId,
      createdById: session.user.id,
      requestNumber,
      citizenName,
      filePath,
      fileOriginal: originalName,
      fileMime: mime,
      fileSize: file.size,
    },
  });

  await writeOperationLog({
    session,
    municipalityId,
    action: "CREATE",
    module: "ARCHIVE",
    title: "إضافة سجل أرشيف",
    description: `تمت إضافة سجل أرشيف للطلب ${requestNumber}`,
    entityType: "ARCHIVE_ENTRY",
    entityId: created.id,
    metadata: { requestNumber, citizenName, fileOriginal: originalName, fileSize: file.size },
  });

  revalidatePath("/admin/archive");
  revalidatePath("/archive");
  return { ok: true };
}
