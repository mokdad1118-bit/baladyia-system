import { SocialServiceCaseStatus } from "@/generated/prisma/enums";
import { socialServiceStatusLabelAr } from "@/lib/social-service-labels";

const cls: Record<SocialServiceCaseStatus, string> = {
  PENDING: "border-[var(--gov-border)] bg-amber-50/90 text-[var(--gov-text)]",
  UNDER_REVIEW: "border-[var(--gov-border)] bg-[#dceee4] text-[var(--gov-primary)]",
  APPROVED: "border-emerald-200 bg-emerald-100 text-emerald-800",
  REJECTED: "border-red-200 bg-red-100 text-red-700",
};

export function SocialServiceCaseStatusBadge({ status }: { status: SocialServiceCaseStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cls[status]}`}>
      {socialServiceStatusLabelAr[status]}
    </span>
  );
}
