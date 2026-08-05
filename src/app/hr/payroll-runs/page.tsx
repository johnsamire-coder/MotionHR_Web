"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Play, CheckCircle2, Loader2, Plus, Eye, Calendar,
  Users, DollarSign, Clock, AlertTriangle, FileText,
  Download, FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface PayrollRun {
  id: number;
  year: number;
  month: number;
  status: string;
  status_label: string;
  total_employees: number;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string | null;
  notes: string;
}

interface RunLine {
  employee_id: number;
  employee_name: string;
  basic_salary: number;
  allowances_total: number;
  bonuses_total: number;
  overtime_total: number;
  total_deductions: number;
  late_deduction: number;
  absence_deduction: number;
  insurance_deduction: number;
  net_salary: number;
  currency: string;
  attended_days: number;
  absent_days: number;
  late_days: number;
  late_minutes: number;
  overtime_hours: number;
}

interface RunDetail {
  id: number;
  year: number;
  month: number;
  status: string;
  grand_net: number;
  lines: RunLine[];
}

const MONTHS_AR = [
  "","يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"
];

// ── Export Excel ─────────────────────────────────────────
async function exportExcel(detail: RunDetail) {
  try {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    wb.creator = "MotionHR";
    const ws = wb.addWorksheet(`مرتبات ${MONTHS_AR[detail.month]} ${detail.year}`);

    // عرض الأعمدة
    ws.columns = [
      { header: "م",              key: "num",          width: 6  },
      { header: "اسم الموظف",    key: "name",         width: 25 },
      { header: "الراتب الأساسي",key: "basic",        width: 16 },
      { header: "البدلات",       key: "allow",        width: 14 },
      { header: "الأوفرتايم",    key: "ot",           width: 14 },
      { header: "المكافآت",      key: "bonus",        width: 14 },
      { header: "خصم تأخير",     key: "late_ded",     width: 14 },
      { header: "خصم غياب",      key: "abs_ded",      width: 14 },
      { header: "خصم تأمينات",   key: "ins_ded",      width: 14 },
      { header: "إجمالي خصومات", key: "total_ded",    width: 16 },
      { header: "صافي الراتب",   key: "net",          width: 16 },
      { header: "أيام حضور",     key: "att",          width: 12 },
      { header: "أيام غياب",     key: "abs",          width: 12 },
      { header: "أيام تأخير",    key: "late",         width: 12 },
    ];

    // Header style
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4A148C" } };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    headerRow.height = 22;

    // البيانات
    detail.lines.forEach((line, idx) => {
      const row = ws.addRow({
        num:       idx + 1,
        name:      line.employee_name,
        basic:     Number(line.basic_salary   || 0),
        allow:     Number(line.allowances_total|| 0),
        ot:        Number(line.overtime_total  || 0),
        bonus:     Number(line.bonuses_total   || 0),
        late_ded:  Number(line.late_deduction  || 0),
        abs_ded:   Number(line.absence_deduction|| 0),
        ins_ded:   Number(line.insurance_deduction|| 0),
        total_ded: Number(line.total_deductions|| 0),
        net:       Number(line.net_salary      || 0),
        att:       line.attended_days,
        abs:       line.absent_days,
        late:      line.late_days,
      });

      // تلوين الصافي
      const netCell = row.getCell("net");
      netCell.font  = { bold: true, color: { argb: "FF1B5E20" } };

      // تلوين صفوف بالتناوب
      if (idx % 2 === 0) {
        row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F5" } };
      }
    });

    // صف الإجمالي
    const totalRow = ws.addRow({
      num:  "",
      name: "الإجمالي",
      net:  Number(detail.grand_net || 0),
    });
    totalRow.font = { bold: true, size: 12 };
    totalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F5E9" } };
    totalRow.getCell("net").font = { bold: true, color: { argb: "FF1B5E20" }, size: 13 };

    // تنسيق الأرقام
    ["basic","allow","ot","bonus","late_ded","abs_ded","ins_ded","total_ded","net"].forEach(key => {
      ws.getColumn(key).numFmt = '#,##0.00';
    });

    // حدود لكل الخلايا
    ws.eachRow(row => {
      row.eachCell(cell => {
        cell.border = {
          top:    { style: "thin", color: { argb: "FFE0E0E0" } },
          bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
          left:   { style: "thin", color: { argb: "FFE0E0E0" } },
          right:  { style: "thin", color: { argb: "FFE0E0E0" } },
        };
      });
    });

    // تحميل الملف
    const buf  = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `payroll_${detail.year}_${detail.month}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("تم تحميل Excel ✅");
  } catch (e) {
    console.error(e);
    toast.error("فشل تحميل Excel");
  }
}

// ── Export PDF (من الباك مباشرة لكل موظف) ────────────────
async function exportRunPDF(detail: RunDetail, authH: string) {
  toast.info("جاري تجهيز PDF...");
  try {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    wb.creator = "MotionHR";

    // نعمل sheet واحد لكل موظف
    for (const line of detail.lines) {
      const ws = wb.addWorksheet(line.employee_name.substring(0, 25));
      ws.columns = [
        { header: "البند",   key: "item",  width: 30 },
        { header: "القيمة",  key: "value", width: 20 },
      ];
      const headerRow = ws.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4A148C" } };

      const rows = [
        ["الموظف",           line.employee_name],
        ["الراتب الأساسي",   Number(line.basic_salary    || 0)],
        ["البدلات",          Number(line.allowances_total || 0)],
        ["الأوفرتايم",       Number(line.overtime_total   || 0)],
        ["المكافآت",         Number(line.bonuses_total    || 0)],
        ["خصم التأخير",      Number(line.late_deduction   || 0)],
        ["خصم الغياب",       Number(line.absence_deduction|| 0)],
        ["خصم التأمينات",    Number(line.insurance_deduction|| 0)],
        ["إجمالي الخصومات",  Number(line.total_deductions || 0)],
        ["صافي الراتب",      Number(line.net_salary       || 0)],
      ];
      rows.forEach(([item, value], i) => {
        const row = ws.addRow({ item, value });
        if (i % 2 === 0) row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F5" } };
        if (item === "صافي الراتب") {
          row.font = { bold: true };
          row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F5E9" } };
        }
      });
    }

    const buf  = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `payroll_detailed_${detail.year}_${detail.month}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("تم تحميل الملف التفصيلي ✅");
  } catch (e) {
    console.error(e);
    toast.error("فشل التحميل");
  }
}

