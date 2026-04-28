import Link from "next/link";

export function GuestBar() {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 border-b border-[var(--gov-border)] bg-white px-4 py-2 text-sm">
      <Link className="text-[var(--gov-primary)] hover:underline" href="/register">
        تسجيل مواطن
      </Link>
      <span className="text-[var(--gov-muted)]">|</span>
      <Link className="text-[var(--gov-primary)] hover:underline" href="/login">
        تسجيل الدخول
      </Link>
    </div>
  );
}
