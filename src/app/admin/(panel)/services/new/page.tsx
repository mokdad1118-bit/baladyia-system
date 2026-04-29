import { ServiceForm } from "@/components/ServiceForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { auth } from "@/auth";
import { requireStaffPanelPermission } from "@/lib/admin-guard";

export default async function NewServicePage() {
  await requireStaffPanelPermission(await auth(), "services");
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
          <ServiceForm />
        </CardContent>
      </Card>
    </div>
  );
}
