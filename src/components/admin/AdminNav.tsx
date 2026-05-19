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

const segments = [
  { internal: "/admin", label: "لوحة التحكم", desc: "نظرة عامة", perm: null },
  {
    internal: "/admin/requests",
    label: "طلبات خدمات المدينة",
    desc: "مراجعة وتحديث الحالة",
    perm: "viewRequests" as const,
    badgeKey: "cityServiceRequests" as const,
  },
  {
    internal: "/admin/gas-services",
    label: "خدمات الغاز",
    desc: "طلبات خدمات الغاز",
    perm: "manageGas" as const,
    badgeKey: "gas" as const,
  },
  {
    internal: "/admin/social-services",
    label: "الخدمات الاجتماعية",
    desc: "العائدين وباقي الأقسام الاجتماعية",
    perm: "manageSocialServices" as const,
    badgeKey: "social" as const,
  },
  {
    internal: "/admin/citizen-feedback",
    label: "شكاوي واقتراحات المواطنين",
    desc: "ملاحظات المستخدمين على التطبيق",
    perm: "manageCitizenFeedback" as const,
    badgeKey: "feedback" as const,
  },
  {
    internal: "/admin/services",
    label: "الخدمات",
    desc: "النماذج والمستندات والأسعار",
    perm: "manageServices" as const,
  },
  { internal: "/admin/citizens", label: "حسابات المواطنين", desc: "عرض حسابات المسجّلين", perm: "viewCitizens" as const },
  {
    internal: "/admin/broadcast-notifications",
    label: "إرسال الإشعارات",
    desc: "OneSignal للمواطنين والمستخدمين",
    perm: null,
    adminOnly: true,
  },
  {
    internal: "/admin/operation-log",
    label: "سجل العمليات",
    desc: "كل ما يحدث داخل النظام",
    perm: "viewOperationLog" as const,
  },
  {
    internal: "/admin/users",
    label: "حسابات الموظفين",
    desc: "الموظفون والمديرون والصلاحيات",
    perm: "manageUsers" as const,
  },
  { internal: "/admin/stats", label: "الإحصائيات", desc: "تقارير", perm: "viewStats" as const },
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
] as const satisfies readonly {
  internal: string;
  label: string;
  desc: string;
  perm: null | keyof StaffNavPermissions;
  badgeKey?: keyof AdminNavBadgeCounts;
  superAdminOnly?: boolean;
  adminOnly?: boolean;
}[];

function hrefFor(staffRoot: boolean, internal: string) {
  if (!staffRoot) return internal;
  if (internal === "/admin") return "/";
  return internal.replace(/^\/admin/, "") || "/";
}

function navActive(staffRoot: boolean, internal: string, path: string) {
  const href = hrefFor(staffRoot, internal);
  if (href === "/") return path === "/" || path === "";
  if (internal === "/admin") return staffRoot ? path === "/" || path === "" : path === "/admin";
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
  const items = segments.filter((i) => {
    if ("superAdminOnly" in i && i.superAdminOnly && !isSuperAdmin) return false;
    if ("adminOnly" in i && i.adminOnly && !isAdminManager) return false;
    if (!i.perm) return true;
    return staffPerms[i.perm];
  });
  return (
    <nav className="space-y-1">
      {items.map((i) => {
        const href = hrefFor(staffRoot, i.internal);
        const active = navActive(staffRoot, i.internal, path);
        return (
          <Link
            key={i.internal}
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
              {i.label}
              {"badgeKey" in i && i.badgeKey ? (
                <NavNewBadge count={badgeCounts[i.badgeKey]} ariaLabel={BADGE_ARIA[i.badgeKey]} />
              ) : null}
            </span>
            <span className="text-[0.7rem] text-[var(--gov-muted)]">{i.desc}</span>
          </Link>
        );
      })}
    </nav>
  );
}
