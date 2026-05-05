"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { IconGrid, IconInbox, IconBellSm, IconUserSm } from "./citizen-icons";

function buildTabs(base: "" | "/citizen") {
  const services = `${base}/services`;
  const requests = `${base}/requests`;
  const notificationsPath = `${base}/notifications`;
  const account = `${base}/account`;
  return [
    {
      href: services,
      label: "الخدمات",
      match: (p: string) => p === services || p.startsWith(`${services}/`),
      Icon: IconGrid,
    },
    {
      href: requests,
      label: "طلباتي",
      match: (p: string) =>
        p === requests ||
        (p.startsWith(`${requests}/`) && !p.includes("/new/")),
      Icon: IconInbox,
    },
    {
      href: notificationsPath,
      label: "تنبيهات",
      match: (p: string) => p === notificationsPath || p.startsWith(`${notificationsPath}/`),
      Icon: IconBellSm,
    },
    {
      href: account,
      label: "حسابي",
      match: (p: string) => p === account || p.startsWith(`${account}/`),
      Icon: IconUserSm,
    },
  ] as const;
}

export function CitizenBottomNav({ unreadNotifications = 0 }: { unreadNotifications?: number }) {
  const path = usePathname() ?? "";
  const base: "" | "/citizen" = path.startsWith("/citizen") ? "/citizen" : "";
  const tabs = buildTabs(base);

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
          const showUnreadBadge =
            unreadNotifications > 0 && (href.endsWith("/notifications") || href === "/notifications");
          const badge =
            unreadNotifications > 99 ? "99+" : String(unreadNotifications);
          return (
            <li key={href} className="min-w-0 flex-1">
              <Link
                href={href}
                className={cn(
                  "touch-manipulation flex min-h-[3.5rem] flex-col items-center justify-center py-1.5 text-center active:opacity-80",
                  active ? "text-[var(--gov-primary)]" : "text-[var(--gov-muted)]",
                )}
                aria-current={active ? "page" : undefined}
                aria-label={
                  showUnreadBadge ? `${label}، ${unreadNotifications} غير مقروء` : undefined
                }
              >
                <span
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-0.5 rounded-full px-2.5 py-1 transition-shadow",
                    active &&
                      "ring-2 ring-[var(--gov-primary)] ring-offset-2 ring-offset-white shadow-[0_0_0_1px_rgba(0,0,0,0.04)]",
                  )}
                >
                  <Icon className={cn("h-6 w-6 shrink-0", active && "text-[var(--gov-primary)]")} />
                  {showUnreadBadge ? (
                    <span
                      className="absolute end-1 top-0 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-[var(--gov-primary)] px-1 text-[0.65rem] font-bold leading-none text-white"
                      aria-hidden
                    >
                      {badge}
                    </span>
                  ) : null}
                  <span className="text-[0.7rem] font-medium leading-tight sm:text-xs">{label}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
