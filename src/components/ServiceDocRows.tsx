"use client";

import { useState } from "react";
import { fileKindAr } from "@/lib/labels";
import { FileKind } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Input, FieldLabel } from "@/components/ui/field";

type Row = { name: string; isRequired: boolean; fileType: FileKind };

const empty: Row = { name: "", isRequired: true, fileType: FileKind.PDF };

export function ServiceDocRows({ initial }: { initial?: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial?.length ? initial : [empty]);

  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div
          key={i}
          className="grid gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 sm:grid-cols-12 sm:items-end"
        >
          <div className="sm:col-span-5">
            <FieldLabel>اسم المستند</FieldLabel>
            <Input
              name="docName[]"
              value={r.name}
              onChange={(e) => {
                const n = [...rows];
                n[i] = { ...n[i], name: e.target.value };
                setRows(n);
              }}
              placeholder="مثال: هوية سارية"
              required
            />
          </div>
          <div className="sm:col-span-3">
            <FieldLabel>نوع الملف</FieldLabel>
            <select
              className="w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-emerald-600/50 focus:ring-2 focus:ring-emerald-600/25 focus:outline-none"
              name="docType[]"
              value={r.fileType}
              onChange={(e) => {
                const n = [...rows];
                n[i] = { ...n[i], fileType: e.target.value as FileKind };
                setRows(n);
              }}
            >
              {(Object.keys(fileKindAr) as FileKind[]).map((k) => (
                <option key={k} value={k}>
                  {fileKindAr[k]}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>إلزامي؟</FieldLabel>
            <select
              className="w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 text-sm"
              name="docRequired[]"
              value={r.isRequired ? "1" : "0"}
              onChange={(e) => {
                const n = [...rows];
                n[i] = { ...n[i], isRequired: e.target.value === "1" };
                setRows(n);
              }}
            >
              <option value="1">نعم</option>
              <option value="0">لا</option>
            </select>
          </div>
          <div className="sm:col-span-2 flex items-end">
            {rows.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                className="w-full text-rose-600 hover:bg-rose-50"
                onClick={() => setRows(rows.filter((_, j) => j !== i))}
              >
                حذف
              </Button>
            )}
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        className="w-full sm:w-auto"
        onClick={() => setRows([...rows, { ...empty }])}
      >
        + إضافة مستند
      </Button>
    </div>
  );
}
