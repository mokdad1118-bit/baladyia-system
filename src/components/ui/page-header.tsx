import { cn } from "@/lib/cn";
import { type ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
  className,
  elideTitleOnMobile,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  /** عند وضع واجهة الجوال للمواطن: إخفاء العنوان المكرر مع شريط التطبيق */
  elideTitleOnMobile?: boolean;
}) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-end sm:justify-between",
        elideTitleOnMobile && "mb-4 border-0 pb-0 md:mb-8 md:border-b md:pb-6",
        className,
      )}
    >
      <div className="min-w-0">
        <h1
          className={cn(
            "text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl",
            elideTitleOnMobile && "hidden md:block",
          )}
        >
          {title}
        </h1>
        {description && (
          <p
            className={cn(
              "mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base",
              elideTitleOnMobile && "mt-0 md:mt-1.5",
            )}
          >
            {description}
          </p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
