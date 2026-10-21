import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** تنظيف نص قبل ما يتحط جوه HTML (زي نوافذ الخريطة) عشان محدش يحقن كود */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// تاريخ النهارده بتوقيت مصر (YYYY-MM-DD). toISOString بيرجع جرينتش، فبعد نص الليل
// في مصر (لحد الساعة 2 أو 3 الصبح) كان بيطلع تاريخ امبارح
export function todayCairo(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

// السنة والشهر الحاليين بتوقيت مصر
export function cairoYearMonth(): { year: number; month: number } {
  const [y, m] = todayCairo().split("-").map(Number);
  return { year: y, month: m };
}
