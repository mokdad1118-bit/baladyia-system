"use client";

import { useState } from "react";

export type InPersonServiceExportRow = {
  serviceName: string;
  serviceType: string;
  municipalityName: string;
};

function stamp() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function AdminInPersonServicesExportButton({
  rows,
}: {
  rows: InPersonServiceExportRow[];
}) {
  const [busy, setBusy] = useState(false);

  async function exportExcel() {
    if (!rows.length) return;
    setBusy(true);
    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("الخدمات_الحضورية", { views: [{ rightToLeft: true }] });
      sheet.columns = [
        { header: "الخدمة", key: "serviceName", width: 34 },
        { header: "النوع", key: "serviceType", width: 22 },
        { header: "البلدية", key: "municipalityName", width: 28 },
      ];
      const header = sheet.getRow(1);
      header.font = { bold: true, color: { argb: "FFFFFFFF" } };
      header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1a5c40" } };
      header.alignment = { vertical: "middle", horizontal: "right" };
      for (const row of rows) sheet.addRow(row);
      sheet.eachRow((row, index) => {
        if (index === 1) return;
        row.alignment = { vertical: "middle", horizontal: "right", wrapText: true };
      });

      const buffer = (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `in-person-services-${stamp()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={!rows.length || busy}
      onClick={exportExcel}
      className="gov-btn-primary min-h-10 px-4 py-2 text-sm font-semibold disabled:opacity-50"
    >
      {busy ? "جاري التصدير..." : "تصدير Excel"}
    </button>
  );
}
