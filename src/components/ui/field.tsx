import { cn } from "@/lib/cn";
import { type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";

const inputClass =
  "w-full rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm transition-[border,box-shadow] placeholder:text-slate-400 focus:border-emerald-600/50 focus:ring-2 focus:ring-emerald-600/25 focus:outline-none";

export function Input({
  className,
  ...p
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, className)} {...p} />;
}

export function Textarea({
  className,
  ...p
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputClass, "min-h-[5rem] resize-y", className)} {...p} />;
}

export function FieldLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <label className={cn("mb-1.5 block text-sm font-medium text-slate-700", className)}>
      {children}
    </label>
  );
}

export function FieldGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("space-y-1.5", className)}>{children}</div>;
}
