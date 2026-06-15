import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { submitGasRequest } from "@/actions/gas-request";
import { GasBarcodeScanner } from "@/components/citizen/GasBarcodeScanner";

type Props = {
  searchParams: Promise<{ ok?: string; no?: string }>;
};

export default async function CitizenGasServiceMainPage({ searchParams }: Props) {
  const s = await auth();
  if (!s?.user) redirect("/citizen/welcome?next=/citizen/services/gas");
  if (s.user.role !== UserRole.CITIZEN) redirect("/");

  const sp = await searchParams;
  const prefill = await db.user.findUnique({
    where: { id: s.user.id },
    select: { name: true, phone: true, nationalId: true },
  });
  const gasAgentsCount = await db.user.count({
    where: {
      role: UserRole.GAS_AGENT,
      isActive: true,
      municipalityId: s.user.municipalityId ?? "__none__",
      gasArea: { not: null },
      gasCylinderStock: { gt: 0 },
    },
  });

  return (
    <div className="gov-panel w-full px-0">
      <header className="gov-page-heading mb-6 border-b border-[var(--gov-border)] pb-4">
        <h1 className="text-lg font-bold text-[var(--gov-text)] md:text-xl">خدمات الغاز</h1>
        <p className="mt-1 text-sm text-[var(--gov-muted)]">امسح باركود معتمد الغاز لتسجيل استلام الجرة مباشرة.</p>
      </header>

      {sp.ok === "1" ? (
        <div className="mb-4 rounded-xl border border-emerald-300/70 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          تم تسجيل استلام جرة الغاز بنجاح. رقم السجل: <span className="font-mono font-semibold">{sp.no ?? "—"}</span>
        </div>
      ) : null}

      <div className="gov-card p-4 md:p-6">
        {gasAgentsCount === 0 ? (
          <p className="rounded-xl border border-amber-300/70 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            لا يوجد معتمد غاز نشط حالياً. يرجى التواصل مع الإدارة.
          </p>
        ) : (
          <GasBarcodeScanner action={submitGasRequest} prefill={prefill ?? undefined} />
        )}
        <Link
          href="/citizen/services"
          className="mt-4 inline-block rounded-md border border-slate-200/90 bg-white px-2 py-1.5 text-sm font-semibold text-[var(--gov-primary)] shadow-sm shadow-slate-900/10 no-underline transition hover:bg-slate-50/90 hover:shadow-md hover:shadow-slate-900/10"
        >
          العودة إلى صفحة الخدمات
        </Link>
      </div>
    </div>
  );
}
