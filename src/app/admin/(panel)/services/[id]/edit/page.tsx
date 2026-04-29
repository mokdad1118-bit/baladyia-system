import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ServiceForm } from "@/components/ServiceForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { auth } from "@/auth";
import { requireStaffPanelPermission } from "@/lib/admin-guard";

type P = { params: Promise<{ id: string }> };

export default async function EditServicePage({ params }: P) {
  await requireStaffPanelPermission(await auth(), "services");
  const { id } = await params;
  const service = await db.service.findFirst({
    where: { id },
    include: { documents: true },
  });
  if (!service) notFound();
  return (
    <div>
      <PageHeader
        title="تعديل الخدمة"
        description={service.name}
      />
      <Card>
        <CardHeader>
          <CardTitle>البيانات</CardTitle>
          <CardDescription>تعديل الأوراق يعيد توليد نموذج المواطن.</CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceForm service={service} />
        </CardContent>
      </Card>
    </div>
  );
}
