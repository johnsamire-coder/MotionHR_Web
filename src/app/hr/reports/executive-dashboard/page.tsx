"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Download, FileText, Loader2 } from "lucide-react";
import { STORAGE_KEYS } from "@/lib/constants/config";
import { useLangStore } from "@/lib/stores/language";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SLUG = "executive-dashboard";
const TITLE_AR = "التقرير التنفيذي";
const TITLE_EN = "Executive Dashboard";

export default function ReportPage() {
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);

  const getAuth = () => {
    const t = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
    if (!t) return null;
    return t.startsWith("Token") ? t : `Token ${t}`;
  };

  useEffect(() => {
    const auth = getAuth();
    if (!auth) return;
    setLoading(true);
    fetch(`/api/reports/${SLUG}`, { headers: { Authorization: auth } })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError(ar ? "فشل تحميل البيانات" : "Failed"))
      .finally(() => setLoading(false));
  }, []);

  const handleExport = async (format: "excel" | "pdf") => {
    const auth = getAuth();
    if (!auth) return;
    setExporting(format);
    try {
      const url = format === "pdf" ? `/api/reports/${SLUG}/export/pdf` : `/api/reports/${SLUG}/export`;
      const res = await fetch(url, { headers: { Authorization: auth } });
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const link = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = link;
      a.download = `${SLUG}.${format === "excel" ? "xlsx" : "pdf"}`;
      a.click();
      URL.revokeObjectURL(link);
    } catch {
      alert(ar ? "فشل التصدير" : "Export failed");
    } finally {
      setExporting(null);
    }
  };

  const rows = data?.results || [];
  const cols = rows.length > 0 ? Object.keys(rows[0]) : [];

  const LABELS: Record<string, string> = {
    employee_id: "ID", employee_code: "الكود", employee_name: "اسم الموظف",
    department: "القسم", branch: "الفرع", bank_name: "البنك",
    account_number: "رقم الحساب", iban: "IBAN", amount: "المبلغ",
    insurance_number: "رقم التأمين", basic_salary: "الراتب الأساسي",
    insurance_base: "الأساس التأميني", insurance_amount: "مبلغ التأمين",
    tax_amount: "الضريبة", metric: "البند", value: "القيمة",
    branch_name: "الفرع", employees_count: "عدد الموظفين",
    total_salary: "إجمالي الرواتب", avg_salary: "متوسط الراتب",
    max_salary: "أعلى راتب", min_salary: "أقل راتب",
    contract_end: "تاريخ الانتهاء", status: "الحالة", days: "الأيام",
    type: "النوع", subject: "الموضوع", created_at: "التاريخ",
    total_missions: "إجمالي المهام", completed: "المكتملة",
    in_progress: "جاري تنفيذها", pending: "معلقة",
    completion_rate: "نسبة الإنجاز %",
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/hr/reports")} className="p-2 rounded-lg hover:bg-muted transition">
          {ar ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
        </button>
        <div>
          <h1 className="text-2xl font-bold">{ar ? TITLE_AR : TITLE_EN}</h1>
          <p className="text-muted-foreground text-sm">
            {data?.count !== undefined ? `${data.count} ${ar ? "سجل" : "records"}` : ""}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 flex items-center justify-end gap-2">
          <button
            onClick={() => handleExport("excel")}
            disabled={exporting !== null || !data}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium"
          >
            {exporting === "excel" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {ar ? "تصدير Excel" : "Export Excel"}
          </button>
          <button
            onClick={() => handleExport("pdf")}
            disabled={exporting !== null || !data}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
          >
            {exporting === "pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {ar ? "تصدير PDF" : "Export PDF"}
          </button>
        </CardContent>
      </Card>

      {loading && <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin inline" /></div>}
      {error && <div className="text-center py-10 text-red-500">{error}</div>}

      {!loading && !error && rows.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          {ar ? "لا توجد بيانات" : "No data"}
        </div>
      )}

      {!loading && rows.length > 0 && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {cols.map((c) => (
                    <th key={c} className="px-4 py-3 text-start font-medium">
                      {LABELS[c] || c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r: any, i: number) => (
                  <tr key={i} className="hover:bg-muted/30">
                    {cols.map((c) => (
                      <td key={c} className="px-4 py-3">
                        {typeof r[c] === "object" ? JSON.stringify(r[c]) : String(r[c] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
