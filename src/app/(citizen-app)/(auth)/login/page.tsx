import { redirect } from "next/navigation";

/** المسار القديم /login — يُوجَّه إلى /citizen/welcome مع الحفاظ على الاستعلام */
export default async function LegacyLoginRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") q.set(k, v);
    else if (Array.isArray(v)) v.forEach((x) => q.append(k, x));
  }
  const suffix = q.toString() ? `?${q.toString()}` : "";
  redirect(`/citizen/welcome${suffix}`);
}
