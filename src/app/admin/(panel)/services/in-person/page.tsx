import { auth } from "@/auth";
import { requireStaffPanelPermission } from "@/lib/admin-guard";

export default async function AdminInPersonServicesPage() {
  const s = await auth();
  await requireStaffPanelPermission(s, "services");

  return (
    <div>
      <header className="gov-page-heading mb-6 border-b border-[var(--gov-border)] pb-4">
        <h1 className="text-lg font-bold text-[var(--gov-text)] md:text-xl">الخدمات المقدمة حضورياً</h1>
      </header>
      <div className="gov-card p-6 text-center">
        <p className="text-base font-semibold text-[var(--gov-text)]">سيتم تطويرها لاحقاً</p>
      </div>
    </div>
  );
}
