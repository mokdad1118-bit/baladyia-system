"use server";

import { revalidatePath } from "next/cache";
import { unstable_update, auth } from "@/auth";
import { UserRole } from "@/generated/prisma/enums";

export async function setSuperAdminMunicipalityScope(
  municipalityId: string | null,
): Promise<{ ok: true } | { error: string }> {
  const s = await auth();
  if (!s?.user || s.user.role !== UserRole.SUPER_ADMIN) {
    return { error: "غير مصرّح" };
  }
  await unstable_update({ user: { activeMunicipalityId: municipalityId } });
  revalidatePath("/admin");
  revalidatePath("/admin/requests");
  revalidatePath("/admin/users");
  revalidatePath("/admin/citizens");
  revalidatePath("/admin/stats");
  revalidatePath("/admin/gas-services");
  revalidatePath("/admin/social-services");
  revalidatePath("/admin/returnee-registrations");
  revalidatePath("/admin/citizen-feedback");
  return { ok: true };
}

export async function setSuperAdminMunicipalityScopeFromForm(formData: FormData) {
  const raw = String(formData.get("municipalityId") ?? "").trim();
  await setSuperAdminMunicipalityScope(raw === "" || raw === "__ALL__" ? null : raw);
}
