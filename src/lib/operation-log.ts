import type { Session } from "next-auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";

export type OperationLogInput = {
  session?: Session | null;
  actorId?: string | null;
  municipalityId?: string | null;
  action: string;
  module: string;
  title: string;
  description?: string;
  entityType?: string | null;
  entityId?: string | null;
  requestId?: string | null;
  metadata?: unknown;
};

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value ?? {});
  } catch {
    return JSON.stringify({ note: "تعذر حفظ تفاصيل العملية بصيغة JSON" });
  }
}

export async function writeOperationLog(input: OperationLogInput) {
  try {
    const h = await headers().catch(() => null);
    const forwarded = h?.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ipAddress = forwarded || h?.get("x-real-ip") || null;
    const userAgent = h?.get("user-agent") || null;

    await db.operationLog.create({
      data: {
        municipalityId: input.municipalityId?.trim() || null,
        actorId: input.actorId ?? input.session?.user?.id ?? null,
        action: input.action,
        module: input.module,
        title: input.title,
        description: input.description ?? "",
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        requestId: input.requestId ?? null,
        metadataJson: safeJson(input.metadata),
        ipAddress,
        userAgent,
      },
    });
  } catch (e) {
    console.warn("[operation-log] write failed:", e);
  }
}
