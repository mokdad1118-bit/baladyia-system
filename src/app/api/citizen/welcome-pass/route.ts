import { NextResponse, type NextRequest } from "next/server";
import { buildWelcomePassClearCookie, buildWelcomePassSetCookie } from "@/lib/citizen-welcome-pass";

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  res.headers.append("Set-Cookie", buildWelcomePassSetCookie(req));
  return res;
}

export async function DELETE(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  res.headers.append("Set-Cookie", buildWelcomePassClearCookie(req));
  return res;
}
