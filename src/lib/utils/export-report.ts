import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { CAIRO_FONT_BASE64 } from "./cairo-font";

export type ReportLang = "ar" | "en";

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
  companyLogo?: string | null;
  period?: string;
  columns: ExportColumn[];
  data: Record<string, unknown>[];
  fileName: string;
  lang: ReportLang;
  summaryStats?: { label: string; value: string | number }[];
}

function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  const raw =
    localStorage.getItem("motionhr_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    "";
  return raw;
}

function authHeader(token: string): string {
  if (!token) return "";
  return token.startsWith("Token ") || token.startsWith("Bearer ") ? token : `Token ${token}`;
}

/** جلب اسم الشركة + اللوجو من شاشة الشركة (source of truth) */
export async function getCompanyInfoForReport(): Promise<{ name: string; logo: string | null }> {
  try {
    const token = getAuthToken();
    if (!token) return { name: "", logo: null };

    const res = await fetch("/api/company/info", {
      headers: { Authorization: authHeader(token) },
      cache: "no-store",
    });
    if (!res.ok) return { name: "", logo: null };

    const data = await res.json();
    const company = data?.company || data || {};
    let logo = company.logo_url || company.logo || null;
    if (logo && typeof logo === "string" && logo.startsWith("/")) {
      logo = `https://jssolutions-eg.com${logo}`;
    }
    return {
      name: company.name_ar || company.name_en || company.name || "",
      logo: logo || null,
    };
  } catch {
    return { name: "", logo: null };
  }
}

async function urlToBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function registerCairoFont(doc: jsPDF) {
  doc.addFileToVFS("Cairo-Regular.ttf", CAIRO_FONT_BASE64);
  doc.addFont("Cairo-Regular.ttf", "Cairo", "normal");
  doc.addFont("Cairo-Regular.ttf", "Cairo", "bold");
}

async function withCompanyDefaults(config: ExportConfig): Promise<ExportConfig> {
  if (config.companyName && config.companyLogo !== undefined) return config;
  const info = await getCompanyInfoForReport();
  return {
    ...config,
    companyName: config.companyName || info.name || "MotionHR",
    companyLogo: config.companyLogo !== undefined ? config.companyLogo : info.logo,
  };
}

function cellValue(col: ExportColumn, row: Record<string, unknown>): string {
  const raw = row[col.key];
  if (col.formatter) return String(col.formatter(raw, row) ?? "");
  if (raw === null || raw === undefined) return "";
  return String(raw);
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** EXCEL موحد: اسم الشركة + لوجو + عنوان + تاريخ */
export async function exportToExcel(config: ExportConfig) {
  try {
    const cfg = await withCompanyDefaults(config);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "MotionHR";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet((cfg.title || "Report").slice(0, 31), {
      views: [{ rightToLeft: cfg.lang === "ar" }],
      properties: { defaultRowHeight: 20 },
    });

    const colCount = Math.max(cfg.columns.length, 1);
    const lastCol = colCount;

    // Logo
    if (cfg.companyLogo) {
      try {
        const b64 = await urlToBase64(cfg.companyLogo);
        if (b64 && b64.includes("base64,")) {
          const base64 = b64.split("base64,")[1];
          const ext = b64.includes("image/png") ? "png" : "jpeg";
          const imageId = workbook.addImage({ base64, extension: ext as "png" | "jpeg" });
          sheet.addImage(imageId, {
            tl: { col: 0, row: 0 },
            ext: { width: 70, height: 70 },
          });
          sheet.getRow(1).height = 55;
        }
      } catch {
        // ignore logo failures
      }
    }

    // Company name
    const companyRow = sheet.addRow([cfg.companyName || ""]);
    companyRow.height = 28;
    sheet.mergeCells(companyRow.number, 1, companyRow.number, lastCol);
    companyRow.getCell(1).font = { size: 16, bold: true, color: { argb: "FF1A0A3E" }, name: "Cairo" };
    companyRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };

    // Title
    const titleRow = sheet.addRow([cfg.title]);
    titleRow.height = 26;
    sheet.mergeCells(titleRow.number, 1, titleRow.number, lastCol);
    titleRow.getCell(1).font = { size: 13, bold: true, color: { argb: "FFFFFFFF" }, name: "Cairo" };
    titleRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    titleRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A0A3E" } };

    // Period / date
    const meta = [cfg.period, cfg.subtitle, new Date().toLocaleString(cfg.lang === "ar" ? "ar-EG" : "en-GB")]
      .filter(Boolean)
      .join("  |  ");
    const metaRow = sheet.addRow([meta]);
    sheet.mergeCells(metaRow.number, 1, metaRow.number, lastCol);
    metaRow.getCell(1).font = { size: 10, italic: true, color: { argb: "FF6B7280" }, name: "Cairo" };
    metaRow.getCell(1).alignment = { horizontal: "center" };

    sheet.addRow([]);

    // Summary
    if (cfg.summaryStats?.length) {
      for (const s of cfg.summaryStats) {
        const r = sheet.addRow([s.label, s.value]);
        r.getCell(1).font = { bold: true, name: "Cairo" };
      }
      sheet.addRow([]);
    }

    // Header
    const header = sheet.addRow(cfg.columns.map((c) => c.header));
    header.height = 22;
    header.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Cairo", size: 11 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A0A3E" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    // Data
    for (const row of cfg.data) {
      const values = cfg.columns.map((c) => cellValue(c, row));
      const r = sheet.addRow(values);
      r.eachCell((cell) => {
        cell.font = { name: "Cairo", size: 10 };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      });
    }

    cfg.columns.forEach((c, i) => {
      sheet.getColumn(i + 1).width = c.width || 18;
    });

    const buf = await workbook.xlsx.writeBuffer();
    downloadBlob(
      new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      cfg.fileName.endsWith(".xlsx") ? cfg.fileName : `${cfg.fileName}.xlsx`
    );
    toast.success(cfg.lang === "ar" ? "تم تصدير Excel بنجاح" : "Excel exported");
  } catch (e) {
    console.error(e);
    toast.error(config.lang === "ar" ? "فشل تصدير Excel" : "Excel export failed");
  }
}

