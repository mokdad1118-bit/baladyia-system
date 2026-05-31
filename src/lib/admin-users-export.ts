import { UserRole } from "@/generated/prisma/enums";
import { userRoleAr } from "@/lib/labels";

export type CitizenExportRow = {
  name: string;
  email: string | null;
  notificationEmail: string | null;
  phone: string | null;
  nationalId: string | null;
  municipalityName: string | null;
  isVerified: boolean;
  isActive: boolean;
};

export type StaffUserExportRow = {
  name: string;
  email: string | null;
  notificationEmail: string | null;
  phone: string | null;
  municipalityName: string | null;
  role: UserRole;
  isActive: boolean;
  permissions: string[];
};

function fileStamp(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function writeWorkbook(
  sheetName: string,
  columns: Array<{ header: string; key: string; width: number }>,
  rows: Record<string, unknown>[],
  filename: string,
) {
  if (rows.length === 0) return;
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName, { views: [{ rightToLeft: true }] });

  sheet.columns = columns;
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.alignment = { vertical: "middle", horizontal: "right" };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1a5c40" },
  };

  for (const row of rows) sheet.addRow(row);
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
  a.download = `${filename}-${fileStamp()}.xlsx`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function downloadCitizensExcel(rows: CitizenExportRow[]) {
  await writeWorkbook(
    "حسابات_المواطنين",
    [
      { header: "الاسم", key: "name", width: 28 },
      { header: "البلدية", key: "municipalityName", width: 24 },
      { header: "البريد", key: "email", width: 30 },
      { header: "بريد الإشعارات", key: "notificationEmail", width: 30 },
      { header: "الهاتف", key: "phone", width: 18 },
      { header: "الرقم الوطني", key: "nationalId", width: 18 },
      { header: "تفعيل البريد", key: "verifiedLabel", width: 16 },
      { header: "حالة الحساب", key: "activeLabel", width: 16 },
    ],
    rows.map((r) => ({
      ...r,
      municipalityName: r.municipalityName ?? "",
      email: r.email ?? "",
      notificationEmail: r.notificationEmail ?? "",
      phone: r.phone ?? "",
      nationalId: r.nationalId ?? "",
      verifiedLabel: r.isVerified ? "مفعّل" : "غير مفعّل",
      activeLabel: r.isActive ? "نشط" : "معطّل",
    })),
    "citizens",
  );
}

export async function downloadStaffUsersExcel(rows: StaffUserExportRow[]) {
  await writeWorkbook(
    "حسابات_الموظفين",
    [
      { header: "الاسم", key: "name", width: 28 },
      { header: "الدور", key: "roleLabel", width: 18 },
      { header: "البلدية", key: "municipalityName", width: 24 },
      { header: "البريد", key: "email", width: 30 },
      { header: "بريد الإشعارات", key: "notificationEmail", width: 30 },
      { header: "الهاتف", key: "phone", width: 18 },
      { header: "الصلاحيات", key: "permissionsLabel", width: 44 },
      { header: "حالة الحساب", key: "activeLabel", width: 16 },
    ],
    rows.map((r) => ({
      ...r,
      roleLabel: userRoleAr[r.role],
      municipalityName: r.municipalityName ?? "",
      email: r.email ?? "",
      notificationEmail: r.notificationEmail ?? "",
      phone: r.phone ?? "",
      permissionsLabel: r.permissions.join("، "),
      activeLabel: r.isActive ? "نشط" : "معطّل",
    })),
    "staff-users",
  );
}
