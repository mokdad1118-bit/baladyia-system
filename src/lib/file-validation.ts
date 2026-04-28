import { FileKind } from "@/generated/prisma/enums";

export function acceptsForFileKind(
  fileType: FileKind,
  mime: string,
): { ok: boolean; message?: string } {
  if (fileType === FileKind.ANY) {
    const isImg = mime.startsWith("image/");
    const isPdf = mime === "application/pdf" || mime === "application/x-pdf";
    if (isImg || isPdf) return { ok: true };
    return { ok: false, message: "الملفات المسموح بها: صور أو PDF فقط" };
  }
  if (fileType === FileKind.IMAGE) {
    if (mime.startsWith("image/")) return { ok: true };
    return { ok: false, message: "مطلوب ملف صورة" };
  }
  if (mime === "application/pdf" || mime === "application/x-pdf")
    return { ok: true };
  return { ok: false, message: "مطلوب ملف PDF" };
}
