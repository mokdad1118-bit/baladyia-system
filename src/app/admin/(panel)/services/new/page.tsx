import { ServiceForm } from "@/components/ServiceForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { auth } from "@/auth";
import { requireStaffPanelPermission } from "@/lib/admin-guard";
import { listActiveMunicipalities } from "@/lib/municipalities";
import { UserRole } from "@/generated/prisma/enums";
import { isSuperAdminRole } from "@/lib/roles";

export default async function NewServicePage() {
  const s = await auth();
  await requireStaffPanelPermission(s, "services");
  const municipalities = isSuperAdminRole(s?.user?.role ?? UserRole.CITIZEN)
    ? await listActiveMunicipalities()
    : [];
  return (
    <div>
      <PageHeader
        title="خدمة جديدة"
        description="بعد الحفظ يُعرض النموذج للمواطنين مباشرة (إن كانت الخدمة مُفعّلة)."
      />
      <Card>
        <CardHeader>
          <CardTitle>البيانات</CardTitle>
          <CardDescription>حدد الأوراق — سيُبنى نموذج الرفع تلقائياً.</CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceForm municipalities={municipalities} />
        </CardContent>
      </Card>
    </div>
  );
}
