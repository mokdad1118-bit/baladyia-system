export type ReturneeRegistrationExportRow = {
  registrationNumber: string;
  fullName: string;
  birthDate: string;
  nationalId: string;
  phone: string;
  email: string;
  returnStatementPath: string;
  createdAt: string;
  statusLabel: string;
};

function fileStamp(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function downloadAdminReturneeRegistrationsExcel(
  rows: ReturneeRegistrationExportRow[],
): Promise<void> {
  if (rows.length === 0) return;
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("تسجيل_العائدين", {
    views: [{ rightToLeft: true }],
  });

  sheet.columns = [
    { header: "رقم الطلب", key: "registrationNumber", width: 22 },
    { header: "الاسم الثلاثي", key: "fullName", width: 30 },
    { header: "تاريخ الميلاد", key: "birthDateLabel", width: 16 },
    { header: "الرقم الوطني", key: "nationalId", width: 18 },
    { header: "رقم الهاتف", key: "phone", width: 18 },
    { header: "البريد الإلكتروني", key: "email", width: 28 },
    { header: "الحالة", key: "statusLabel", width: 16 },
    { header: "مسار صورة بيان العودة", key: "returnStatementPath", width: 40 },
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
      registrationNumber: r.registrationNumber,
      fullName: r.fullName,
      birthDateLabel: new Date(r.birthDate).toLocaleDateString("ar"),
      nationalId: r.nationalId,
      phone: r.phone,
      email: r.email,
      statusLabel: r.statusLabel,
      returnStatementPath: r.returnStatementPath,
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
  a.download = `returnee-registrations-${fileStamp()}.xlsx`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
