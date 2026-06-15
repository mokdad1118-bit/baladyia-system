"use client";

import Image from "next/image";

export function GasAgentBarcodeCard({
  agent,
}: {
  agent: { id: string; name: string; gasArea: string | null; municipality: { name: string } | null };
}) {
  return (
    <section className="gov-card mb-6 p-4 md:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-[var(--gov-text)]">باركود استلام جرة الغاز</h2>
          <p className="mt-1 text-sm text-[var(--gov-muted)]">
            اعرض هذا الكود للمواطن حتى يمسحه من تطبيقه ويتم تسجيل الاستلام مباشرة.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="w-fit rounded-sm border border-[var(--gov-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--gov-primary)] shadow-sm"
        >
          طباعة
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-center">
        <div className="rounded-lg border border-[var(--gov-border)] bg-white p-4">
          <Image
            src={`/api/gas-agents/${encodeURIComponent(agent.id)}/barcode`}
            alt={`باركود ${agent.name}`}
            width={360}
            height={360}
            className="mx-auto aspect-square h-auto w-full max-w-80 rounded-lg bg-white p-3"
            unoptimized
          />
        </div>

        <div className="rounded-lg border border-[var(--gov-border)] bg-slate-50 p-4 text-sm">
          <p className="font-semibold text-[var(--gov-text)]">{agent.name}</p>
          <p className="mt-1 text-[var(--gov-muted)]">البلدية: {agent.municipality?.name ?? "—"}</p>
          <p className="mt-1 text-[var(--gov-muted)]">المنطقة: {agent.gasArea ?? "—"}</p>
          <p className="mt-3 text-[var(--gov-muted)]">
            بعد مسح المواطن للكود سيظهر السجل في لوحة الإدارة ولوحة المعتمد بتاريخ الاستلام.
          </p>
        </div>
      </div>
    </section>
  );
}
