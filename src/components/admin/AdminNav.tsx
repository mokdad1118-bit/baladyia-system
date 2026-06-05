"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import type { StaffNavPermissions } from "@/lib/staff-permissions";
import type { AdminNavBadgeCounts } from "@/lib/admin-nav-badges";

function NavNewBadge({ count, ariaLabel }: { count: number; ariaLabel: string }) {
  if (count <= 0) return null;
  return (
    <span
      className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--gov-primary)] px-1.5 py-0.5 text-[0.65rem] leading-none text-white"
      aria-label={ariaLabel}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

type NavSegment = {
  internal: string;
  label: string;
  desc: string;
  perm: null | keyof StaffNavPermissions;
  badgeKey?: keyof AdminNavBadgeCounts;
  superAdminOnly?: boolean;
  adminOnly?: boolean;
  exact?: boolean;
  children?: readonly NavSegment[];
};

const segments: readonly NavSegment[] = [
  { internal: "/admin", label: "لوحة التحكم", desc: "نظرة عامة", perm: null },
  {
    internal: "/admin/social-services",
    label: "الخدمات",
    desc: "الخدمات الاجتماعية والمدينة والغاز",
    perm: null,
    children: [
      {
        internal: "/admin/social-services",
        label: "الخدمات الاجتماعية",
        desc: "العائدين وباقي الأقسام الاجتماعية",
        perm: "manageSocialServices",
        badgeKey: "social",
      },
      {
        internal: "/admin/requests",
        label: "طلبات خدمات المدينة",
        desc: "مراجعة وتحديث الحالة",
        perm: "viewRequests",
        badgeKey: "cityServiceRequests",
      },
      {
        internal: "/admin/gas-services",
        label: "خدمات الغاز",
        desc: "طلبات خدمات الغاز",
        perm: "manageGas",
        badgeKey: "gas",
      },
      {
        internal: "/admin/services",
        label: "إدارة الخدمات",
        desc: "النماذج والمستندات والأسعار",
        perm: "manageServices",
        exact: true,
      },
      {
        internal: "/admin/services/in-person",
        label: "الخدمات المقدمة حضورياً",
        desc: "الخدمات المقدمة داخل البلدية",
        perm: "manageInPersonRequests",
        exact: true,
      },
      {
        internal: "/admin/services/in-person/completed",
        label: "الطلبات المنتهية",
        desc: "تفاصيل الطلبات الحضورية وأرقامها الخاصة",
        perm: "manageInPersonRequests",
      },
    ],
  },
  {
    internal: "/admin/citizen-feedback",
    label: "شكاوى واقتراحات المواطنين",
    desc: "ملاحظات المستخدمين على التطبيق",
    perm: "manageCitizenFeedback",
    badgeKey: "feedback",
  },
  {
    internal: "/admin/area-news",
    label: "أخبار المنطقة",
    desc: "مناشير تظهر داخل تطبيق المواطن",
    perm: "manageAreaNews",
  },
  {
    internal: "/admin/archive",
    label: "الأرشيف",
    desc: "حفظ ملفات الطلبات وفلترتها وتصديرها",
    perm: "manageArchive",
  },
  {
    internal: "/admin/broadcast-notifications",
    label: "إرسال الإشعارات",
    desc: "للمواطنين والمستخدمين",
    perm: null,
    adminOnly: true,
  },
  {
    internal: "/admin/operation-log",
    label: "سجل العمليات",
    desc: "كل ما يحدث داخل النظام",
    perm: "viewOperationLog",
  },
  { internal: "/admin/stats", label: "الإحصائيات", desc: "تقارير", perm: "viewStats" },
  {
    internal: "/admin/municipalities",
    label: "إدارة البلديات",
    desc: "إضافة وتعديل بلديات المحافظة",
    perm: null,
    superAdminOnly: true,
  },
  {
    internal: "/admin/municipalities/compare",
    label: "مقارنة البلديات",
    desc: "تقرير إحصائي على مستوى المحافظة",
    perm: null,
    superAdminOnly: true,
  },
  { internal: "/admin/citizens", label: "حسابات المواطنين", desc: "عرض حسابات المسجّلين", perm: "viewCitizens" },
  {
    internal: "/admin/users",
    label: "حسابات الموظفين",
    desc: "الموظفون والمديرون والصلاحيات",
    perm: "manageUsers",
  },
];

