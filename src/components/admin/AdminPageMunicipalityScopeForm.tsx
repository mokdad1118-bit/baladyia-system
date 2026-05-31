export function AdminPageMunicipalityScopeForm({
  municipalities,
  current,
}: {
  municipalities: { id: string; name: string }[];
  current: string;
}) {
  if (municipalities.length === 0) return null;

  return (
    <form
      method="get"
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
