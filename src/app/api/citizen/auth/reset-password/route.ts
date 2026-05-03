import { NextResponse } from "next/server";
import { resetCitizenPasswordAction } from "@/actions/citizen-auth";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { password?: string; confirm?: string } | null;
  const fd = new FormData();
  fd.set("password", String(body?.password ?? ""));
  fd.set("confirm", String(body?.confirm ?? ""));
  const result = await resetCitizenPasswordAction(undefined, fd);
  if (result && "error" in result) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, message: result?.message });
}
