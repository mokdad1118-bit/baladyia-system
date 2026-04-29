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
  variant?: "emerald" | "gov";
  /** إن وُجد الاثنان: حقل مُدار من الأب (لا يُفرغ عند إعادة الرسم بعد خطأ تسجيل الدخول) */
  value?: string;
  onValueChange?: (value: string) => void;
};

/**
 * قيمة كلمة المرور مُدارَة في React حتى لا تُفقد عند تبديل type بين password و text.
 * زر إظهار/إخفاء من نوع button فقط (بدون checkbox) لتفادي تعارض الحالة المتحكمة مع النقر على الموبايل.
 */
export function PasswordRevealField({
  name,
  inputId,
  required = true,
  minLength,
  autoComplete,
  inputClassName,
  variant = "gov",
  value: controlledValue,
  onValueChange,
}: Props) {
  const autoId = useId();
  const id = inputId ?? autoId;
  const [show, setShow] = useState(false);
  const [uncontrolled, setUncontrolled] = useState("");
  const isControlled =
    controlledValue !== undefined && typeof onValueChange === "function";
  const value = isControlled ? controlledValue : uncontrolled;
  const setValue = isControlled ? onValueChange! : setUncontrolled;
  const btn =
    variant === "emerald"
      ? "text-emerald-800 hover:bg-emerald-50 active:bg-emerald-100"
      : "text-[var(--gov-primary)] hover:bg-[#f3f6f4] active:bg-[#e8f0eb]";

  return (
    <div
      className={cn(
        "gov-input relative isolate min-h-[2.75rem] w-full overflow-hidden",
        variant === "emerald" && "border-emerald-200/80",
      )}
    >
      <input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        className={cn(
          "h-full min-h-[2.75rem] w-full border-0 bg-transparent py-2.5 ps-3 pe-[5.75rem] text-sm outline-none",
          "focus-visible:ring-2 focus-visible:ring-inset",
          variant === "emerald"
            ? "focus-visible:ring-emerald-600/35"
            : "focus-visible:ring-[var(--gov-primary)]",
          inputClassName,
        )}
      />
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShow((prev) => !prev);
        }}
        onMouseDown={(e) => {
          /* يقلل تعارض التركيز مع الحقل المتحكم (خصوصاً على الموبايل وواجهات RTL) */
          e.preventDefault();
        }}
        aria-pressed={show}
        aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
        className={cn(
          "absolute inset-y-0 end-0 z-[1] flex min-w-[5.25rem] touch-manipulation items-center justify-center border-s border-[var(--gov-border)] bg-white px-3 text-xs font-semibold outline-none select-none",
          "focus-visible:ring-2 focus-visible:ring-inset",
          variant === "emerald"
            ? "border-emerald-200/80 focus-visible:ring-emerald-600/45"
            : "focus-visible:ring-[var(--gov-primary)]",
          btn,
        )}
      >
        <span className="whitespace-nowrap">{show ? "إخفاء" : "إظهار"}</span>
      </button>
    </div>
  );
}
