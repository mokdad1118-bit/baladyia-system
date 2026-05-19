import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { SocialServiceCategory } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { ADMIN_NAV_BADGE_NOTIFICATION_TYPES } from "@/lib/admin-nav-badges";
import { socialServiceCategoryLabelAr, socialServiceStatusLabelAr } from "@/lib/social-service-labels";
import { AdminSocialServicesTableWithSearch } from "@/components/admin/AdminSocialServicesTableWithSearch";
import { staffMunicipalityIdFilter } from "@/lib/municipality-scope";
import { requireStaffPanelPermission } from "@/lib/admin-guard";

const slugMap: Record<string, SocialServiceCategory> = {
  divorced: SocialServiceCategory.DIVORCED,
  widows: SocialServiceCategory.WIDOWS,
  orphans: SocialServiceCategory.ORPHANS,
  disabilities: SocialServiceCategory.DISABILITIES,
  "chronic-diseases": SocialServiceCategory.CHRONIC_DISEASES,
  "family-census": SocialServiceCategory.FAMILY_CENSUS,
};

export default async function AdminSocialServicesCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const session = await auth();
  await requireStaffPanelPermission(session, "social");
  const mun = staffMunicipalityIdFilter(session);
  if (session?.user) {
    await db.notification.updateMany({
      where: {
        userId: session.user.id,
        read: false,
        type: { in: [...ADMIN_NAV_BADGE_NOTIFICATION_TYPES.social] },
      },
      data: { read: true },
    });
    revalidatePath("/admin");
  }

  const p = await params;
  const category = slugMap[p.category];
  if (!category) redirect("/admin/social-services");
  const list = await db.socialServiceCase.findMany({
    where: { ...mun, category },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
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
