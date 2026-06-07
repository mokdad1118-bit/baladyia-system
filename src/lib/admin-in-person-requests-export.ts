import type { RequestStatus } from "@/generated/prisma/enums";
import { requestStatusAr } from "@/lib/labels";

export type InPersonRequestExportRow = {
  requestNumber: string;
  inPersonNumber: string;
  citizenName: string;
  nationalId: string;
  phone: string;
  notificationEmail: string;
  municipalityName: string;
  serviceName: string;
  status: RequestStatus;
  createdAt: string;
  detailHref: string;
  files: {
    documentName: string;
    originalName: string;
    href: string;
    mimeType: string;
    size: number;
  }[];
  notes: {
    body: string;
    authorName: string;
    createdAt: string;
  }[];
};

function fileStamp(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dateTimeLabel(iso: string) {
  return new Date(iso).toLocaleString("ar-SY");
}

function sizeLabel(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileDetails(row: InPersonRequestExportRow) {
  if (row.files.length === 0) return "لا توجد مرفقات";
  return row.files
    .map((file, index) =>
      [
        `${index + 1}. ${file.documentName}`,
        `اسم الملف: ${file.originalName}`,
        `النوع: ${file.mimeType || "ملف"}`,
        `الحجم: ${sizeLabel(file.size)}`,
        `الرابط: ${file.href}`,
      ].join("\n"),
    )
    .join("\n\n");
}

function notesDetails(row: InPersonRequestExportRow) {
  if (row.notes.length === 0) return "لا توجد ملاحظات";
  return row.notes
    .map((note, index) =>
      [
        `${index + 1}. ${note.authorName}`,
        `التاريخ: ${dateTimeLabel(note.createdAt)}`,
        `الملاحظة: ${note.body}`,
      ].join("\n"),
    )
    .join("\n\n");
}

export async function downloadInPersonRequestsExcel(rows: InPersonRequestExportRow[]): Promise<void> {
  if (rows.length === 0) return;
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("الطلبات الحضورية", {
    views: [{ rightToLeft: true }],
  });

  sheet.columns = [
    { header: "رقم الطلب الحضوري", key: "inPersonNumber", width: 24 },
    { header: "رقم الطلب الداخلي", key: "requestNumber", width: 24 },
    { header: "اسم المواطن", key: "citizenName", width: 28 },
    { header: "الرقم الوطني", key: "nationalId", width: 20 },
    { header: "رقم الواتساب", key: "phone", width: 20 },
    { header: "بريد الإشعارات", key: "notificationEmail", width: 28 },
    { header: "البلدية", key: "municipalityName", width: 24 },
    { header: "الخدمة", key: "serviceName", width: 34 },
    { header: "حالة الطلب", key: "statusLabel", width: 18 },
    { header: "تاريخ التقديم", key: "createdAt", width: 24 },
    { header: "رابط تفاصيل الطلب", key: "detailHref", width: 36 },
    { header: "عدد المرفقات", key: "filesCount", width: 14 },
    { header: "تفاصيل المرفقات وروابطها", key: "files", width: 56 },
    { header: "ملاحظات الموظف أو مدير البلدية", key: "notes", width: 56 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.alignment = { vertical: "middle", horizontal: "right", wrapText: true };
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

  for (const row of rows) {
    const files = fileDetails(row);
    const notes = notesDetails(row);
    const added = sheet.addRow({
      inPersonNumber: row.inPersonNumber,
      requestNumber: row.requestNumber,
      citizenName: row.citizenName,
      nationalId: row.nationalId,
      phone: row.phone,
      notificationEmail: row.notificationEmail,
      municipalityName: row.municipalityName,
      serviceName: row.serviceName,
      statusLabel: requestStatusAr[row.status],
      createdAt: dateTimeLabel(row.createdAt),
      detailHref: row.detailHref || "",
      filesCount: row.files.length,
      files,
      notes,
    });
    const lineCount = Math.max(files.split("\n").length, notes.split("\n").length, 1);
    added.height = Math.min(240, Math.max(28, lineCount * 16));
  }

  sheet.eachRow((row, index) => {
    row.alignment = { vertical: "top", horizontal: "right", wrapText: true };
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE5E7EB" } },
        left: { style: "thin", color: { argb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
        right: { style: "thin", color: { argb: "FFE5E7EB" } },
      };
    });
  });

  const buffer = (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `in-person-requests-${fileStamp()}.xlsx`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
