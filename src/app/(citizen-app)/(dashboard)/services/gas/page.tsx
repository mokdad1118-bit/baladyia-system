import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { submitGasRequest } from "@/actions/gas-request";
import { GasRequestForm } from "@/components/citizen/GasRequestForm";

type Props = {
  searchParams: Promise<{ ok?: string; no?: string }>;
};

export default async function CitizenGasServicePage({ searchParams }: Props) {
  const s = await auth();
  if (!s?.user) redirect("/citizen/login?next=/services/gas");
  if (s.user.role !== UserRole.CITIZEN) redirect("/");

  const sp = await searchParams;
  const prefill = await db.user.findUnique({
    where: { id: s.user.id },
    select: { name: true, phone: true, nationalId: true },
  });
  const areaRows = await db.user.findMany({
    where: { role: UserRole.GAS_AGENT, isActive: true, gasArea: { not: null } },
    select: { gasArea: true },
    orderBy: { gasArea: "asc" },
  });
  const areas = [...new Set(areaRows.map((x) => x.gasArea).filter((x): x is string => Boolean(x?.trim())))];

  return (
    <div className="gov-panel w-full min-w-0 max-w-full">
      <header className="gov-page-heading mb-6 border-b border-[var(--gov-border)] pb-4">
        <h1 className="text-lg font-bold text-[var(--gov-text)] md:text-xl">خدمات الغاز</h1>
        <p className="mt-1 text-sm text-[var(--gov-muted)]">يرجى تعبئة البيانات التالية لإرسال الطلب.</p>
      </header>

      {sp.ok === "1" ? (
        <div className="mb-4 rounded-xl border border-emerald-300/70 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          تم إرسال طلب خدمات الغاز بنجاح. رقم الطلب: <span className="font-mono font-semibold">{sp.no ?? "—"}</span>
        </div>
      ) : null}

      <div className="gov-card p-4 md:p-6">
        {areas.length === 0 ? (
          <p className="rounded-xl border border-amber-300/70 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            لا توجد مناطق غاز مضافة حالياً. يرجى التواصل مع الإدارة.
          </p>
        ) : (
          <GasRequestForm action={submitGasRequest} prefill={prefill ?? undefined} areas={areas} />
        )}
        {prefill ? (
          <p className="mt-3 text-xs text-[var(--gov-muted)]">
            بياناتك الحالية: {prefill.name ?? "—"} / {prefill.phone ?? "—"} / {prefill.nationalId ?? "—"}
          </p>
        ) : null}
        <Link href="/services" className="mt-4 inline-block text-sm font-semibold text-[var(--gov-primary)] hover:underline">
          العودة إلى صفحة الخدمات
        </Link>
      </div>
    </div>
  );
}
