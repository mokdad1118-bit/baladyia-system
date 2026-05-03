import { NextResponse } from "next/server";
import { resendVerificationOtpAction } from "@/actions/citizen-auth";

export async function POST() {
  const fd = new FormData();
  const result = await resendVerificationOtpAction(undefined, fd);
  if (result && "error" in result) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, message: result?.message });
}
