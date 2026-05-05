"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateGasAgentAction } from "@/actions/gas-agents";

export function GasAgentEditDialog({
  agent,
}: {
  agent: { id: string; name: string; phone: string | null; gasArea: string | null };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setOpen(true);
          setErr(null);
        }}
      >
        تعديل
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal
          aria-labelledby="gas-agent-edit-title"
          onClick={() => {
            if (!pending) setOpen(false);
          }}
        >
          <div
            className="relative z-10 w-full max-w-lg rounded-xl border border-[var(--gov-border)] bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="gas-agent-edit-title" className="mb-3 text-base font-bold text-[var(--gov-text)]">
              تعديل بيانات المعتمد
            </h3>
            <form
              className="grid gap-3"
              onSubmit={async (e) => {
                e.preventDefault();
                setPending(true);
                setErr(null);
                const fd = new FormData(e.currentTarget);
                const res = await updateGasAgentAction(fd);
                setPending(false);
                if (!res.ok) {
                  setErr(res.error);
                  return;
                }
                setOpen(false);
                router.refresh();
              }}
            >
              <input type="hidden" name="userId" value={agent.id} />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">اسم المعتمد</label>
                <input
                  name="name"
                  required
                  minLength={3}
                  defaultValue={agent.name}
                  className="gov-input w-full px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">رقم الهاتف</label>
                <input
                  name="phone"
                  required
                  inputMode="numeric"
                  dir="ltr"
                  defaultValue={agent.phone ?? ""}
                  className="gov-input w-full px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">المنطقة المخصصة</label>
                <input
                  name="area"
                  required
                  minLength={2}
                  defaultValue={agent.gasArea ?? ""}
                  className="gov-input w-full px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--gov-text)]">
                  كلمة مرور جديدة (اختياري)
                </label>
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="اتركه فارغاً للإبقاء على كلمة المرور الحالية"
                  className="gov-input w-full px-3 py-2.5 text-sm"
                />
              </div>
              {err ? <p className="text-sm text-rose-700">{err}</p> : null}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="submit"
                  disabled={pending}
                  className="gov-btn-primary min-h-10 rounded-sm px-4 py-2 text-sm font-semibold disabled:opacity-60"
                >
                  {pending ? "جارٍ الحفظ..." : "حفظ التعديلات"}
                </button>
                <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={() => setOpen(false)}>
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
