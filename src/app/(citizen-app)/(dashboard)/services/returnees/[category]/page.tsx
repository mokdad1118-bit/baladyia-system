import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole, SocialServiceCategory } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { submitSocialServiceCase } from "@/actions/social-service-case";
import { socialServiceCategoryLabelAr } from "@/lib/social-service-labels";
import { SocialServiceCaseForm } from "@/components/citizen/SocialServiceCaseForm";

const slugMap: Record<string, SocialServiceCategory> = {
  divorced: SocialServiceCategory.DIVORCED,
  widows: SocialServiceCategory.WIDOWS,
  orphans: SocialServiceCategory.ORPHANS,
  disabilities: SocialServiceCategory.DISABILITIES,
  "chronic-diseases": SocialServiceCategory.CHRONIC_DISEASES,
  "family-census": SocialServiceCategory.FAMILY_CENSUS,
};

type Props = { params: Promise<{ category: string }>; searchParams: Promise<{ ok?: string; no?: string }> };

export default async function DashboardSocialServiceCategoryPage({ params, searchParams }: Props) {
  const s = await auth();
  if (!s?.user) redirect("/citizen/welcome?next=/services/returnees");
  if (s.user.role !== UserRole.CITIZEN) redirect("/");
  const p = await params;
  const category = slugMap[p.category];
  if (!category) redirect("/services/returnees");
  const sp = await searchParams;
  const prefill = await db.user.findUnique({
    where: { id: s.user.id },
    select: { name: true, phone: true, nationalId: true, email: true, notificationEmail: true },
  });
  const emailDefault = prefill?.notificationEmail?.trim() || prefill?.email?.trim() || "";

  return (
    <div className="gov-panel w-full min-w-0 max-w-full px-0">
      <header className="gov-page-heading mb-6 border-b border-[var(--gov-border)] pb-4">
        <h1 className="text-base font-bold text-[var(--gov-text)] md:text-xl">{socialServiceCategoryLabelAr[category]}</h1>
      </header>
      {sp.ok === "1" ? <div className="mb-4 rounded-xl border border-emerald-300/70 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">قد تم إرسال طلبك بنجاح. رقم الطلب: <span className="font-mono font-semibold">{sp.no ?? "—"}</span></div> : null}
      <div className="gov-card p-4 md:p-6">
        <SocialServiceCaseForm category={category} action={submitSocialServiceCase} successReturnPath="/services/returnees" prefill={{ name: prefill?.name, phone: prefill?.phone, nationalId: prefill?.nationalId, email: emailDefault || null }} />
        <Link href="/services/returnees" className="mt-4 inline-block rounded-md border border-slate-200/90 bg-white px-2 py-1.5 text-sm font-semibold text-[var(--gov-primary)] no-underline">العودة للخدمات الاجتماعية</Link>
      </div>
    </div>
  );
}
