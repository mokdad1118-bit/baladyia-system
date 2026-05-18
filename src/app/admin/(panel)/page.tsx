import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/enums";
import { requestCounts } from "@/lib/request-stats";
import { staffNavPermissions } from "@/lib/staff-permissions";
import { AdminHomeDashboardWithSearch } from "@/components/admin/AdminHomeDashboardWithSearch";
import { db } from "@/lib/db";
import { staffMunicipalityIdFilter } from "@/lib/municipality-scope";
import { isSuperAdminRole } from "@/lib/roles";

const adminTiles = [
  { href: "/admin/services", title: "الخدمات", sub: "النماذج والمستندات والأسعار", perm: "manageServices" as const },
  { href: "/admin/users", title: "حسابات الموظفين", sub: "موظفون ومديرون", perm: "manageUsers" as const },
  { href: "/admin/citizens", title: "حسابات المواطنين", sub: "عرض وتفعيل الحسابات", perm: null },
  { href: "/admin/requests", title: "طلبات خدمات المدينة", sub: "عرض شامل", perm: null },
  { href: "/admin/stats", title: "الإحصائيات", sub: "تقارير", perm: "viewStats" as const },
] as const;

export default async function AdminHomePage() {
  const s = await auth();
  const mun = staffMunicipalityIdFilter(s);
  const isAdmin = isSuperAdminRole(s?.user?.role ?? UserRole.CITIZEN);
  const perms = staffNavPermissions(s);
  const [c, gasRequestsCount, socialRequestsCount] = await Promise.all([
    requestCounts(mun),
    db.gasRequest.count({ where: mun }),
    db.socialServiceCase.count({ where: mun }),
  ]);

  if (s?.user?.role === UserRole.EMPLOYEE) {
    const cards = [
      { label: "إجمالي الطلبات", value: c.total, href: "/admin/requests" },
      { label: "طلبات جديدة", value: c.pending, href: "/admin/requests?status=PENDING" },
      { label: "قيد المراجعة", value: c.underReview, href: "/admin/requests?status=UNDER_REVIEW" },
      { label: "بحاجة تعديل", value: c.needsModification, href: "/admin/requests?status=NEEDS_MODIFICATION" },
      { label: "مكتملة", value: c.completed, href: "/admin/requests?status=COMPLETED" },
    ] as const;
    const extraTiles = adminTiles.filter((t) => !t.perm || perms[t.perm]);
    return (
      <AdminHomeDashboardWithSearch
        variant="employee"
        isAdmin={false}
        employeeQuickStats={[...cards]}
        employeeExtraTiles={extraTiles.map((t) => ({ href: t.href, title: t.title, sub: t.sub }))}
      />
    );
  }

  const stats = [
    { label: "إجمالي الطلبات", value: c.total },
    { label: "جديدة", value: c.pending },
    { label: "قيد المراجعة", value: c.underReview },
    { label: "مكتملة", value: c.completed },
    { label: "طلبات خدمات الغاز", value: gasRequestsCount },
    { label: "طلبات الخدمات الاجتماعية", value: socialRequestsCount },
  ] as const;

  return (
    <AdminHomeDashboardWithSearch
      variant="admin"
      isAdmin={Boolean(isAdmin)}
      adminStats={[...stats]}
      adminTiles={isAdmin ? adminTiles.map((t) => ({ href: t.href, title: t.title, sub: t.sub })) : []}
    />
  );
}
