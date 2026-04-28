import Link from "next/link";
import { requestCounts } from "@/lib/request-stats";

export default async function EmployeeDashboardPage() {
  const c = await requestCounts();
  const cards = [
    { label: "إجمالي الطلبات", value: c.total, href: "/employee/requests" },
    { label: "طلبات جديدة", value: c.pending, href: "/employee/requests?status=PENDING" },
    { label: "قيد المراجعة", value: c.underReview, href: "/employee/requests?status=UNDER_REVIEW" },
    { label: "بحاجة تعديل", value: c.needsModification, href: "/employee/requests?status=NEEDS_MODIFICATION" },
    { label: "مكتملة", value: c.completed, href: "/employee/requests?status=COMPLETED" },
  ] as const;
  return (
    <div>
      <div className="mb-6 border-b border-[var(--gov-border)] pb-4">
        <h1 className="text-xl font-bold text-[var(--gov-text)]">لوحة التحكم</h1>
        <p className="mt-1 text-sm text-[var(--gov-muted)]">ملخص الطلبات — جاهز للتوسع لاحقاً بتوزيع الأقسام والموظفين.</p>
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
        href="/employee/requests"
        className="gov-btn-primary inline-flex px-5 py-2.5 text-sm font-semibold no-underline"
      >
        عرض قائمة الطلبات
      </Link>
    </div>
  );
}
