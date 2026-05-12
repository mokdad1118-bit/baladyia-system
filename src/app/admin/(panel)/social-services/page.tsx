import Link from "next/link";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ADMIN_NAV_BADGE_NOTIFICATION_TYPES } from "@/lib/admin-nav-badges";
import { parseDateEndParam, parseDateStartParam } from "@/lib/request-list-filters";
import { AdminReturneeRegistrationsTableWithSearch } from "@/components/admin/AdminReturneeRegistrationsTableWithSearch";
import { AdminSocialServicesTableWithSearch } from "@/components/admin/AdminSocialServicesTableWithSearch";
import { SocialServiceCategory, UserRole } from "@/generated/prisma/enums";
import { socialServiceCategoryLabelAr, socialServiceStatusLabelAr } from "@/lib/social-service-labels";

const sections = [
  { key: "returnees", label: "تسجيل العائدين" },
  { key: "divorced", label: "المطلقات" },
  { key: "widows", label: "الأرامل" },
  { key: "orphans", label: "الأيتام" },
  { key: "disabilities", label: "الإعاقات" },
  { key: "chronic-diseases", label: "الأمراض المزمنة" },
  { key: "family-census", label: "الإحصاء العام للعوائل" },
];

const categoryByKey: Record<string, SocialServiceCategory | null> = {
  returnees: null,
  divorced: SocialServiceCategory.DIVORCED,
  widows: SocialServiceCategory.WIDOWS,
  orphans: SocialServiceCategory.ORPHANS,
  disabilities: SocialServiceCategory.DISABILITIES,
  "chronic-diseases": SocialServiceCategory.CHRONIC_DISEASES,
  "family-census": SocialServiceCategory.FAMILY_CENSUS,
};

type Props = { searchParams: Promise<{ tab?: string; dateFrom?: string; dateTo?: string }> };

export default async function AdminSocialServicesIndexPage({ searchParams }: Props) {
  const session = await auth();
  if (session?.user?.role === UserRole.ADMIN) {
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

  const sp = await searchParams;
  const activeKey = sections.some((s) => s.key === sp.tab) ? String(sp.tab) : "returnees";
  const activeCategory = categoryByKey[activeKey];
  const d0 = parseDateStartParam(sp.dateFrom);
  const d1 = parseDateEndParam(sp.dateTo);

  let content = null;
  if (activeCategory === null) {
    const list = await db.returneeRegistration.findMany({
      where: d0 || d1 ? { createdAt: { ...(d0 ? { gte: d0 } : {}), ...(d1 ? { lte: d1 } : {}) } } : {},
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    const filterForm = (
      <form className="flex flex-wrap items-end gap-3" method="get" action="/admin/social-services">
        <input type="hidden" name="tab" value={activeKey} />
        <div className="min-w-[10rem] flex-1 sm:max-w-[11rem]">
          <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">من تاريخ</label>
          <input className="gov-input w-full px-3 py-2.5 text-sm" type="date" name="dateFrom" defaultValue={sp.dateFrom ?? ""} />
        </div>
        <div className="min-w-[10rem] flex-1 sm:max-w-[11rem]">
          <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">إلى تاريخ</label>
          <input className="gov-input w-full px-3 py-2.5 text-sm" type="date" name="dateTo" defaultValue={sp.dateTo ?? ""} />
        </div>
        <button type="submit" className="gov-btn-primary px-5 py-2.5 text-sm font-semibold">تطبيق</button>
      </form>
    );
    content = (
      <AdminReturneeRegistrationsTableWithSearch
        rows={list.map((r) => ({
          id: r.id,
          registrationNumber: r.registrationNumber,
          fullName: r.fullName,
          birthDate: r.birthDate.toISOString(),
          nationalId: r.nationalId,
          phone: r.phone,
          email: r.email,
          returnStatementPath: r.returnStatementPath,
          createdAt: r.createdAt.toISOString(),
          status: r.status,
        }))}
        filterForm={filterForm}
      />
    );
  } else {
    const list = await db.socialServiceCase.findMany({
      where: {
        category: activeCategory,
        ...(d0 || d1 ? { createdAt: { ...(d0 ? { gte: d0 } : {}), ...(d1 ? { lte: d1 } : {}) } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    const filterForm = (
      <form className="flex flex-wrap items-end gap-3" method="get" action="/admin/social-services">
        <input type="hidden" name="tab" value={activeKey} />
        <div className="min-w-[10rem] flex-1 sm:max-w-[11rem]">
          <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">من تاريخ</label>
          <input className="gov-input w-full px-3 py-2.5 text-sm" type="date" name="dateFrom" defaultValue={sp.dateFrom ?? ""} />
        </div>
        <div className="min-w-[10rem] flex-1 sm:max-w-[11rem]">
          <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">إلى تاريخ</label>
          <input className="gov-input w-full px-3 py-2.5 text-sm" type="date" name="dateTo" defaultValue={sp.dateTo ?? ""} />
        </div>
        <button type="submit" className="gov-btn-primary px-5 py-2.5 text-sm font-semibold">تطبيق</button>
      </form>
    );
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
    content = (
      <AdminSocialServicesTableWithSearch
        title={socialServiceCategoryLabelAr[activeCategory]}
        rows={rows}
        filterForm={filterForm}
      />
    );
  }

  return (
    <div>
      <header className="gov-page-heading mb-6 border-b border-[var(--gov-border)] pb-4">
        <h1 className="text-lg font-bold text-[var(--gov-text)] md:text-xl">الخدمات الاجتماعية</h1>
        <p className="mt-1 text-sm text-[var(--gov-muted)]">اضغط على الخدمة من الأعلى ليظهر جدولها بالأسفل.</p>
      </header>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map((s) => (
          <Link key={s.key} href={`/admin/social-services?tab=${encodeURIComponent(s.key)}`} className={`inline-flex min-h-11 items-center justify-center px-4 text-sm font-bold no-underline ${activeKey === s.key ? "gov-btn-primary" : "gov-btn-secondary"}`}>
            {s.label}
          </Link>
        ))}
      </div>
      {content}
    </div>
  );
}
