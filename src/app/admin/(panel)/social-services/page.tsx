import Link from "next/link";

const sections = [
  { href: "/admin/returnee-registrations", label: "تسجيل العائدين" },
  { href: "/admin/social-services/divorced", label: "المطلقات" },
  { href: "/admin/social-services/widows", label: "الأرامل" },
  { href: "/admin/social-services/orphans", label: "الأيتام" },
  { href: "/admin/social-services/disabilities", label: "الإعاقات" },
  { href: "/admin/social-services/chronic-diseases", label: "الأمراض المزمنة" },
  { href: "/admin/social-services/family-census", label: "الإحصاء العام للعوائل" },
];

export default function AdminSocialServicesIndexPage() {
  return (
    <div>
      <header className="gov-page-heading mb-6 border-b border-[var(--gov-border)] pb-4">
        <h1 className="text-lg font-bold text-[var(--gov-text)] md:text-xl">الخدمات الاجتماعية</h1>
        <p className="mt-1 text-sm text-[var(--gov-muted)]">كل خدمة ضمن قائمة مستقلة مع البحث والتصدير.</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="gov-btn-primary inline-flex min-h-11 items-center justify-center px-4 text-sm font-bold no-underline">
            {s.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
