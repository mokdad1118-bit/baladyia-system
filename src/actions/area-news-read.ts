"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/enums";
import { markAreaNewsRead } from "@/lib/area-news";

export async function markAreaNewsReadAction() {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.CITIZEN) return;
  await markAreaNewsRead(session.user.id);
  revalidatePath("/citizen/news");
  revalidatePath("/news");
}
