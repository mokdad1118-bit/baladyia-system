"use client";

import Image from "next/image";
import { gasAgentBarcodeValue } from "@/lib/gas-agent-barcode";

export function GasAgentBarcodeCard({
  agent,
}: {
  agent: { id: string; name: string };
}) {
  const barcodeValue = gasAgentBarcodeValue(agent.id);

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

      <div className="rounded-lg border border-[var(--gov-border)] bg-white p-4">
        <Image
          src={`/api/gas-agents/${encodeURIComponent(agent.id)}/barcode`}
          alt={`باركود ${agent.name}`}
          width={360}
          height={360}
          className="mx-auto aspect-square h-auto w-full max-w-80 rounded-lg bg-white p-3"
          unoptimized
        />
        <p className="mt-3 select-all text-center font-mono text-xs text-[var(--gov-muted)]" dir="ltr">
          {barcodeValue}
        </p>
      </div>
    </section>
  );
}
