import { CitizenAuthShell } from "@/components/citizen/CitizenAuthShell";
import { CitizenRegisterForm } from "@/components/citizen/CitizenRegisterForm";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CitizenRegisterPage() {
  const municipalities = await db.municipality.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
  return (
    <CitizenAuthShell headerAside={<p className="text-sm font-semibold text-emerald-900">إنشاء حساب جديد</p>}>
      <main className="flex flex-1 justify-center px-4 py-10">
        <CitizenRegisterForm
          municipalities={municipalities}
          verifyHref="/register/verify"
          loginHref="/citizen/login"
          variant="emerald"
        />
      </main>
    </CitizenAuthShell>
  );
}
