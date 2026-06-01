import { NextResponse, type NextRequest } from "next/server";
import { createInPersonRequestFromForm } from "@/actions/admin-in-person-requests";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const result = await createInPersonRequestFromForm(formData);

  if (result.ok) {
    return NextResponse.redirect(new URL(result.redirectTo, request.url), { status: 303 });
  }

  const referer = request.headers.get("referer") || "/admin/services/in-person";
  const url = new URL(referer, request.url);
  url.searchParams.set("error", result.error ?? "تعذر حفظ الطلب الحضوري حالياً. تحقق من البيانات والمرفقات ثم حاول مرة أخرى.");
  return NextResponse.redirect(url, { status: 303 });
}
