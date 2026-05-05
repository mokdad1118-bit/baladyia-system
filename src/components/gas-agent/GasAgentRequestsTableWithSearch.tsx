"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminListSearchField } from "@/components/admin/AdminListSearchField";
import { completeGasRequestAction } from "@/actions/gas-request";

type GasAgentRequestRow = {
  id: string;
  gasRequestNumber: string;
  fullName: string;
  phone: string;
  nationalId: string;
  area: string;
  createdAt: string;
  isCompleted: boolean;
  completedAt?: string | null;
};

function haystack(r: GasAgentRequestRow): string {
  return [r.gasRequestNumber, r.fullName].join(" ").toLowerCase();
}

export function GasAgentRequestsTableWithSearch({ rows }: { rows: GasAgentRequestRow[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"active" | "done">("active");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const tabRows = useMemo(() => rows.filter((r) => (tab === "active" ? !r.isCompleted : r.isCompleted)), [rows, tab]);
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return tabRows;
    return tabRows.filter((r) => haystack(r).includes(n));
  }, [tabRows, q]);

  if (rows.length === 0) {
    return (
      <div className="gov-card p-10 text-center text-sm text-[var(--gov-muted)]">
        لا توجد طلبات غاز مخصصة لك حالياً.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setTab("active")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            tab === "active"
              ? "bg-[var(--gov-primary)] text-white"
              : "border border-[var(--gov-border)] bg-white text-[var(--gov-primary)]"
          }`}
        >
          الطلبات الجارية
        </button>
        <button
          type="button"
          onClick={() => setTab("done")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            tab === "done"
              ? "bg-[var(--gov-primary)] text-white"
              : "border border-[var(--gov-border)] bg-white text-[var(--gov-primary)]"
          }`}
        >
          الطلبات المنتهية
        </button>
      </div>

      <AdminListSearchField
        id="gas-agent-requests-search"
        label="بحث في الطلبات"
        placeholder="ابحث برقم الطلب أو اسم المواطن..."
        value={q}
        onChange={setQ}
        className="mb-4"
      />

      {filtered.length === 0 ? (
        <div className="gov-card p-8 text-center text-sm text-[var(--gov-muted)]">لا نتائج مطابقة للبحث.</div>
      ) : (
        <div className="gov-table-wrap">
          <table className="gov-table">
            <thead>
              <tr>
                <th>رقم طلب الغاز</th>
                <th>الاسم الثلاثي</th>
                <th>رقم الهاتف</th>
                <th>الرقم الوطني</th>
                <th>المنطقة</th>
                <th>{tab === "active" ? "تاريخ التقديم" : "تاريخ الإنهاء"}</th>
                {tab === "active" ? <th>الإجراء</th> : null}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono font-semibold text-[var(--gov-primary)]">{r.gasRequestNumber}</td>
                  <td>{r.fullName}</td>
                  <td dir="ltr">{r.phone}</td>
                  <td dir="ltr">{r.nationalId}</td>
                  <td>{r.area}</td>
                  <td className="whitespace-nowrap text-[var(--gov-muted)]">
                    {new Date((tab === "done" ? r.completedAt : r.createdAt) ?? r.createdAt).toLocaleDateString("ar")}
                  </td>
                  {tab === "active" ? (
                    <td>
                      <button
                        type="button"
                        disabled={pending && busyId === r.id}
                        className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                        onClick={() => {
                          setBusyId(r.id);
                          startTransition(async () => {
                            const res = await completeGasRequestAction(r.id);
                            if ("error" in res) {
                              alert(res.error);
                            } else {
                              router.refresh();
                              setTab("done");
                            }
                            setBusyId(null);
                          });
                        }}
                      >
                        {pending && busyId === r.id ? "جاري..." : "إنهاء"}
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
