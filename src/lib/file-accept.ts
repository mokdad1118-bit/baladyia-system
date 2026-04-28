import { FileKind } from "@/generated/prisma/enums";

export function acceptForKind(fileType: FileKind) {
  if (fileType === FileKind.IMAGE) return "image/*";
  if (fileType === FileKind.PDF) return ".pdf,application/pdf";
  return "image/*,.pdf,application/pdf";
}
