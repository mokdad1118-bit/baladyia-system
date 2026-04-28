import Link from "next/link";
import { cn } from "@/lib/cn";

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("mt-auto border-t border-[var(--gov-border)] bg-emerald-50/50", className)}>
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--gov-muted)]">بوابة إلكترونية — مجلس المدينة. جميع الحقوق محفوظة.</p>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link className="text-[var(--gov-primary)] hover:underline" href="/services">
            الخدمات
          </Link>
        </div>
      </div>
    </footer>
  );
}
