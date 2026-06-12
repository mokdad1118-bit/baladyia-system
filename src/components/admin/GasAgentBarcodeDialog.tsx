"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { gasAgentBarcodeValue } from "@/lib/gas-agent-barcode";

export function GasAgentBarcodeDialog({
  agent,
}: {
  agent: { id: string; name: string; gasArea: string | null };
}) {
  const [open, setOpen] = useState(false);
  const barcodeValue = gasAgentBarcodeValue(agent.id);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        باركود
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal
          aria-labelledby="gas-agent-barcode-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative z-10 w-full max-w-xl rounded-xl border border-[var(--gov-border)] bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="gas-agent-barcode-title" className="mb-1 text-base font-bold text-[var(--gov-text)]">
              باركود معتمد الغاز
            </h3>
            <p className="mb-4 text-sm text-[var(--gov-muted)]">
              {agent.name} - {agent.gasArea ?? "بدون منطقة"}
            </p>

            <div className="rounded-lg border border-[var(--gov-border)] bg-white p-4">
              <Image
                src={`/api/gas-agents/${encodeURIComponent(agent.id)}/barcode`}
                alt={`باركود ${agent.name}`}
                width={520}
                height={92}
                className="mx-auto h-auto w-full max-w-md"
                unoptimized
              />
              <p className="mt-3 select-all text-center font-mono text-xs text-[var(--gov-muted)]" dir="ltr">
                {barcodeValue}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => window.print()}>
                طباعة
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
