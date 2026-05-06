import { ReturneeRegistrationStatus } from "@/generated/prisma/enums";
import { returneeRegistrationStatusLabelAr } from "@/lib/returnee-registration-labels";
import { cn } from "@/lib/cn";

const colors: Record<ReturneeRegistrationStatus, string> = {
  PENDING: "border-[var(--gov-border)] bg-amber-50/90 text-[var(--gov-text)]",
  UNDER_REVIEW: "border-[var(--gov-border)] bg-[#dceee4] text-[var(--gov-primary)]",
  APPROVED: "border-[var(--gov-flag-green)]/40 bg-emerald-100/60 text-emerald-900",
  REJECTED: "border-[var(--gov-flag-red)]/35 bg-[var(--gov-flag-red)]/6 text-[var(--gov-text)]",
};

export function ReturneeRegistrationStatusBadge({ status }: { status: ReturneeRegistrationStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-1 text-xs font-semibold",
        colors[status],
      )}
    >
      {returneeRegistrationStatusLabelAr[status]}
    </span>
  );
}
