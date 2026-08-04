import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { CAIRO_FONT_BASE64 } from "./cairo-font";

export interface ExportColumn {
  key: string;
  header: string;
  width?: number;
  formatter?: (value: unknown, row: Record<string, unknown>) => string;
}

export interface ExportConfig {
  title: string;
  subtitle?: string;
  companyName?: string;
  period?: string;
  columns: ExportColumn[];
  data: Record<string, unknown>[];
  fileName: string;
  lang: "ar" | "en";
  summaryStats?: { label: string; value: string | number }[];
}

// ============================================
// Register Cairo font in jsPDF
// ============================================
function registerCairoFont(doc: jsPDF) {
  doc.addFileToVFS("Cairo-Regular.ttf", CAIRO_FONT_BASE64);
  doc.addFont("Cairo-Regular.ttf", "Cairo", "normal");
  doc.addFont("Cairo-Regular.ttf", "Cairo", "bold");
}

// ============================================
// EXCEL EXPORT — احترافي
// ============================================
export async function exportToExcel(config: ExportConfig) {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "MotionHR";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(config.title, {
      views: [{ rightToLeft: config.lang === "ar" }],
      properties: { defaultRowHeight: 20 },
    });

    // ========== HEADER ==========
    if (config.companyName) {
      const row1 = sheet.addRow([config.companyName]);
      row1.height = 30;
      sheet.mergeCells(`A1:${String.fromCharCode(64 + config.columns.length)}1`);
      row1.eachCell(cell => {
        cell.font = { size: 16, bold: true, color: { argb: "FF1A1B4B" }, name: "Cairo" };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
      });
    }

    const titleRow = sheet.addRow([config.title]);
    titleRow.height = 28;
    sheet.mergeCells(`A${titleRow.number}:${String.fromCharCode(64 + config.columns.length)}${titleRow.number}`);
    titleRow.eachCell(cell => {
      cell.font = { size: 14, bold: true, color: { argb: "FFFFFFFF" }, name: "Cairo" };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A1B4B" } };
    });

    if (config.period) {
      const periodRow = sheet.addRow([config.period]);
      periodRow.height = 22;
      sheet.mergeCells(`A${periodRow.number}:${String.fromCharCode(64 + config.columns.length)}${periodRow.number}`);
      periodRow.eachCell(cell => {
        cell.font = { size: 11, italic: true, color: { argb: "FF6B7280" }, name: "Cairo" };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });
    }

    sheet.addRow([]);

    // ========== SUMMARY STATS ==========
    if (config.summaryStats && config.summaryStats.length > 0) {
      const statsHeaderRow = sheet.addRow(config.summaryStats.map(s => s.label));
      statsHeaderRow.eachCell(cell => {
        cell.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" }, name: "Cairo" };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF00D4A0" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin", color: { argb: "FFCCCCCC" } },
          bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
          left: { style: "thin", color: { argb: "FFCCCCCC" } },
          right: { style: "thin", color: { argb: "FFCCCCCC" } },
        };
      });
      statsHeaderRow.height = 22;

      const statsValueRow = sheet.addRow(config.summaryStats.map(s => s.value));
      statsValueRow.eachCell(cell => {
        cell.font = { bold: true, size: 14, color: { argb: "FF1A1B4B" }, name: "Cairo" };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9FAFB" } };
        cell.border = {
          bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
          left: { style: "thin", color: { argb: "FFCCCCCC" } },
          right: { style: "thin", color: { argb: "FFCCCCCC" } },
        };
      });
      statsValueRow.height = 30;
      sheet.addRow([]);
    }

    // ========== TABLE HEADERS ==========
    const headerRow = sheet.addRow(config.columns.map(c => c.header));
    headerRow.height = 26;
    headerRow.eachCell(cell => {
      cell.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" }, name: "Cairo" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A1B4B" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "medium", color: { argb: "FF000000" } },
        bottom: { style: "medium", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      };
    });

    // ========== TABLE DATA ==========
    config.data.forEach((row, idx) => {
      const rowValues = config.columns.map(col => {
        const val = row[col.key];
        if (col.formatter) return col.formatter(val, row);
        return val ?? "—";
      });

      const dataRow = sheet.addRow(rowValues);
      dataRow.height = 22;
      const isEven = idx % 2 === 0;

      dataRow.eachCell(cell => {
        cell.font = { size: 10, name: "Cairo" };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.fill = {
          type: "pattern", pattern: "solid",
          fgColor: { argb: isEven ? "FFFFFFFF" : "FFF9FAFB" },
        };
        cell.border = {
          bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
          left: { style: "thin", color: { argb: "FFE5E7EB" } },
          right: { style: "thin", color: { argb: "FFE5E7EB" } },
        };
      });
    });

    // ========== COLUMN WIDTHS ==========
    config.columns.forEach((col, idx) => {
      const column = sheet.getColumn(idx + 1);
      column.width = col.width || 20;
    });

    // ========== FOOTER ==========
    sheet.addRow([]);
    const footerRow = sheet.addRow([
      config.lang === "ar"
        ? `تم الإنشاء بواسطة MotionHR — ${new Date().toLocaleDateString("ar-EG")}`
        : `Generated by MotionHR — ${new Date().toLocaleDateString("en-US")}`
    ]);
    sheet.mergeCells(`A${footerRow.number}:${String.fromCharCode(64 + config.columns.length)}${footerRow.number}`);
    footerRow.eachCell(cell => {
      cell.font = { size: 9, italic: true, color: { argb: "FF9CA3AF" }, name: "Cairo" };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.fileName}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(config.lang === "ar" ? "تم تحميل الملف بنجاح" : "File downloaded successfully");
  } catch (error) {
    console.error("Excel export error:", error);
    toast.error(config.lang === "ar" ? "فشل تحميل الملف" : "Failed to download file");
  }
}

