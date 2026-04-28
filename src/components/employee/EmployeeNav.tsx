"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const items = [
  { href: "/employee", label: "لوحة التحكم", desc: "إحصائيات سريعة" },
  { href: "/employee/requests", label: "الطلبات", desc: "مراجعة وتحديث الحالة" },
] as const;

export function EmployeeNav() {
  const path = usePathname();
  return (
    <nav className="space-y-1">
      {items.map((i) => {
        const active =
          i.href === "/employee"
            ? path === "/employee"
            : path === i.href || path.startsWith(`${i.href}/`);
        return (
          <Link
            key={i.href}
            href={i.href}
            className={cn(
              "flex flex-col gap-0.5 border border-transparent px-2.5 py-2 text-start transition",
              active
                ? "border-[var(--gov-border)] bg-[#eef2f6]"
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
