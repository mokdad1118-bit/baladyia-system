import { SocialServiceCaseStatus, SocialServiceCategory } from "@/generated/prisma/enums";

export const socialServiceCategoryLabelAr: Record<SocialServiceCategory, string> = {
  [SocialServiceCategory.DIVORCED]: "المطلقات",
  [SocialServiceCategory.WIDOWS]: "الأرامل",
  [SocialServiceCategory.ORPHANS]: "الأيتام",
  [SocialServiceCategory.DISABILITIES]: "الإعاقات",
  [SocialServiceCategory.CHRONIC_DISEASES]: "الأمراض المزمنة",
  [SocialServiceCategory.FAMILY_CENSUS]: "الإحصاء العام للعوائل",
};

export const socialServiceStatusLabelAr: Record<SocialServiceCaseStatus, string> = {
  [SocialServiceCaseStatus.PENDING]: "قيد المعالجة",
  [SocialServiceCaseStatus.UNDER_REVIEW]: "قيد الدراسة",
  [SocialServiceCaseStatus.APPROVED]: "مقبول",
  [SocialServiceCaseStatus.REJECTED]: "مرفوض",
};

export const socialServiceStatusOrder: SocialServiceCaseStatus[] = [
  SocialServiceCaseStatus.PENDING,
  SocialServiceCaseStatus.UNDER_REVIEW,
  SocialServiceCaseStatus.APPROVED,
  SocialServiceCaseStatus.REJECTED,
];
