import { requestStatusAr } from "@/lib/labels";
import { RequestStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/cn";

/** ألوان هادئة مع لمسات محدودة من ألوان العلم عند الحاجة */
const colors: Record<RequestStatus, string> = {
  PENDING: "border-[var(--gov-border)] bg-emerald-50/80 text-[var(--gov-text)]",
  UNDER_REVIEW: "border-[var(--gov-border)] bg-[#dceee4] text-[var(--gov-primary)]",
  NEEDS_MODIFICATION: "border-[var(--gov-flag-black)]/25 bg-emerald-50/90 text-[var(--gov-text)]",
  APPROVED: "border-[var(--gov-flag-green)]/40 bg-emerald-100/50 text-[var(--gov-text)]",
  REJECTED: "border-[var(--gov-flag-red)]/35 bg-[var(--gov-flag-red)]/6 text-[var(--gov-text)]",
  COMPLETED: "border-[var(--gov-primary)]/35 bg-[#d4ebe0] text-[var(--gov-primary)]",
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-sm border px-2 py-0.5 text-xs font-semibold",
        colors[status],
      )}
    >
      {requestStatusAr[status]}
    </span>
  );
}
