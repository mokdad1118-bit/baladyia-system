import { cn } from "@/lib/cn";
import { forwardRef, type ButtonHTMLAttributes, type Ref } from "react";

const variantClass = {
  default:
    "bg-emerald-700 text-white shadow-sm hover:bg-emerald-800 focus-visible:ring-emerald-600/40",
  secondary:
    "border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50",
  outline:
    "border border-slate-300/80 bg-transparent text-slate-800 hover:border-emerald-500/50 hover:bg-emerald-50/60",
  ghost: "text-slate-700 hover:bg-slate-100/90",
  danger: "bg-rose-600 text-white shadow-sm hover:bg-rose-700",
  link: "text-emerald-800 underline-offset-2 hover:underline",
} as const;

const sizeClass = {
  sm: "h-8 px-3 text-sm rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-12 px-6 text-base rounded-xl",
} as const;

type Variant = keyof typeof variantClass;
type Size = keyof typeof sizeClass;

export const Button = forwardRef(function Button(
  {
    className,
    variant = "default",
    size = "md",
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
  },
  ref: Ref<HTMLButtonElement>,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center font-medium transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    />
  );
});
