import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@/generated/prisma/enums";
import { CitizenAccountView } from "@/components/citizen/CitizenAccountView";
import { getMunicipalityNameById } from "@/lib/municipalities";

export default async function CitizenMainAccountPage() {
  const s = await auth();
  if (!s?.user || s.user.role !== UserRole.CITIZEN) {
    redirect("/citizen/welcome?next=/citizen/account");
  }

  const me = await db.user.findUnique({
    where: { id: s.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      nationalId: true,
      notificationEmail: true,
      createdAt: true,
      municipalityId: true,
    },
  });
  if (!me) redirect("/citizen");
  const municipalityName = await getMunicipalityNameById(me.municipalityId);

  return (
    <div className="w-full px-3 md:px-0">
      <CitizenAccountView
        user={{
          name: me.name,
          email: me.email,
          phone: me.phone,
          nationalId: me.nationalId,
          notificationEmail: me.notificationEmail,
          createdAt: me.createdAt.toISOString(),
          municipalityName,
        }}
      />
    </div>
  );
}
