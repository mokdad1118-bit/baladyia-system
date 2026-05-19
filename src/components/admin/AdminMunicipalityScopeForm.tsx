"use client";

import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { setSuperAdminMunicipalityScopeFromForm } from "@/actions/admin-municipality-scope";

export function AdminMunicipalityScopeForm({
  municipalities,
  current,
}: {
  municipalities: { id: string; name: string }[];
  current: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      ref={formRef}
      className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-[var(--gov-border)] bg-slate-50/90 px-3 py-2.5 text-sm"
      onSubmit={(e) => {
        e.preventDefault();
        const form = formRef.current;
        if (!form) return;
        setError(null);
        const fd = new FormData(form);
        const selectedMunicipalityId = String(fd.get("municipalityId") ?? "").trim();
        const nextMunicipalityId =
          selectedMunicipalityId === "" || selectedMunicipalityId === "__ALL__" ? null : selectedMunicipalityId;
        startTransition(async () => {
          const res = await setSuperAdminMunicipalityScopeFromForm(fd);
          if ("error" in res) {
            setError(res.error);
            return;
          }
          if (pathname.startsWith("/admin/municipalities/")) {
            router.push(nextMunicipalityId ? `/admin/municipalities/${nextMunicipalityId}` : "/admin/municipalities");
          } else {
            router.refresh();
          }
        });
      }}
    >
      <span className="font-semibold text-[var(--gov-text)]">عرض بيانات:</span>
      <select
        name="municipalityId"
        defaultValue={current || "__ALL__"}
        className="gov-input min-w-[12rem] flex-1 px-2 py-1.5 text-sm sm:flex-none"
      >
        <option value="__ALL__">كل بلديات محافظة درعا</option>
        {municipalities.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="gov-btn-primary shrink-0 px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
      >
        {pending ? "جاري التطبيق…" : "تطبيق النطاق"}
      </button>
      {error ? <span className="w-full text-xs font-semibold text-rose-700">{error}</span> : null}
    </form>
  );
}
