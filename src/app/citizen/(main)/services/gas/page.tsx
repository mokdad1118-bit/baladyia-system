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

export default async function CitizenGasServiceMainPage({ searchParams }: Props) {
  const s = await auth();
  if (!s?.user) redirect("/citizen/login?next=/citizen/services/gas");
  if (s.user.role !== UserRole.CITIZEN) redirect("/");

  const sp = await searchParams;
  const prefill = await db.user.findUnique({
    where: { id: s.user.id },
    select: { name: true, phone: true, nationalId: true },
  });

  return (
    <div className="gov-panel w-full px-0">
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
        <GasRequestForm action={submitGasRequest} />
        {prefill ? (
          <p className="mt-3 text-xs text-[var(--gov-muted)]">
            بياناتك الحالية: {prefill.name ?? "—"} / {prefill.phone ?? "—"} / {prefill.nationalId ?? "—"}
          </p>
        ) : null}
        <Link
          href="/citizen/services"
          className="mt-4 inline-block text-sm font-semibold text-[var(--gov-primary)] hover:underline"
        >
          العودة إلى صفحة الخدمات
        </Link>
      </div>
    </div>
  );
}
