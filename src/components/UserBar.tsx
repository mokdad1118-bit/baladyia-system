"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { UserRole } from "@/generated/prisma/enums";
import { userRoleAr } from "@/lib/labels";
import { LogoutForm } from "./LogoutForm";
import { cn } from "@/lib/cn";
import { Button } from "./ui/button";
import { IconMenu, IconX } from "./icons";

const linkBase =
  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100/90 hover:text-slate-900";

function navActive(href: string, path: string) {
  if (href.startsWith("http")) return false;
  if (href === "/") return path === "/";
  if (href === "/admin") return path === "/admin" || path.startsWith("/admin/");
  return path === href || path.startsWith(href + "/");
}

function contactLine(email: string, phone: string) {
  if (email) return email;
  if (phone) return `واتساب ${phone}`;
  return "—";
}

export function UserBar({
  name,
  email,
  phone,
  role,
  unread,
}: {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  unread: number;
}) {
  const c = contactLine(email, phone);
  const [open, setOpen] = useState(false);
  const path = usePathname();

  const staffOrigin = process.env.NEXT_PUBLIC_STAFF_PORTAL_URL?.replace(/\/$/, "");
  const staffBoardHref = staffOrigin ? `${staffOrigin}/` : "/admin";

  const items: { href: string; label: string; show: boolean }[] = [
    { href: "/services", label: "الخدمات", show: role === UserRole.CITIZEN },
    { href: "/requests", label: "طلباتي", show: role === UserRole.CITIZEN },
    {
      href: "/notifications",
      label: unread > 0 ? `إشعارات (${unread})` : "الإشعارات",
      show: role === UserRole.CITIZEN,
    },
    {
      href: staffBoardHref,
      label: "لوحة التحكم",
      show: role === UserRole.EMPLOYEE || role === UserRole.ADMIN,
    },
    {
      href: "/gas-agent",
      label: "طلبات الغاز",
      show: role === UserRole.GAS_AGENT,
    },
  ].filter((x) => x.show);

  return (
    <>
      <div className="hidden items-center gap-1 lg:flex">
        {items.map((i) => (
          <Link
            key={i.href}
            className={cn(
              linkBase,
              navActive(i.href, path) && "bg-emerald-50/90 font-semibold text-emerald-900",
            )}
            href={i.href}
            aria-current={navActive(i.href, path) ? "page" : undefined}
          >
            {i.label}
          </Link>
        ))}
        <div className="ms-1 me-1 h-6 w-px bg-slate-200" aria-hidden />
        <span className="max-w-[9rem] truncate text-xs text-slate-500" title={c}>
          {name} · {userRoleAr[role]}
        </span>
        <LogoutForm />
      </div>

      <div className="flex items-center gap-2 lg:hidden">
        {unread > 0 && (
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-600" aria-label="تنبيهات" />
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="border-slate-200"
          onClick={() => setOpen(true)}
          aria-label="فتح القائمة"
        >
          <IconMenu className="h-5 w-5" />
        </Button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal>
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="إغلاق"
          />
          <div className="absolute end-0 top-0 flex h-full w-[min(20.5rem,92vw)] flex-col border-s border-slate-200/80 bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-semibold text-slate-900">القائمة</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} aria-label="إغلاق">
                <IconX className="h-5 w-5" />
              </Button>
            </div>
            <p className="mb-3 rounded-xl bg-slate-50 p-2 text-xs text-slate-600">
              {name} · {userRoleAr[role]}
            </p>
            <nav className="flex flex-1 flex-col gap-1" onClick={() => setOpen(false)}>
              {items.map((i) => (
                <Link
                  key={i.href}
                  className={cn(
                    linkBase,
                    "w-full",
                    navActive(i.href, path) && "bg-emerald-50/90 font-semibold text-emerald-900",
                  )}
                  href={i.href}
                >
                  {i.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto border-t border-slate-100 pt-3" onClick={() => setOpen(false)}>
              <LogoutForm />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
