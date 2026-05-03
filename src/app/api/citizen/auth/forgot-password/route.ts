import { NextResponse } from "next/server";
import { requestPasswordResetAction } from "@/actions/citizen-auth";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { identifier?: string } | null;
  const fd = new FormData();
  fd.set("identifier", String(body?.identifier ?? ""));
  const result = await requestPasswordResetAction(undefined, fd);
  return NextResponse.json({
    ok: true,
    message: result && "message" in result ? result.message : undefined,
  });
}
