export type AdminArchiveExportRow = {
  requestNumber: string;
  citizenName: string;
  municipalityName: string;
  createdByName: string;
  createdAt: string;
  fileLabel: string;
  fileHref: string;
};

function fileStamp(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function downloadAdminArchiveExcel(rows: AdminArchiveExportRow[]) {
  if (rows.length === 0) return;
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("الأرشيف", { views: [{ rightToLeft: true }] });

  sheet.columns = [
    { header: "رقم الطلب", key: "requestNumber", width: 22 },
    { header: "اسم المواطن", key: "citizenName", width: 28 },
    { header: "البلدية", key: "municipalityName", width: 24 },
    { header: "أضيف بواسطة", key: "createdByName", width: 24 },
    { header: "التاريخ", key: "dateLabel", width: 18 },
    { header: "المرفق", key: "file", width: 36 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.alignment = { vertical: "middle", horizontal: "right" };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1a5c40" } };

  for (const r of rows) {
    sheet.addRow({
      requestNumber: r.requestNumber,
      citizenName: r.citizenName,
      municipalityName: r.municipalityName,
      createdByName: r.createdByName,
      dateLabel: new Date(r.createdAt).toLocaleDateString("ar"),
      file: { text: r.fileLabel, hyperlink: r.fileHref },
    });
  }

  sheet.eachRow((row, i) => {
    if (i > 1) row.alignment = { vertical: "middle", horizontal: "right", wrapText: true };
  });

  const buf = (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `archive-${fileStamp()}.xlsx`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
