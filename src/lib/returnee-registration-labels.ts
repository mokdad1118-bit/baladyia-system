import { ReturneeRegistrationStatus } from "@/generated/prisma/enums";

export const returneeRegistrationStatusLabelAr: Record<ReturneeRegistrationStatus, string> = {
  [ReturneeRegistrationStatus.PENDING]: "قيد المراجعة",
  [ReturneeRegistrationStatus.UNDER_REVIEW]: "قيد الدراسة",
  [ReturneeRegistrationStatus.APPROVED]: "مقبول",
  [ReturneeRegistrationStatus.REJECTED]: "مرفوض",
};

export const returneeRegistrationStatusOrder: ReturneeRegistrationStatus[] = [
  ReturneeRegistrationStatus.PENDING,
  ReturneeRegistrationStatus.UNDER_REVIEW,
  ReturneeRegistrationStatus.APPROVED,
  ReturneeRegistrationStatus.REJECTED,
];
