import { auth } from "@/auth";
import { requireSuperAdminPanel } from "@/lib/admin-guard";
import { fetchMunicipalityCompareStats, sumCompareRows } from "@/lib/municipality-compare-stats";
import { MunicipalityCompareReport } from "@/components/admin/MunicipalityCompareReport";

export default async function MunicipalityComparePage() {
  const s = await auth();
  await requireSuperAdminPanel(s);

  const rows = await fetchMunicipalityCompareStats();
  const totals = sumCompareRows(rows);

  return <MunicipalityCompareReport rows={rows} totals={totals} />;
}
