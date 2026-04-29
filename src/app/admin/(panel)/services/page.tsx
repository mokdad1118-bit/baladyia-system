import { db } from "@/lib/db";
import { auth } from "@/auth";
import { requireStaffPanelPermission } from "@/lib/admin-guard";
import { ServicesListWithSearch } from "@/components/admin/ServicesListWithSearch";

export default async function AdminServicesPage() {
  await requireStaffPanelPermission(await auth(), "services");
  const list = await db.service.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <ServicesListWithSearch
      services={list.map((s) => ({
        id: s.id,
        name: s.name,
        price: String(s.price),
        isActive: s.isActive,
      }))}
      newHref="/admin/services/new"
      editHrefPrefix="/admin/services"
    />
  );
}
