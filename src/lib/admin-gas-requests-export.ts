export type GasRequestExportRow = {
  gasRequestNumber: string;
  area: string;
  agentName: string;
  municipalityName?: string;
  fullName: string;
  phone: string;
  nationalId: string;
  isCompleted: boolean;
  createdAt: string;
};

function fileStamp(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function downloadAdminGasRequestsExcel(rows: GasRequestExportRow[]): Promise<void> {
  if (rows.length === 0) return;
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("طلبات_الغاز", {
    views: [{ rightToLeft: true }],
  });

  sheet.columns = [
    { header: "رقم طلب الغاز", key: "gasRequestNumber", width: 24 },
    { header: "المنطقة", key: "area", width: 20 },
    { header: "المعتمد", key: "agentName", width: 24 },
    { header: "البلدية", key: "municipalityName", width: 24 },
    { header: "الاسم الثلاثي", key: "fullName", width: 30 },
    { header: "رقم الواتساب", key: "phone", width: 20 },
    { header: "الرقم الوطني", key: "nationalId", width: 20 },
    { header: "الحالة", key: "statusLabel", width: 16 },
    { header: "تاريخ التقديم", key: "createdAtLabel", width: 18 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.alignment = { vertical: "middle", horizontal: "right" };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1a5c40" },
  };

  for (const r of rows) {
    sheet.addRow({
      gasRequestNumber: r.gasRequestNumber,
      area: r.area,
      agentName: r.agentName,
      municipalityName: r.municipalityName ?? "",
      fullName: r.fullName,
      phone: r.phone,
      nationalId: r.nationalId,
      statusLabel: r.isCompleted ? "منتهي" : "قيد المعالجة",
      createdAtLabel: new Date(r.createdAt).toLocaleDateString("ar"),
    });
  }

  sheet.eachRow((row, i) => {
    if (i === 1) return;
    row.alignment = { vertical: "middle", horizontal: "right", wrapText: true };
  });

  const buf = (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gas-requests-${fileStamp()}.xlsx`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