// ============================================
// PDF EXPORT — احترافي مع دعم العربي
// ============================================
export async function exportToPDF(config: ExportConfig) {
  try {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Register Cairo font (supports Arabic)
    registerCairoFont(doc);
    doc.setFont("Cairo");

    const pageWidth = doc.internal.pageSize.getWidth();
    const isRTL = config.lang === "ar";

    // ========== HEADER BAR ==========
    doc.setFillColor(26, 27, 75); // brand primary
    doc.rect(0, 0, pageWidth, 22, "F");

    // Logo text (Left)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("Cairo", "bold");
    doc.text("MotionHR", 14, 14);

    // Subtitle
    doc.setFontSize(9);
    doc.setFont("Cairo", "normal");
    doc.setTextColor(200, 200, 200);
    doc.text("Workforce Platform", 14, 19);

    // Company name (Right)
    if (config.companyName) {
      doc.setFontSize(12);
      doc.setFont("Cairo", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(config.companyName, pageWidth - 14, 14, { align: "right" });
    }

    // ========== REPORT TITLE ==========
    doc.setTextColor(26, 27, 75);
    doc.setFontSize(16);
    doc.setFont("Cairo", "bold");
    doc.text(config.title, pageWidth / 2, 34, { align: "center" });

    if (config.subtitle) {
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.setFont("Cairo", "normal");
      doc.text(config.subtitle, pageWidth / 2, 40, { align: "center" });
    }

    if (config.period) {
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.setFont("Cairo", "normal");
      doc.text(config.period, pageWidth / 2, 46, { align: "center" });
    }

    // ========== SUMMARY STATS ==========
    let startY = 52;

    if (config.summaryStats && config.summaryStats.length > 0) {
      autoTable(doc, {
        startY: startY,
        head: [config.summaryStats.map(s => s.label)],
        body: [config.summaryStats.map(s => String(s.value))],
        theme: "grid",
        styles: {
          font: "Cairo",
          fontSize: 10,
          halign: "center",
          valign: "middle",
        },
        headStyles: {
          fillColor: [0, 212, 160],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 10,
          font: "Cairo",
        },
        bodyStyles: {
          fontSize: 13,
          fontStyle: "bold",
          textColor: [26, 27, 75],
          font: "Cairo",
          minCellHeight: 14,
        },
        margin: { left: 14, right: 14 },
      });

      startY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    }

    // ========== MAIN TABLE ==========
    autoTable(doc, {
      startY: startY,
      head: [config.columns.map(c => c.header)],
      body: config.data.map(row =>
        config.columns.map(col => {
          const val = row[col.key];
          if (col.formatter) return col.formatter(val, row);
          return val !== undefined && val !== null ? String(val) : "—";
        })
      ),
      theme: "striped",
      styles: {
        font: "Cairo",
        fontSize: 9,
        halign: isRTL ? "right" : "left",
        valign: "middle",
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [26, 27, 75],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
        fontSize: 10,
        font: "Cairo",
        minCellHeight: 11,
      },
      bodyStyles: {
        fontSize: 9,
        halign: "center",
        font: "Cairo",
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      margin: { left: 14, right: 14 },
    });

    // ========== FOOTER ==========
    const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageHeight = doc.internal.pageSize.getHeight();

      // Line
      doc.setDrawColor(229, 231, 235);
      doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

      // Footer text
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.setFont("Cairo", "normal");

      const footerText = isRTL
        ? `تم الإنشاء بواسطة MotionHR — ${new Date().toLocaleDateString("ar-EG")}`
        : `Generated by MotionHR — ${new Date().toLocaleDateString("en-US")}`;

      doc.text(footerText, 14, pageHeight - 8);
      doc.text(
        isRTL ? `صفحة ${i} من ${pageCount}` : `Page ${i} of ${pageCount}`,
        pageWidth - 14,
        pageHeight - 8,
        { align: "right" }
      );
    }

    doc.save(`${config.fileName}.pdf`);
    toast.success(config.lang === "ar" ? "تم تحميل الملف بنجاح" : "File downloaded successfully");
  } catch (error) {
    console.error("PDF export error:", error);
    toast.error(config.lang === "ar" ? "فشل تحميل الملف" : "Failed to download file");
  }
}
