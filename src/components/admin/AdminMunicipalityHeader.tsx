import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@/generated/prisma/enums";
import { setSuperAdminMunicipalityScopeFromForm } from "@/actions/admin-municipality-scope";

/** لمشرف المحافظة: اختيار بلدية للتصفية أو عرض الكل */
export async function AdminSuperMunicipalitySwitcher() {
  const s = await auth();
  if (!s?.user || s.user.role !== UserRole.SUPER_ADMIN) return null;
  const municipalities = await db.municipality.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
  const current = s.user.activeMunicipalityId?.trim() ?? "";
  return (
    <form
      action={setSuperAdminMunicipalityScopeFromForm}
      className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-[var(--gov-border)] bg-slate-50/90 px-3 py-2.5 text-sm"
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
      <button type="submit" className="gov-btn-primary shrink-0 px-3 py-1.5 text-xs font-semibold">
        تطبيق النطاق
      </button>
    </form>
  );
}

export async function AdminCurrentMunicipalityLabel() {
  const s = await auth();
  if (!s?.user) return null;
  let label: string | null = null;
  if (s.user.role === UserRole.SUPER_ADMIN) {
    const id = s.user.activeMunicipalityId?.trim();
    if (!id) label = "كل بلديات محافظة درعا";
    else {
      const m = await db.municipality.findFirst({ where: { id }, select: { name: true } });
      label = m ? `البلدية: ${m.name}` : null;
    }
  } else if (s.user.municipalityId) {
    const m = await db.municipality.findFirst({
      where: { id: s.user.municipalityId },
      select: { name: true },
    });
    label = m ? `البلدية: ${m.name}` : null;
  }
  if (!label) return null;
  return (
    <p className="mb-2 text-xs font-medium text-[var(--gov-muted)] md:text-sm" dir="rtl">
      {label}
    </p>
  );
}
