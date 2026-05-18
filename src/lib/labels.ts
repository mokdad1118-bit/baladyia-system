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

import { UserRole } from "@/generated/prisma/enums";

export const userRoleAr: Record<UserRole, string> = {
  SUPER_ADMIN: "مشرف المحافظة",
  MUNICIPALITY_ADMIN: "مدير بلدية",
  EMPLOYEE: "موظف",
  CITIZEN: "مواطن",
  GAS_AGENT: "معتمد غاز",
};
