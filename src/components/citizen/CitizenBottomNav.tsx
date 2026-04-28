"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { IconGrid, IconInbox, IconBellSm } from "./citizen-icons";

const tabs: { href: string; label: string; match: (p: string) => boolean; Icon: typeof IconGrid }[] = [
  {
    href: "/services",
    label: "الخدمات",
    match: (p) => p === "/services" || p.startsWith("/services/"),
    Icon: IconGrid,
  },
  {
    href: "/requests",
    label: "طلباتي",
    match: (p) => p === "/requests" || (p.startsWith("/requests/") && !p.includes("/new/")),
    Icon: IconInbox,
  },
  {
    href: "/notifications",
    label: "تنبيهات",
    match: (p) => p.startsWith("/notifications"),
    Icon: IconBellSm,
  },
];

export function CitizenBottomNav() {
  const path = usePathname() ?? "";
  return (
    <nav
      className="fixed end-0 bottom-0 start-0 z-50 border-t border-[var(--gov-border)] bg-white md:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      role="navigation"
      aria-label="تنقّل المواطن"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {tabs.map(({ href, label, match, Icon }) => {
          const active = match(path);
          return (
            <li key={href} className="min-w-0 flex-1">
              <Link
                href={href}
                className={cn(
                  "touch-manipulation flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 py-1.5 text-center active:opacity-80",
                  active ? "text-[var(--gov-primary)]" : "text-[var(--gov-muted)]",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className={cn("h-6 w-6 shrink-0", active && "text-[var(--gov-primary)]")} />
                <span className="text-[0.7rem] font-medium leading-tight sm:text-xs">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
