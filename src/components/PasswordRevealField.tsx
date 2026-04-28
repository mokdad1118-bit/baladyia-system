"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";

type Props = {
  name: string;
  /** لربط التسمية بالحقل من الخارج */
  inputId?: string;
  required?: boolean;
  minLength?: number;
  autoComplete: string;
  inputClassName?: string;
  /** زر الإظهار بمحاذاة نهاية الحقل */
  variant?: "emerald" | "gov";
};

export function PasswordRevealField({
  name,
  inputId,
  required = true,
  minLength,
  autoComplete,
  inputClassName,
  variant = "gov",
}: Props) {
  const autoId = useId();
  const id = inputId ?? autoId;
  const [show, setShow] = useState(false);
  const btn =
    variant === "emerald"
      ? "text-emerald-800 hover:text-emerald-950"
      : "text-[var(--gov-primary)] hover:underline";

  return (
    <div className="relative w-full">
      <input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        className={cn(
          "gov-input w-full py-2.5 text-sm outline-none focus:ring-2",
          "ps-3 pe-[4.5rem]",
          variant === "emerald" ? "focus:ring-emerald-600/35" : "focus:ring-1 focus:ring-[var(--gov-primary)]",
          inputClassName,
        )}
      />
      {/* pointer-events-none على الحاوية ثم تفعيلها على الزر فقط — يمنع تسرب النقر إلى الحقل خلف الزر */}
      <div className="pointer-events-none absolute end-0 top-0 bottom-0 z-10 flex items-stretch pe-1">
        <button
          type="button"
          tabIndex={0}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShow((v) => !v);
          }}
          className={cn(
            "pointer-events-auto touch-manipulation self-center rounded-md px-2.5 py-2 text-xs font-semibold",
            "min-h-10 min-w-[3.25rem] shrink-0",
            btn,
          )}
          aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
        >
          {show ? "إخفاء" : "إظهار"}
        </button>
      </div>
    </div>
  );
}
