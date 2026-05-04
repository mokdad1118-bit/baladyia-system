"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import type { StaffNavPermissions } from "@/lib/staff-permissions";

const segments = [
  { internal: "/admin", label: "لوحة التحكم", desc: "نظرة عامة", perm: null },
  { internal: "/admin/requests", label: "الطلبات", desc: "مراجعة وتحديث الحالة", perm: null },
  {
    internal: "/admin/services",
    label: "الخدمات",
    desc: "النماذج والمستندات والأسعار",
    perm: "manageServices" as const,
  },
  { internal: "/admin/citizens", label: "حسابات المواطنين", desc: "عرض حسابات المسجّلين", perm: null },
  {
    internal: "/admin/users",
    label: "حسابات الموظفين",
    desc: "الموظفون والمديرون والصلاحيات",
    perm: "manageUsers" as const,
  },
  { internal: "/admin/stats", label: "الإحصائيات", desc: "تقارير", perm: "viewStats" as const },
] as const;

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

export function AdminNav({
  staffPerms,
  staffRoot,
}: {
  staffPerms: StaffNavPermissions;
  staffRoot: boolean;
}) {
  const path = usePathname() ?? "";
  const items = segments.filter((i) => !i.perm || staffPerms[i.perm]);
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
                "text-sm font-semibold",
                active ? "text-[var(--gov-primary)]" : "text-[var(--gov-text)]",
              )}
            >
              {i.label}
            </span>
            <span className="text-[0.7rem] text-[var(--gov-muted)]">{i.desc}</span>
          </Link>
        );
      })}
    </nav>
  );
}