function hrefFor(staffRoot: boolean, internal: string) {
  if (!staffRoot) return internal;
  if (internal === "/admin") return "/";
  return internal.replace(/^\/admin/, "") || "/";
}

function navActive(staffRoot: boolean, internal: string, path: string, exact = false) {
  const href = hrefFor(staffRoot, internal);
  if (href === "/") return path === "/" || path === "";
  if (internal === "/admin") return staffRoot ? path === "/" || path === "" : path === "/admin";
  if (exact) return path === href;
  return path === href || path.startsWith(`${href}/`);
}

const BADGE_ARIA: Record<keyof AdminNavBadgeCounts, string> = {
  cityServiceRequests: "طلبات خدمات المدينة الجديدة غير المفتوحة",
  gas: "طلبات غاز جديدة لم تُعرض بعد",
  social: "طلبات اجتماعية أو عائدين جديدة لم تُعرض بعد",
  feedback: "شكاوى أو اقتراحات جديدة لم تُعرض بعد",
};

export function AdminNav({
  staffPerms,
  staffRoot,
  badgeCounts,
  isSuperAdmin = false,
  isAdminManager = false,
}: {
  staffPerms: StaffNavPermissions;
  staffRoot: boolean;
  badgeCounts: AdminNavBadgeCounts;
  isSuperAdmin?: boolean;
  isAdminManager?: boolean;
}) {
  const path = usePathname() ?? "";
  const isVisible = (item: NavSegment): boolean => {
    if (item.superAdminOnly && !isSuperAdmin) return false;
    if (item.adminOnly && !isAdminManager) return false;
    if (item.children) return item.children.some(isVisible);
    if (!item.perm) return true;
    return staffPerms[item.perm];
  };
  const items = segments.filter(isVisible);

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const visibleChildren = item.children?.filter(isVisible) ?? [];
        const primaryInternal = visibleChildren[0]?.internal ?? item.internal;
        const href = hrefFor(staffRoot, primaryInternal);
        const active = visibleChildren.length
          ? visibleChildren.some((child) => navActive(staffRoot, child.internal, path, child.exact))
          : navActive(staffRoot, item.internal, path, item.exact);

        return (
          <div key={item.internal}>
            <Link
              href={href}
              prefetch={false}
              className={cn(
                "group flex flex-col gap-0.5 border border-transparent px-2.5 py-2 text-start transition",
                active
                  ? "border-[var(--gov-border)] bg-[#e4f0ea]"
                  : "hover:border-[var(--gov-border)] hover:bg-white/80",
              )}
            >
              <span
                className={cn(
                  "flex items-center gap-2 text-sm font-semibold",
                  active ? "text-[var(--gov-primary)]" : "text-[var(--gov-text)]",
                )}
              >
                {item.label}
                {item.badgeKey ? (
                  <NavNewBadge count={badgeCounts[item.badgeKey]} ariaLabel={BADGE_ARIA[item.badgeKey]} />
                ) : null}
              </span>
              <span className="text-[0.7rem] text-[var(--gov-muted)]">{item.desc}</span>
            </Link>

            {visibleChildren.length ? (
              <div className="ms-3 mt-1 space-y-1 border-s border-[var(--gov-border)] ps-2">
                {visibleChildren.map((child) => {
                  const childHref = hrefFor(staffRoot, child.internal);
                  const childActive = navActive(staffRoot, child.internal, path, child.exact);

                  return (
                    <Link
                      key={child.internal}
                      href={childHref}
                      prefetch={false}
                      className={cn(
                        "flex flex-col gap-0.5 border border-transparent px-2.5 py-1.5 text-start transition",
                        childActive
                          ? "border-[var(--gov-border)] bg-white text-[var(--gov-primary)]"
                          : "text-[var(--gov-text)] hover:border-[var(--gov-border)] hover:bg-white/80",
                      )}
                    >
                      <span className="flex items-center gap-2 text-[0.8rem] font-semibold">
                        {child.label}
                        {child.badgeKey ? (
                          <NavNewBadge count={badgeCounts[child.badgeKey]} ariaLabel={BADGE_ARIA[child.badgeKey]} />
                        ) : null}
                      </span>
                      <span className="text-[0.65rem] text-[var(--gov-muted)]">{child.desc}</span>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
