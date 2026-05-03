import { NextResponse } from "next/server";
import { verifyCitizenEmailAction } from "@/actions/citizen-auth";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { code?: string } | null;
  const fd = new FormData();
  fd.set("code", String(body?.code ?? ""));
  const result = await verifyCitizenEmailAction(undefined, fd);
  if (result && "error" in result) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, message: result?.message });
}
