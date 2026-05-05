import type { RequestStatus } from "@/generated/prisma/enums";

export const requestStatusAr: Record<RequestStatus, string> = {
  PENDING: "جديد",
  UNDER_REVIEW: "قيد المعالجة",
  NEEDS_MODIFICATION: "بحاجة تعديل",
  APPROVED: "مقبول",
  REJECTED: "مرفوض",
  COMPLETED: "مكتمل",
};

export const fileKindAr = {
  IMAGE: "صورة",
  PDF: "PDF",
  ANY: "صورة أو PDF",
} as const;

export const userRoleAr = {
  ADMIN: "مدير النظام",
  EMPLOYEE: "موظف",
  CITIZEN: "مواطن",
  GAS_AGENT: "معتمد غاز",
} as const;
