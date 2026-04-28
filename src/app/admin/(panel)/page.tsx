import Link from "next/link";
import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/enums";
import { requestCounts } from "@/lib/request-stats";

const adminTiles = [
  { href: "/admin/services", title: "الخدمات", sub: "النماذج والمستندات والأسعار" },
  { href: "/admin/users", title: "حسابات الموظفين", sub: "موظفون ومديرون" },
  { href: "/admin/citizens", title: "حسابات المواطنين", sub: "عرض وتفعيل الحسابات" },
  { href: "/admin/requests", title: "الطلبات", sub: "عرض شامل" },
  { href: "/admin/stats", title: "الإحصائيات", sub: "تقارير" },
] as const;

export default async function AdminHomePage() {
  const s = await auth();
  const isAdmin = s?.user?.role === UserRole.ADMIN;
  const c = await requestCounts();

  if (s?.user?.role === UserRole.EMPLOYEE) {
    const cards = [
      { label: "إجمالي الطلبات", value: c.total, href: "/admin/requests" },
      { label: "طلبات جديدة", value: c.pending, href: "/admin/requests?status=PENDING" },
      { label: "قيد المراجعة", value: c.underReview, href: "/admin/requests?status=UNDER_REVIEW" },
      { label: "بحاجة تعديل", value: c.needsModification, href: "/admin/requests?status=NEEDS_MODIFICATION" },
      { label: "مكتملة", value: c.completed, href: "/admin/requests?status=COMPLETED" },
    ] as const;
    return (
      <div>
        <div className="mb-6 border-b border-[var(--gov-border)] pb-4">
          <h1 className="text-xl font-bold text-[var(--gov-text)]">لوحة التحكم</h1>
          <p className="mt-1 text-sm text-[var(--gov-muted)]">معالجة الطلبات ومتابعة الحالات.</p>
        </div>
        <ul className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((x) => (
            <li key={x.label}>
              <Link href={x.href} className="gov-stat-card block no-underline transition hover:bg-[#f7f8fa]">
                <p className="text-sm text-[var(--gov-muted)]">{x.label}</p>
                <p className="gov-stat-value mt-1">{x.value}</p>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/admin/requests"
          className="gov-btn-primary inline-flex px-5 py-2.5 text-sm font-semibold no-underline"
        >
          عرض قائمة الطلبات
        </Link>
      </div>
    );
  }

  const stats = [
    { label: "إجمالي الطلبات", value: c.total },
    { label: "جديدة", value: c.pending },
    { label: "قيد المراجعة", value: c.underReview },
    { label: "مكتملة", value: c.completed },
  ] as const;

  return (
    <div>
      <div className="mb-6 border-b border-[var(--gov-border)] pb-4">
        <h1 className="text-xl font-bold text-[var(--gov-text)]">لوحة التحكم</h1>
        <p className="mt-1 text-sm text-[var(--gov-muted)]">إدارة الخدمات والمستخدمين والطلبات والتقارير.</p>
      </div>
      <ul className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((st) => (
          <li key={st.label} className="gov-stat-card">
            <p className="text-sm text-[var(--gov-muted)]">{st.label}</p>
            <p className="gov-stat-value mt-1">{st.value}</p>
          </li>
        ))}
      </ul>
      {isAdmin && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {adminTiles.map((t) => (
            <li key={t.href}>
              <Link href={t.href} className="gov-card block h-full p-5 no-underline transition hover:bg-[#f7f8fa]">
                <h2 className="text-base font-bold text-[var(--gov-text)]">{t.title}</h2>
                <p className="mt-1 text-sm text-[var(--gov-muted)]">{t.sub}</p>
                <span className="mt-3 inline-block text-sm font-semibold text-[var(--gov-primary)]">دخول ←</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
