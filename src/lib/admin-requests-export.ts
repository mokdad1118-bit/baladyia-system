import type { RequestStatus } from "@/generated/prisma/enums";
import { requestStatusAr } from "@/lib/labels";

export type AdminRequestsExportSourceRow = {
  requestNumber: string;
  citizenName: string;
  serviceName: string;
  status: RequestStatus;
  createdAt: string;
};

function fileStamp(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function rowLabels(r: AdminRequestsExportSourceRow) {
  return {
    requestNumber: r.requestNumber,
    citizenName: r.citizenName,
    serviceName: r.serviceName,
    statusLabel: requestStatusAr[r.status],
    dateLabel: new Date(r.createdAt).toLocaleDateString("ar"),
  };
}

/** تصدير القائمة الحالية (مثلاً بعد البحث) إلى Excel */
export async function downloadAdminRequestsExcel(rows: AdminRequestsExportSourceRow[]): Promise<void> {
  if (rows.length === 0) return;
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("الطلبات", {
    views: [{ rightToLeft: true }],
  });

  sheet.columns = [
    { header: "رقم الطلب", key: "requestNumber", width: 22 },
    { header: "المواطن", key: "citizenName", width: 28 },
    { header: "الخدمة", key: "serviceName", width: 36 },
    { header: "الحالة", key: "statusLabel", width: 18 },
    { header: "التاريخ", key: "dateLabel", width: 16 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.alignment = { vertical: "middle", horizontal: "right" };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1a5c40" },
  };
  headerRow.border = {
    top: { style: "thin", color: { argb: "FF0c3528" } },
    left: { style: "thin", color: { argb: "FF0c3528" } },
    bottom: { style: "thin", color: { argb: "FF0c3528" } },
    right: { style: "thin", color: { argb: "FF0c3528" } },
  };

  for (const r of rows) {
    const L = rowLabels(r);
    sheet.addRow({
      requestNumber: L.requestNumber,
      citizenName: L.citizenName,
      serviceName: L.serviceName,
      statusLabel: L.statusLabel,
      dateLabel: L.dateLabel,
    });
  }

  sheet.eachRow((row, i) => {
    if (i > 1) {
      row.alignment = { vertical: "middle", horizontal: "right", wrapText: true };
    }
  });

  const buf = (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `requests-${fileStamp()}.xlsx`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** تصدير PDF من HTML (يدعم العربية عبر خط النظام) */
export async function downloadAdminRequestsPdf(rows: AdminRequestsExportSourceRow[]): Promise<void> {
  if (rows.length === 0) return;
  const html2pdf = (await import("html2pdf.js")).default;

  /**
   * html2canvas لا يلتقط عناصر بعيدة خارج الشاشة → PDF فارغ.
   * نضع الحاوية داخل نافذة العرض مؤقتاً ثم نزيلها بعد الحفظ.
   */
  const wrap = document.createElement("div");
  wrap.setAttribute("dir", "rtl");
  wrap.style.cssText = [
    "position:fixed",
    "right:8px",
    "bottom:8px",
    "left:auto",
    "top:auto",
    "width:min(1024px,calc(100vw - 16px))",
    "max-height:min(90vh,calc(100vh - 16px))",
    "overflow:auto",
    "padding:20px 24px",
    "box-sizing:border-box",
    "background:#ffffff",
    "box-shadow:0 4px 24px rgba(0,0,0,.12)",
    "z-index:2147483000",
    "font-family:system-ui,'Segoe UI',Tahoma,sans-serif",
    "font-size:12px",
    "color:#111111",
    "pointer-events:none",
  ].join(";");

  const title = document.createElement("h2");
  title.style.cssText = "margin:0 0 12px;font-size:18px;font-weight:700;";
  title.textContent = "قائمة الطلبات — لوحة التحكم";
  wrap.appendChild(title);

  const meta = document.createElement("p");
  meta.style.cssText = "margin:0 0 14px;font-size:11px;color:#555;";
  meta.textContent = `عدد السجلات: ${rows.length} — ${new Date().toLocaleString("ar")}`;
  wrap.appendChild(meta);

  const table = document.createElement("table");
  table.style.cssText = "width:100%;border-collapse:collapse;font-size:11px;";
  table.innerHTML = `
    <thead>
      <tr style="background:#1a5c40;color:#fff;">
        <th style="border:1px solid #0c3528;padding:8px;text-align:right;font-weight:700;">رقم الطلب</th>
        <th style="border:1px solid #0c3528;padding:8px;text-align:right;font-weight:700;">المواطن</th>
        <th style="border:1px solid #0c3528;padding:8px;text-align:right;font-weight:700;">الخدمة</th>
        <th style="border:1px solid #0c3528;padding:8px;text-align:right;font-weight:700;">الحالة</th>
        <th style="border:1px solid #0c3528;padding:8px;text-align:right;font-weight:700;">التاريخ</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector("tbody")!;

  for (const r of rows) {
    const L = rowLabels(r);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="border:1px solid #ddd;padding:7px;text-align:right;white-space:nowrap;font-family:ui-monospace,monospace;">${escapeHtml(L.requestNumber)}</td>
      <td style="border:1px solid #ddd;padding:7px;text-align:right;">${escapeHtml(L.citizenName)}</td>
      <td style="border:1px solid #ddd;padding:7px;text-align:right;">${escapeHtml(L.serviceName)}</td>
      <td style="border:1px solid #ddd;padding:7px;text-align:right;">${escapeHtml(L.statusLabel)}</td>
      <td style="border:1px solid #ddd;padding:7px;text-align:right;white-space:nowrap;">${escapeHtml(L.dateLabel)}</td>
    `;
    tbody.appendChild(tr);
  }

  wrap.appendChild(table);
  document.body.appendChild(wrap);

  try {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
    await new Promise((r) => setTimeout(r, 80));

    await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename: `requests-${fileStamp()}.pdf`,
        image: { type: "jpeg", quality: 0.92 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollX: 0,
          scrollY: -window.scrollY,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
      })
      .from(wrap)
      .save();
  } finally {
    wrap.remove();
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
