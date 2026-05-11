import { redirect } from "next/navigation";
import { SocialServiceCategory } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { socialServiceCategoryLabelAr, socialServiceStatusLabelAr } from "@/lib/social-service-labels";
import { AdminSocialServicesTableWithSearch } from "@/components/admin/AdminSocialServicesTableWithSearch";

const slugMap: Record<string, SocialServiceCategory> = {
  divorced: SocialServiceCategory.DIVORCED,
  widows: SocialServiceCategory.WIDOWS,
  orphans: SocialServiceCategory.ORPHANS,
  disabilities: SocialServiceCategory.DISABILITIES,
  "chronic-diseases": SocialServiceCategory.CHRONIC_DISEASES,
  "family-census": SocialServiceCategory.FAMILY_CENSUS,
};

export default async function AdminSocialServicesCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const p = await params;
  const category = slugMap[p.category];
  if (!category) redirect("/admin/social-services");
  const list = await db.socialServiceCase.findMany({ where: { category }, orderBy: { createdAt: "desc" }, take: 500 });
  const rows = list.map((r) => {
    const attachments = JSON.parse(r.attachmentsJson || "[]") as { path: string }[];
    return {
      id: r.id,
      caseNumber: r.caseNumber,
      categoryLabel: socialServiceCategoryLabelAr[r.category],
      ownerName: r.fullName || `${r.husbandFullName ?? ""} / ${r.wifeFullName ?? ""}`.trim(),
      nationalId: r.nationalId || r.husbandNationalId || r.wifeNationalId || "",
      phone: r.phone,
      status: r.status,
      statusLabel: socialServiceStatusLabelAr[r.status],
      createdAt: r.createdAt.toISOString(),
      attachments: attachments.map((a, i) => ({ href: a.path, label: `مرفق ${i + 1}` })),
    };
  });
  return <AdminSocialServicesTableWithSearch title={socialServiceCategoryLabelAr[category]} rows={rows} />;
}
