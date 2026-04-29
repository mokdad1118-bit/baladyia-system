"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminListSearchField } from "@/components/admin/AdminListSearchField";

export type StatCard = { label: string; value: number };
export type LinkTile = { href: string; title: string; sub: string };
export type QuickStat = { label: string; value: number; href: string };

function haystackTile(t: LinkTile): string {
  return `${t.title} ${t.sub} ${t.href}`.toLowerCase();
}

function haystackQuick(q: QuickStat): string {
  return `${q.label} ${q.value} ${q.href}`.toLowerCase();
}

function haystackStat(s: StatCard): string {
  return `${s.label} ${s.value}`.toLowerCase();
}

export function AdminHomeDashboardWithSearch({
  variant,
  employeeQuickStats,
  employeeExtraTiles,
  adminStats,
  adminTiles,
  isAdmin,
}: {
  variant: "employee" | "admin";
  employeeQuickStats?: QuickStat[];
  employeeExtraTiles?: LinkTile[];
  adminStats?: StatCard[];
  adminTiles?: LinkTile[];
  isAdmin: boolean;
}) {
  const [qEmpQuick, setQEmpQuick] = useState("");
  const [qEmpTiles, setQEmpTiles] = useState("");
  const [qAdminStats, setQAdminStats] = useState("");
  const [qAdminTiles, setQAdminTiles] = useState("");

  const fEmpQuick = useMemo(() => {
    const list = employeeQuickStats ?? [];
    const n = qEmpQuick.trim().toLowerCase();
    if (!n) return list;
    return list.filter((x) => haystackQuick(x).includes(n));
  }, [employeeQuickStats, qEmpQuick]);

  const fEmpTiles = useMemo(() => {
    const list = employeeExtraTiles ?? [];
    const n = qEmpTiles.trim().toLowerCase();
    if (!n) return list;
    return list.filter((x) => haystackTile(x).includes(n));
  }, [employeeExtraTiles, qEmpTiles]);

  const fAdminStats = useMemo(() => {
    const list = adminStats ?? [];
    const n = qAdminStats.trim().toLowerCase();
    if (!n) return list;
    return list.filter((x) => haystackStat(x).includes(n));
  }, [adminStats, qAdminStats]);

  const fAdminTiles = useMemo(() => {
    const list = adminTiles ?? [];
    const n = qAdminTiles.trim().toLowerCase();
    if (!n) return list;
    return list.filter((x) => haystackTile(x).includes(n));
  }, [adminTiles, qAdminTiles]);

  if (variant === "employee") {
    return (
      <div>
        <div className="mb-6 border-b border-[var(--gov-border)] pb-4">
          <h1 className="text-xl font-bold text-[var(--gov-text)]">لوحة التحكم</h1>
          <p className="mt-1 text-sm text-[var(--gov-muted)]">معالجة الطلبات ومتابعة الحالات.</p>
        </div>
        <AdminListSearchField
          id="admin-home-emp-quick"
          label="بحث في بطاقات الطلبات السريعة"
          placeholder="اسم البطاقة، الرقم، الرابط…"
          value={qEmpQuick}
          onChange={setQEmpQuick}
          className="mb-3"
        />
        <ul className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {fEmpQuick.map((x) => (
            <li key={x.label}>
              <Link href={x.href} className="gov-stat-card block no-underline transition hover:bg-[#f7f8fa]">
                <p className="text-sm text-[var(--gov-muted)]">{x.label}</p>
                <p className="gov-stat-value mt-1">{x.value}</p>
              </Link>
            </li>
          ))}
        </ul>
        {(employeeExtraTiles?.length ?? 0) > 0 ? (
          <>
            <AdminListSearchField
              id="admin-home-emp-tiles"
              label="بحث في روابط الأقسام"
              placeholder="عنوان القسم أو الوصف…"
              value={qEmpTiles}
              onChange={setQEmpTiles}
              className="mb-3"
            />
            <ul className="mb-8 grid gap-3 sm:grid-cols-2">
              {fEmpTiles.map((t) => (
                <li key={t.href}>
                  <Link href={t.href} className="gov-card block h-full p-5 no-underline transition hover:bg-[#f7f8fa]">
                    <h2 className="text-base font-bold text-[var(--gov-text)]">{t.title}</h2>
                    <p className="mt-1 text-sm text-[var(--gov-muted)]">{t.sub}</p>
                    <span className="mt-3 inline-block text-sm font-semibold text-[var(--gov-primary)]">دخول ←</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        <Link
          href="/admin/requests"
          className="gov-btn-primary inline-flex px-5 py-2.5 text-sm font-semibold no-underline"
        >
          عرض قائمة الطلبات
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 border-b border-[var(--gov-border)] pb-4">
        <h1 className="text-xl font-bold text-[var(--gov-text)]">لوحة التحكم</h1>
        <p className="mt-1 text-sm text-[var(--gov-muted)]">إدارة الخدمات والمستخدمين والطلبات والتقارير.</p>
      </div>
      <AdminListSearchField
        id="admin-home-admin-stats"
        label="بحث في بطاقات الإحصائيات"
        placeholder="اسم المؤشر أو الرقم…"
        value={qAdminStats}
        onChange={setQAdminStats}
        className="mb-3"
      />
      <ul className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {fAdminStats.map((st) => (
          <li key={st.label} className="gov-stat-card">
            <p className="text-sm text-[var(--gov-muted)]">{st.label}</p>
            <p className="gov-stat-value mt-1">{st.value}</p>
          </li>
        ))}
      </ul>
      {isAdmin && (adminTiles?.length ?? 0) > 0 ? (
        <>
          <AdminListSearchField
            id="admin-home-admin-tiles"
            label="بحث في روابط الأقسام"
            placeholder="عنوان القسم أو الوصف…"
            value={qAdminTiles}
            onChange={setQAdminTiles}
            className="mb-3"
          />
          <ul className="grid gap-3 sm:grid-cols-2">
            {fAdminTiles.map((t) => (
              <li key={t.href}>
                <Link href={t.href} className="gov-card block h-full p-5 no-underline transition hover:bg-[#f7f8fa]">
                  <h2 className="text-base font-bold text-[var(--gov-text)]">{t.title}</h2>
                  <p className="mt-1 text-sm text-[var(--gov-muted)]">{t.sub}</p>
                  <span className="mt-3 inline-block text-sm font-semibold text-[var(--gov-primary)]">دخول ←</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
