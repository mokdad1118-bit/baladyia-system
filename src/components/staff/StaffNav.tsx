"use client";



import Link from "next/link";

import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";



export function StaffNav({ showAdmin = false }: { showAdmin?: boolean }) {

  const path = usePathname() ?? "";

  const staffRoot = !path.startsWith("/admin");

  const requestsHref = staffRoot ? "/requests" : "/admin/requests";

  const adminHomeHref = "/admin";

  const requestsActive = staffRoot

    ? path === "/requests" || path.startsWith("/requests/")

    : path.startsWith("/admin/requests");



  return (

    <nav className="space-y-1">

      <Link

        href={requestsHref}

        prefetch={false}

        className={cn(

          "flex flex-col gap-0.5 rounded-xl border border-transparent px-3 py-2.5 text-start transition",

          requestsActive ? "border-emerald-200/90 bg-white shadow-sm" : "hover:border-slate-200/80 hover:bg-white/60",

        )}

      >

        <span className={cn("text-sm font-semibold", requestsActive ? "text-emerald-900" : "text-slate-800")}>

          الطلبات

        </span>

        <span className="text-[0.7rem] text-slate-500">مراجعة وتحديث الحالة</span>

      </Link>

      {showAdmin && (

        <Link

          href={adminHomeHref}

          prefetch={false}

          className="mt-2 block rounded-xl border border-dashed border-slate-300/80 bg-slate-50/50 px-3 py-2 text-sm text-slate-600 transition hover:border-emerald-400 hover:bg-emerald-50/60"

        >

          لوحة الإدارة

        </Link>

      )}

    </nav>

  );

}

