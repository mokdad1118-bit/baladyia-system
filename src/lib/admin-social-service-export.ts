export type SocialAttachment = { href: string; label: string };
export type SocialServiceExportRow = {
  caseNumber: string;
  category: string;
  ownerName: string;
  nationalId: string;
  phone: string;
  statusLabel: string;
  createdAt: string;
  attachments: SocialAttachment[];
};

function fileStamp(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function downloadAdminSocialServicesExcel(rows: SocialServiceExportRow[]) {
  if (!rows.length) return;
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("الخدمات_الاجتماعية", { views: [{ rightToLeft: true }] });
  sheet.columns = [
    { header: "رقم الطلب", key: "caseNumber", width: 22 },
    { header: "القسم", key: "category", width: 20 },
    { header: "الاسم", key: "ownerName", width: 28 },
    { header: "الرقم الوطني", key: "nationalId", width: 18 },
    { header: "الهاتف", key: "phone", width: 18 },
    { header: "الحالة", key: "statusLabel", width: 16 },
    { header: "التاريخ", key: "dateLabel", width: 16 },
    { header: "المرفقات", key: "attachments", width: 42 },
  ];
  const h = sheet.getRow(1);
  h.font = { bold: true, color: { argb: "FFFFFFFF" } };
  h.alignment = { vertical: "middle", horizontal: "right" };
  h.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1a5c40" } };
  for (const r of rows) {
    sheet.addRow({
      caseNumber: r.caseNumber,
      category: r.category,
      ownerName: r.ownerName,
      nationalId: r.nationalId,
      phone: r.phone,
      statusLabel: r.statusLabel,
      dateLabel: new Date(r.createdAt).toLocaleDateString("ar"),
      attachments: r.attachments.map((a) => `${a.label}: ${a.href}`).join("\n"),
    });
  }
  sheet.eachRow((row, i) => {
    if (i === 1) return;
    row.alignment = { vertical: "middle", horizontal: "right", wrapText: true };
  });
  const buf = (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `social-services-${fileStamp()}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function downloadAdminSocialServicesPdf(rows: SocialServiceExportRow[]) {
  if (!rows.length) return;
  const html2pdf = (await import("html2pdf.js")).default;
  const wrap = document.createElement("div");
  wrap.setAttribute("dir", "rtl");
  wrap.style.cssText = "position:fixed;right:8px;bottom:8px;width:min(1024px,calc(100vw - 16px));max-height:min(90vh,calc(100vh - 16px));overflow:auto;padding:20px;background:#fff;z-index:2147483000;font-family:system-ui,'Segoe UI',Tahoma,sans-serif;font-size:12px;color:#111;";
  wrap.innerHTML = `<h2 style="margin:0 0 12px;font-size:18px;font-weight:700;">قائمة الخدمات الاجتماعية</h2><p style="margin:0 0 14px;font-size:11px;color:#555;">عدد السجلات: ${rows.length} — ${new Date().toLocaleString("ar")}</p>`;
  const table = document.createElement("table");
  table.style.cssText = "width:100%;border-collapse:collapse;font-size:11px;";
  table.innerHTML = `<thead><tr style="background:#1a5c40;color:#fff;"><th style="border:1px solid #0c3528;padding:8px;text-align:right;">رقم الطلب</th><th style="border:1px solid #0c3528;padding:8px;text-align:right;">القسم</th><th style="border:1px solid #0c3528;padding:8px;text-align:right;">الاسم</th><th style="border:1px solid #0c3528;padding:8px;text-align:right;">الرقم الوطني</th><th style="border:1px solid #0c3528;padding:8px;text-align:right;">الهاتف</th><th style="border:1px solid #0c3528;padding:8px;text-align:right;">الحالة</th><th style="border:1px solid #0c3528;padding:8px;text-align:right;">التاريخ</th></tr></thead><tbody></tbody>`;
  const tbody = table.querySelector("tbody")!;
  for (const r of rows) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td style="border:1px solid #ddd;padding:7px;">${r.caseNumber}</td><td style="border:1px solid #ddd;padding:7px;">${r.category}</td><td style="border:1px solid #ddd;padding:7px;">${r.ownerName}</td><td style="border:1px solid #ddd;padding:7px;">${r.nationalId || "—"}</td><td style="border:1px solid #ddd;padding:7px;">${r.phone}</td><td style="border:1px solid #ddd;padding:7px;">${r.statusLabel}</td><td style="border:1px solid #ddd;padding:7px;">${new Date(r.createdAt).toLocaleDateString("ar")}</td>`;
    tbody.appendChild(tr);
  }
  wrap.appendChild(table);
  document.body.appendChild(wrap);
  try {
    await html2pdf().set({ margin: [10, 10, 10, 10], filename: `social-services-${fileStamp()}.pdf`, image: { type: "jpeg", quality: 0.92 }, html2canvas: { scale: 2, useCORS: true, logging: false }, jsPDF: { unit: "mm", format: "a4", orientation: "landscape" } }).from(wrap).save();
  } finally {
    wrap.remove();
  }
}
