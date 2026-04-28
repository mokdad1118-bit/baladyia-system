"use client";



import { signOut } from "next-auth/react";

import { cn } from "@/lib/cn";



export function LogoutForm({

  className,

  compact,

  callbackUrl,

}: {

  className?: string;

  compact?: boolean;

  /** إن وُجد يُستخدم بدل الصفحة الرئيسية بعد الخروج */

  callbackUrl?: string;

}) {

  return (

    <form

      action={async () => {

        await signOut({ callbackUrl: callbackUrl ?? "/" });

      }}

    >

      <button

        type="submit"

        className={cn(

          "cursor-pointer rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-700",

          compact

            ? "px-1.5 py-1.5 text-xs text-emerald-900"

            : "px-2 py-1.5 text-sm",

          className,

        )}

        aria-label="تسجيل الخروج"

      >

        {compact ? "خروج" : "تسجيل خروج"}

      </button>

    </form>

  );

}

