import { NextResponse, type NextRequest } from "next/server";
import { createInPersonRequestFromForm } from "@/actions/admin-in-person-requests";

function redirectTo(location: string) {
  return new NextResponse(null, { status: 303, headers: { Location: location } });
}

function errorReturnPath(request: NextRequest, message: string) {
  const referer = request.headers.get("referer") || "/admin/services/in-person";
  const url =
    referer.startsWith("http://") || referer.startsWith("https://")
      ? new URL(referer)
      : new URL(referer, "http://local.invalid");
  url.searchParams.set("error", message);
  return `${url.pathname}${url.search}${url.hash}`;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const result = await createInPersonRequestFromForm(formData);

  if (result.ok) {
    return redirectTo(result.redirectTo);
  }

  return redirectTo(
    errorReturnPath(
      request,
      result.error ?? "تعذر حفظ الطلب الحضوري حالياً. تحقق من البيانات والمرفقات ثم حاول مرة أخرى.",
    ),
  );
}
