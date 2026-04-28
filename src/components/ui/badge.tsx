import { cn } from "@/lib/cn";
import { type HTMLAttributes } from "react";

export function Badge({
  className,
  children,
  ...p
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border border-slate-200/90 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700",
        className,
      )}
      {...p}
    >
      {children}
    </span>
  );
}