export default function PayrollRunsPage() {
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";

  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [detail, setDetail] = useState<RunDetail | null>(null);
  const [detailLoad, setDetailLoad] = useState(false);
  const [creating, setCreating] = useState(false);
  const [approving, setApproving] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [notes, setNotes] = useState("");

  const token = typeof window !== "undefined"
    ? localStorage.getItem(STORAGE_KEYS.token)
    : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hr/payroll-runs", {
        headers: { Authorization: authH },
      });
      const data = await res.json();
      setRuns(Array.isArray(data?.runs) ? data.runs : []);
    } catch {
      toast.error("فشل تحميل التشغيلات");
    } finally {
      setLoading(false);
    }
  }, [authH]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/hr/payroll-runs", {
        method: "POST",
        headers: { Authorization: authH, "Content-Type": "application/json" },
        body: JSON.stringify({ year, month, notes, lang: ar ? "ar" : "en" }),
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        toast.success(`تم حساب مرتبات ${data.total_employees} موظف ✅`);
        if (data.errors_count > 0) toast.warning(`${data.errors_count} أخطاء`);
        setShowCreate(false);
        setNotes("");
        await load();
      } else {
        toast.error(data.error || "فشل التشغيل");
      }
    } catch {
      toast.error("خطأ في الاتصال");
    } finally {
      setCreating(false);
    }
  };

  const handleApprove = async (runId: number) => {
    if (!confirm("اعتماد المرتبات؟")) return;
    setApproving(runId);
    try {
      const res = await fetch(`/api/hr/payroll-runs/${runId}/approve`, {
        method: "POST",
        headers: { Authorization: authH },
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        toast.success("تم الاعتماد ✅");
        await load();
      } else {
        toast.error(data.error || "فشل الاعتماد");
      }
    } catch {
      toast.error("خطأ");
    } finally {
      setApproving(null);
    }
  };

  const handleViewDetail = async (runId: number) => {
    setShowDetail(true);
    setDetailLoad(true);
    setDetail(null);
    try {
      const res = await fetch(`/api/hr/payroll-runs/${runId}`, {
        headers: { Authorization: authH },
      });
      const data = await res.json();
      setDetail(data?.run || data || null);
    } catch {
      toast.error("فشل تحميل التفاصيل");
      setShowDetail(false);
    } finally {
      setDetailLoad(false);
    }
  };

  const handleExportExcel = async () => {
    if (!detail) return;
    setExporting(true);
    await exportExcel(detail);
    setExporting(false);
  };

  const handleExportPDF = async () => {
    if (!detail) return;
    setExporting(true);
    await exportRunPDF(detail, authH);
    setExporting(false);
  };

  const statusBadge = (status: string, label: string) => {
    const cls =
      status === "approved"
        ? "bg-emerald-500/10 text-emerald-700 border-emerald-200"
        : status === "locked"
        ? "bg-slate-200 text-slate-700 border-slate-300"
        : "bg-amber-500/10 text-amber-700 border-amber-200";
    return <Badge className={`${cls} border`}>{label}</Badge>;
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {ar ? "تشغيل المرتبات" : "Payroll Runs"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {ar ? "حساب واعتماد مرتبات الموظفين شهرياً" : "Calculate and approve monthly payroll"}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}
          className="gap-2 bg-brand-primary hover:bg-brand-secondary">
          <Plus className="w-4 h-4" />
          {ar ? "تشغيل جديد" : "New Run"}
        </Button>
      </div>

      {runs.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{runs.filter(r => r.status === "approved").length}</p>
                <p className="text-xs text-muted-foreground">{ar ? "معتمد" : "Approved"}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{runs.filter(r => r.status === "draft").length}</p>
                <p className="text-xs text-muted-foreground">{ar ? "مسودة" : "Draft"}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{runs.length}</p>
                <p className="text-xs text-muted-foreground">{ar ? "إجمالي" : "Total"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : runs.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <DollarSign className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-6">
              {ar ? "لا توجد تشغيلات مرتبات حتى الآن" : "No payroll runs yet"}
            </p>
            <Button onClick={() => setShowCreate(true)}
              className="gap-2 bg-brand-primary hover:bg-brand-secondary">
              <Play className="w-4 h-4" />
              {ar ? "تشغيل أول شهر" : "Run first payroll"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => (
            <Card key={run.id} className="hover:shadow-md transition">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex flex-col items-center justify-center shrink-0">
                      <p className="text-xs font-bold text-brand-primary">{MONTHS_AR[run.month]?.substring(0,3)}</p>
                      <p className="text-[10px] text-brand-primary">{run.year}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{MONTHS_AR[run.month]} {run.year}</p>
                        {statusBadge(run.status, run.status_label)}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {run.total_employees} {ar ? "موظف" : "employees"}
                        </span>
                        {run.created_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {run.created_at}
                          </span>
                        )}
                        {run.approved_by && (
                          <span>{ar ? "اعتمد بواسطة:" : "By:"} {run.approved_by}</span>
                        )}
                      </div>
                      {run.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{run.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="outline" className="gap-1"
                      onClick={() => handleViewDetail(run.id)}>
                      <Eye className="w-3 h-3" />
                      {ar ? "عرض" : "View"}
                    </Button>
                    {run.status === "draft" && (
                      <Button size="sm"
                        className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={approving === run.id}
                        onClick={() => handleApprove(run.id)}>
                        {approving === run.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <CheckCircle2 className="w-3 h-3" />}
                        {ar ? "اعتماد" : "Approve"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={(v) => !v && setShowCreate(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-brand-primary" />
              {ar ? "تشغيل مرتبات جديد" : "New Payroll Run"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                {ar ? "هيتم حساب مرتبات كل الموظفين النشطين للشهر المحدد." : "Payroll will be calculated for all active employees."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">{ar ? "السنة" : "Year"}</label>
                <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{ar ? "الشهر" : "Month"}</label>
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background">
                  {MONTHS_AR.slice(1).map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{ar ? "ملاحظات" : "Notes"}</label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder={ar ? "مثال: مرتبات أغسطس 2026" : "e.g. August 2026 payroll"} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleCreate} disabled={creating}
                className="flex-1 bg-brand-primary hover:bg-brand-secondary gap-2">
                {creating
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> {ar ? "جاري التشغيل..." : "Running..."}</>
                  : <><Play className="w-4 h-4" /> {ar ? "تشغيل المرتبات" : "Run Payroll"}</>}
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1">
                {ar ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={(v) => !v && setShowDetail(false)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>
                {detail
                  ? `${ar ? "تفاصيل مرتبات" : "Payroll"} ${MONTHS_AR[detail.month]} ${detail.year}`
                  : ar ? "تفاصيل التشغيل" : "Run Details"}
              </DialogTitle>
              {detail && (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="gap-1.5"
                    disabled={exporting} onClick={handleExportExcel}>
                    {exporting
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
                    Excel
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5"
                    disabled={exporting} onClick={handleExportPDF}>
                    {exporting
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Download className="w-3.5 h-3.5 text-red-600" />}
                    تفصيلي
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>

          {detailLoad ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : detail ? (
            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-emerald-500/10 rounded-xl text-center">
                  <p className="text-xs text-muted-foreground mb-1">{ar ? "إجمالي الصافي" : "Grand Net"}</p>
                  <p className="text-lg font-bold text-emerald-700">
                    {Number(detail.grand_net || 0).toLocaleString()} EGP
                  </p>
                </div>
                <div className="p-3 bg-brand-primary/10 rounded-xl text-center">
                  <p className="text-xs text-muted-foreground mb-1">{ar ? "الموظفين" : "Employees"}</p>
                  <p className="text-lg font-bold text-brand-primary">{detail.lines?.length || 0}</p>
                </div>
                <div className="p-3 bg-slate-100 rounded-xl text-center">
                  <p className="text-xs text-muted-foreground mb-1">{ar ? "الحالة" : "Status"}</p>
                  <p className="text-sm font-bold">
                    {detail.status === "approved" ? "✅ معتمد" : detail.status === "locked" ? "🔒 مقفول" : "📝 مسودة"}
                  </p>
                </div>
              </div>

              <div className="border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-right p-3 font-medium">{ar ? "الموظف" : "Employee"}</th>
                        <th className="text-center p-3 font-medium">{ar ? "الأساسي" : "Basic"}</th>
                        <th className="text-center p-3 font-medium">{ar ? "البدلات" : "Allow."}</th>
                        <th className="text-center p-3 font-medium">{ar ? "المكافآت" : "Bonus"}</th>
                        <th className="text-center p-3 font-medium text-red-600">{ar ? "الخصومات" : "Deduct."}</th>
                        <th className="text-center p-3 font-medium text-emerald-700">{ar ? "الصافي" : "Net"}</th>
                        <th className="text-center p-3 font-medium">{ar ? "حضور" : "Present"}</th>
                        <th className="text-center p-3 font-medium">{ar ? "غياب" : "Absent"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detail.lines || []).map((line, i) => (
                        <tr key={line.employee_id}
                          className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                          <td className="p-3 font-medium">{line.employee_name}</td>
                          <td className="p-3 text-center">{Number(line.basic_salary||0).toLocaleString()}</td>
                          <td className="p-3 text-center text-blue-600">+{Number(line.allowances_total||0).toLocaleString()}</td>
                          <td className="p-3 text-center text-blue-600">+{Number(line.bonuses_total||0).toLocaleString()}</td>
                          <td className="p-3 text-center text-red-600">-{Number(line.total_deductions||0).toLocaleString()}</td>
                          <td className="p-3 text-center font-bold text-emerald-700">{Number(line.net_salary||0).toLocaleString()}</td>
                          <td className="p-3 text-center">{line.attended_days}</td>
                          <td className="p-3 text-center text-red-600">{line.absent_days}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-emerald-500/5 border-t border-border">
                      <tr>
                        <td className="p-3 font-bold">{ar ? "الإجمالي" : "Total"}</td>
                        <td colSpan={4} />
                        <td className="p-3 text-center font-bold text-emerald-700 text-base">
                          {Number(detail.grand_net || 0).toLocaleString()} EGP
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}