/** PDF موحد: اسم الشركة + لوجو + عنوان + جدول عربي */
export async function exportToPDF(config: ExportConfig) {
  try {
    const cfg = await withCompanyDefaults(config);
    const isAr = cfg.lang === "ar";
    const doc = new jsPDF({ orientation: cfg.columns.length > 6 ? "landscape" : "portrait", unit: "mm", format: "a4" });
    registerCairoFont(doc);
    doc.setFont("Cairo", "normal");

    const pageW = doc.internal.pageSize.getWidth();
    let y = 12;

    // Logo
    if (cfg.companyLogo) {
      const b64 = await urlToBase64(cfg.companyLogo);
      if (b64) {
        try {
          doc.addImage(b64, b64.includes("image/png") ? "PNG" : "JPEG", isAr ? pageW - 28 : 12, y, 16, 16);
        } catch {
          // ignore
        }
      }
    }

    doc.setFont("Cairo", "bold");
    doc.setFontSize(14);
    doc.setTextColor(26, 10, 62);
    doc.text(cfg.companyName || "MotionHR", pageW / 2, y + 6, { align: "center" });

    doc.setFontSize(12);
    doc.text(cfg.title || "", pageW / 2, y + 14, { align: "center" });

    doc.setFont("Cairo", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100);
    const meta = [cfg.period, cfg.subtitle, new Date().toLocaleString(isAr ? "ar-EG" : "en-GB")].filter(Boolean).join(" | ");
    doc.text(meta, pageW / 2, y + 20, { align: "center" });

    y = 36;

    if (cfg.summaryStats?.length) {
      doc.setFontSize(9);
      doc.setTextColor(40);
      for (const s of cfg.summaryStats) {
        doc.text(`${s.label}: ${s.value}`, isAr ? pageW - 14 : 14, y, { align: isAr ? "right" : "left" });
        y += 5;
      }
      y += 2;
    }

    const head = [cfg.columns.map((c) => c.header)];
    const body = cfg.data.map((row) => cfg.columns.map((c) => cellValue(c, row)));

    autoTable(doc, {
      startY: y,
      head,
      body,
      styles: { font: "Cairo", fontSize: 8, halign: "center", valign: "middle", cellPadding: 2 },
      headStyles: { fillColor: [26, 10, 62], textColor: 255, font: "Cairo", fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 248, 252] },
      margin: { left: 10, right: 10 },
      didDrawPage: (data) => {
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `MotionHR • ${cfg.companyName || ""} • ${data.pageNumber}/${pageCount}`,
          pageW / 2,
          doc.internal.pageSize.getHeight() - 6,
          { align: "center" }
        );
      },
    });

    doc.save(cfg.fileName.endsWith(".pdf") ? cfg.fileName : `${cfg.fileName}.pdf`);
    toast.success(cfg.lang === "ar" ? "تم تصدير PDF بنجاح" : "PDF exported");
  } catch (e) {
    console.error(e);
    toast.error(config.lang === "ar" ? "فشل تصدير PDF" : "PDF export failed");
  }
}

/**
 * Helper سريع لأي شاشة:
 * await standardExport({ title, columns, rows, fileName, type: 'excel' | 'pdf' })
 */
export async function standardExport(opts: {
  title: string;
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
  fileName: string;
  type: "excel" | "pdf";
  period?: string;
  subtitle?: string;
  lang?: ReportLang;
  summaryStats?: { label: string; value: string | number }[];
}) {
  const config: ExportConfig = {
    title: opts.title,
    columns: opts.columns,
    data: opts.rows,
    fileName: opts.fileName,
    period: opts.period,
    subtitle: opts.subtitle,
    lang: opts.lang || "ar",
    summaryStats: opts.summaryStats,
  };
  if (opts.type === "pdf") return exportToPDF(config);
  return exportToExcel(config);
}
