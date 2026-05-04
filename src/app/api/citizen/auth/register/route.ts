import { NextResponse } from "next/server";
import { registerCitizen } from "@/actions/citizen-auth";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const fd = new FormData();
  fd.set("fullName", String(body.fullName ?? ""));
  fd.set("email", String(body.email ?? ""));
  fd.set("phone", String(body.phone ?? ""));
  fd.set("nationalId", String(body.nationalId ?? ""));
  fd.set("password", String(body.password ?? ""));
  const result = await registerCitizen(undefined, fd);
  if (result && "error" in result) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  if (result && "ok" in result && result.ok) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false, error: "فشل غير متوقع" }, { status: 500 });
}
