"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { standardExport } from "@/lib/utils/export-report";
import {
  Play, CheckCircle2, Loader2, Plus, Eye, Calendar,
  Users, DollarSign, AlertCircle, Download, FileSpreadsheet,
  Building2, CheckCircle, RefreshCw, FileText, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
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
  attended_days: number;
  absent_days: number;
  late_days: number;
}

interface RunDetail {
  run_id: number;
  year: number;
  month: number;
  status: string;
  status_label: string;
  total_employees: number;
  grand_net: number;
  approved_by: string | null;
  approved_at: string | null;
  notes: string;
  lines: RunLine[];
}

const MONTHS_AR = [
  "", "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

export default function PayrollRunsPage() {
  const ar = useLangStore((state) => state.lang === "ar");

  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newRunOpen, setNewRunOpen] = useState(false);

  const [formYear, setFormYear] = useState(new Date().getFullYear().toString());
  const [formMonth, setFormMonth] = useState((new Date().getMonth() + 1).toString());
  const [formNotes, setFormNotes] = useState("");

  const [selectedRun, setSelectedRun] = useState<RunDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [approving, setApproving] = useState(false);

  const getAuthToken = () => {
    return localStorage.getItem(STORAGE_KEYS.token) ||
           localStorage.getItem("motionhr_token") ||
           localStorage.getItem("token") ||
           localStorage.getItem("auth_token");
  };

  const loadRuns = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const res = await fetch("/api/hr/payroll-runs", {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Token ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error("Failed to load payroll runs");
      const data = await res.json();
      setRuns(data.runs || []);
    } catch (err: any) {
      console.error(err);
      toast.error(ar ? "فشل تحميل مسيرات الرواتب" : "Error loading payroll runs");
    } finally {
      setLoading(false);
    }
  }, [ar]);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  const handleCreateRun = async () => {
    try {
      setCreating(true);
      const token = getAuthToken();
      const res = await fetch("/api/hr/payroll-runs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Token ${token}` } : {}),
        },
        body: JSON.stringify({
          year: parseInt(formYear, 10),
          month: parseInt(formMonth, 10),
          notes: formNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.error || data.message || "فشل إنشاء مسير الرواتب");

      toast.success(ar ? `تم إنشاء مسير الرواتب لـ ${data.total_employees} موظف بنجاح!` : "Payroll run created successfully!");
      setNewRunOpen(false);
      loadRuns();
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء إنشاء المسير");
    } finally {
      setCreating(false);
    }
  };

  const handleViewDetail = async (runId: number) => {
    try {
      setDetailLoading(true);
      setDetailOpen(true);
      const token = getAuthToken();
      const res = await fetch(`/api/hr/payroll-runs/${runId}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Token ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error("Failed to load detail");
      const data = await res.json();
      if (data.run) {
        setSelectedRun({
          run_id: data.run.id,
          year: data.run.year,
          month: data.run.month,
          status: data.run.status,
          status_label: data.run.status_label,
          total_employees: data.total_employees,
          grand_net: data.grand_net,
          approved_by: data.run.approved_by,
          approved_at: data.run.approved_at,
          notes: data.run.notes,
          lines: data.lines,
        });
      } else {
        setSelectedRun(data);
      }
    } catch (err: any) {
      toast.error(ar ? "فشل جلب تفاصيل المسير" : "Error loading details");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApprove = async (runId: number) => {
    try {
      setApproving(true);
      const token = getAuthToken();
      const res = await fetch(`/api/hr/payroll-runs/${runId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Token ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error("Approval failed");
      toast.success(ar ? "تم اعتماد مسير الرواتب بنجاح!" : "Payroll run approved!");
      setDetailOpen(false);
      loadRuns();
    } catch (err: any) {
      toast.error(err.message || "فشل اعتماد المسير");
    } finally {
      setApproving(false);
    }
  };

  // 1. التصدير النظيف للإكسيل (HTML-Based XLS)
  const handleExportExcel = async () => {
    if (!selectedRun || !selectedRun.lines || selectedRun.lines.length === 0) {
      toast.error(ar ? "لا توجد بيانات موظفين للتصدير في هذا المسير." : "No employee lines to export.");
      return;
    }
    await standardExport({
      title: ar ? `مسير رواتب ${MONTHS_AR[selectedRun.month]} ${selectedRun.year}` : `Payroll Run ${selectedRun.month}/${selectedRun.year}`,
      period: `${selectedRun.month}/${selectedRun.year}`,
      fileName: `payroll_run_${selectedRun.year}_${selectedRun.month}`,
      type: "excel",
      lang: ar ? "ar" : "en",
      columns: [
        { key: "employee_name", header: ar ? "الموظف" : "Employee", width: 24 },
        { key: "basic_salary", header: ar ? "الأساسي" : "Basic", width: 12 },
        { key: "allowances_total", header: ar ? "البدلات" : "Allowances", width: 12 },
        { key: "overtime_total", header: ar ? "إضافي" : "OT", width: 10 },
        { key: "total_deductions", header: ar ? "الخصومات" : "Deductions", width: 12 },
        { key: "net_salary", header: ar ? "الصافي" : "Net", width: 12 },
        { key: "attended_days", header: ar ? "حضور" : "Att", width: 8 },
        { key: "absent_days", header: ar ? "غياب" : "Abs", width: 8 },
      ],
      rows: selectedRun.lines as unknown as Record<string, unknown>[],
      summaryStats: [{ label: ar ? "إجمالي الصافي" : "Grand Net", value: selectedRun.grand_net || 0 }],
    });
  };

  // 2. التصدير المباشر لـ PDF بدون Pop-up Blocker (باستخدام Iframe مخفي)
  const handlePrintPDF = async () => {
    if (!selectedRun || !selectedRun.lines || selectedRun.lines.length === 0) {
      toast.error(ar ? "لا توجد بيانات للطباعة" : "No data");
      return;
    }
    await standardExport({
      title: ar ? `مسير رواتب ${MONTHS_AR[selectedRun.month]} ${selectedRun.year}` : `Payroll Run ${selectedRun.month}/${selectedRun.year}`,
      period: `${selectedRun.month}/${selectedRun.year}`,
      fileName: `payroll_run_${selectedRun.year}_${selectedRun.month}`,
      type: "pdf",
      lang: ar ? "ar" : "en",
      columns: [
        { key: "employee_name", header: ar ? "الموظف" : "Employee", width: 24 },
        { key: "basic_salary", header: ar ? "الأساسي" : "Basic", width: 12 },
        { key: "allowances_total", header: ar ? "البدلات" : "Allowances", width: 12 },
        { key: "overtime_total", header: ar ? "إضافي" : "OT", width: 10 },
        { key: "total_deductions", header: ar ? "الخصومات" : "Deductions", width: 12 },
        { key: "net_salary", header: ar ? "الصافي" : "Net", width: 12 },
      ],
      rows: selectedRun.lines as unknown as Record<string, unknown>[],
      summaryStats: [{ label: ar ? "إجمالي الصافي" : "Grand Net", value: selectedRun.grand_net || 0 }],
    });
  };

  return (
    <div className="space-y-6 p-6 md:p-8" dir={ar ? "rtl" : "ltr"}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{ar ? "تشغيل واعتماد مسيرات الرواتب" : "Payroll Runs & Approval"}</h1>
          <p className="text-sm text-muted-foreground">{ar ? "إنشاء مسيرات الرواتب الشهرية، مراجعتها، اعتمادها وتصدير التقارير" : "Generate monthly payroll runs, review, approve and export"}</p>
        </div>
        <Button onClick={() => setNewRunOpen(true)} className="gap-2 font-bold">
          <Plus className="w-5 h-5" /> {ar ? "تشغيل مسير رواتب جديد" : "New Payroll Run"}
        </Button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : runs.length > 0 ? (
          runs.map((run) => (
            <Card key={run.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                      {run.month}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold">
                          {ar ? `مسير رواتب ${MONTHS_AR[run.month]} ${run.year}` : `Payroll Run ${run.month}/${run.year}`}
                        </h3>
                        <Badge variant={run.status === "approved" ? "default" : "secondary"}>
                          {run.status === "approved" ? (ar ? "معتمد" : "Approved") : (ar ? "مسودة" : "Draft")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {ar ? `تاريخ الإنشاء: ${run.created_at || "غير محدد"}` : `Created: ${run.created_at || "N/A"}`}
                        {run.approved_by && ` • ${ar ? "معتمد بواسطة:" : "Approved by:"} ${run.approved_by}`}
                      </p>
                      {run.notes && <p className="text-xs text-muted-foreground mt-0.5">{run.notes}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-left md:text-right pl-4">
                      <p className="text-xs text-muted-foreground">{ar ? "إجمالي الموظفين" : "Total Employees"}</p>
                      <p className="text-base font-bold text-foreground">{run.total_employees} {ar ? "موظف" : "emps"}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleViewDetail(run.id)} className="gap-2 font-semibold">
                      <Eye className="w-4 h-4" /> {ar ? "عرض ومراجعة" : "Review"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <AlertCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-base font-semibold">{ar ? "لا توجد مسيرات رواتب مسجلة حتى الآن." : "No payroll runs generated yet."}</p>
              <p className="text-xs mt-1">{ar ? "اضغط على زر تشغيل مسير رواتب جديد لبدء مسير الشهر الحالي." : "Click New Payroll Run to start current month."}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={newRunOpen} onOpenChange={setNewRunOpen}>
        <DialogContent className="max-w-md" dir={ar ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{ar ? "إنشاء مسير رواتب جديد" : "Generate Payroll Run"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-semibold">{ar ? "السنة المالية" : "Year"}</label>
                <Select value={formYear} onValueChange={setFormYear}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-semibold">{ar ? "الشهر" : "Month"}</label>
                <Select value={formMonth} onValueChange={setFormMonth}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((m) => (
                      <SelectItem key={m} value={m}>{MONTHS_AR[parseInt(m)] || m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-semibold">{ar ? "ملاحظات إضافية (اختياري)" : "Notes"}</label>
              <Input
                placeholder={ar ? "مثال: مسير رواتب شهر أغسطس 2026..." : "e.g. August Payroll..."}
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button variant="outline" onClick={() => setNewRunOpen(false)}>{ar ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={handleCreateRun} disabled={creating} className="gap-2 font-bold">
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                {ar ? "حساب وإنشاء المسير" : "Calculate & Generate"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="!max-w-[95vw] !w-[95vw] sm:!max-w-[1200px] max-h-[92vh] overflow-y-auto" dir={ar ? "rtl" : "ltr"}>
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <DialogTitle className="text-2xl font-bold">
                  {selectedRun && (ar ? `تفاصيل مسير رواتب ${MONTHS_AR[selectedRun.month]} ${selectedRun.year}` : `Payroll Run ${selectedRun.month}/${selectedRun.year}`)}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedRun?.status === "approved" ? (
                    <span className="text-emerald-600 font-bold">✅ {ar ? "معتمد رسمياً" : "Approved"} ({selectedRun.approved_by} - {selectedRun.approved_at})</span>
                  ) : (
                    <span className="text-amber-600 font-bold">⚠️ {ar ? "مسودة غير معتمدة بعد" : "Pending Approval"}</span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button size="sm" variant="outline" onClick={handleExportExcel} className="gap-2 text-emerald-700 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 font-bold">
                  <FileSpreadsheet className="w-4 h-4" /> {ar ? "تصدير Excel" : "Export Excel"}
                </Button>
                <Button size="sm" variant="outline" onClick={handlePrintPDF} className="gap-2 text-blue-700 border-blue-300 bg-blue-50 hover:bg-blue-100 px-4 py-2 font-bold">
                  <FileText className="w-4 h-4" /> {ar ? "تنزيل / طباعة PDF" : "Download / Print PDF"}
                </Button>
                {selectedRun?.status !== "approved" && (
                  <Button size="sm" onClick={() => selectedRun && handleApprove(selectedRun.run_id)} disabled={approving} className="gap-2 bg-emerald-600 hover:bg-emerald-700 px-4 py-2 font-bold">
                    {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {ar ? "اعتماد وإغلاق المسير" : "Approve Run"}
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex h-60 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : selectedRun ? (
            <div className="space-y-6 pt-3">
              <div className="rounded-xl border overflow-hidden shadow-sm bg-card">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="font-bold text-sm">{ar ? "الموظف" : "Employee"}</TableHead>
                      <TableHead className="font-bold text-sm">{ar ? "الأساسي" : "Basic"}</TableHead>
                      <TableHead className="font-bold text-sm text-emerald-600">{ar ? "البدلات (+)" : "Allowances"}</TableHead>
                      <TableHead className="font-bold text-sm text-emerald-600">{ar ? "الأوفرتايم (+)" : "Overtime"}</TableHead>
                      <TableHead className="font-bold text-sm text-destructive">{ar ? "الخصومات (-)" : "Deductions"}</TableHead>
                      <TableHead className="font-bold text-sm text-blue-600">{ar ? "صافي الراتب" : "Net Salary"}</TableHead>
                      <TableHead className="font-bold text-sm text-center">{ar ? "أيام حضور" : "Att"}</TableHead>
                      <TableHead className="font-bold text-sm text-center">{ar ? "أيام غياب" : "Abs"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedRun.lines && selectedRun.lines.length > 0 ? (
                      selectedRun.lines.map((l) => (
                        <TableRow key={l.employee_id} className="hover:bg-muted/20">
                          <TableCell className="font-bold text-sm">{l.employee_name}</TableCell>
                          <TableCell className="font-medium">{l.basic_salary} EGP</TableCell>
                          <TableCell className="text-emerald-600 font-semibold">+{Number(l.allowances_total) + Number(l.bonuses_total)} EGP</TableCell>
                          <TableCell className="text-emerald-600 font-semibold">+{l.overtime_total || 0} EGP</TableCell>
                          <TableCell className="text-destructive font-semibold">-{l.total_deductions} EGP</TableCell>
                          <TableCell className="font-bold text-blue-600">{l.net_salary} EGP</TableCell>
                          <TableCell className="text-center font-medium">{l.attended_days}</TableCell>
                          <TableCell className="text-center font-medium text-destructive">{l.absent_days}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                          <p className="font-bold">{ar ? "لا توجد سطور موظفين مسجلة في هذا المسير." : "No employee lines in this run."}</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between items-center bg-blue-500/5 border border-blue-500/10 p-5 rounded-xl">
                <div>
                  <span className="font-bold text-lg block">{ar ? "إجمالي صافي المسير المستحق:" : "Grand Total Net Payable:"}</span>
                  <span className="text-xs text-muted-foreground mt-1 block">{ar ? "* يشمل كافة استحقاقات واستقطاعات الموظفين في الفترة المحددة" : "* Includes all employee earnings & deductions"}</span>
                </div>
                <span className="text-3xl font-extrabold text-blue-600">{selectedRun.grand_net || 0} EGP</span>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

