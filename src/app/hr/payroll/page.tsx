"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { standardExport } from "@/lib/utils/export-report";
import {
  DollarSign, Users, TrendingUp, TrendingDown, Wallet,
  Search, Download, FileText, Loader2, ChevronRight,
  Building2, Calendar, Filter, BarChart3, ArrowUpDown, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface PayrollEmployee {
  employee_id: number;
  employee_code: string;
  employee_name: string;
  branch_name: string;
  department_name: string;
  job_title_name: string;
  currency: string;
  basic_salary: number;
  allowances_total: number;
  bonuses_total: number;
  overtime_bonus: number;
  night_allowance: number;
  weekend_allowance: number;
  field_allowance: number;
  transport_allowance?: number;
  meal_allowance?: number;
  insurance_deduction: number;
  tax_deduction?: number;
  deductions_total?: number;
  total_deductions?: number;
  net_salary: number;
  [key: string]: any;
}

interface PayrollSummary {
  total_salaries: number;
  total_allowances: number;
  total_deductions: number;
  total_net: number;
  currency: string;
}

export default function PayrollPage() {
  const ar = useLangStore((state) => state.lang === "ar");
  const d = useDict();
  
  const [employees, setEmployees] = useState<PayrollEmployee[]>([]);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  
  // فلاتر فترات الرواتب (تلقائياً الشهر والسنة الحالية من السيرفر أو المتصفح)
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [selectedMonth, setSelectedMonth] = useState<string>("8");
  
  const [selectedEmp, setSelectedEmp] = useState<PayrollEmployee | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [entryType, setEntryType] = useState<"bonus" | "penalty" | "allowance">("penalty");
  const [amountValue, setAmountValue] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [submittingEntry, setSubmittingEntry] = useState(false);

  const getMonthName = (mStr: string) => {
    const m = parseInt(mStr, 10);
    const monthsAr = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const monthsEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return ar ? monthsAr[m - 1] : monthsEn[m - 1];
  };

  const loadPayrollData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem(STORAGE_KEYS.token) || 
                    localStorage.getItem("motionhr_token") || 
                    localStorage.getItem("token") || 
                    localStorage.getItem("auth_token");

      // إرسال الشهر والسنة المختارة للـ API
      const response = await fetch(`/api/payroll/summary?year=${selectedYear}&month=${selectedMonth}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Token ${token}` } : {}),
        },
      });

      if (response.status === 401) {
        toast.error(ar ? "انتهت الجلسة، يرجى إعادة تسجيل الدخول" : "Session expired. Please login again.");
        return;
      }

      if (!response.ok) throw new Error("Failed to load payroll data");

      const data = await response.json();
      setEmployees(data.employees ?? []);
      setSummary({
        total_salaries: data.grand_total_salary ?? data.summary?.total_salaries ?? 0,
        total_allowances: (data.grand_total_allowances ?? 0) + (data.grand_total_overtime ?? 0) + (data.grand_total_bonuses ?? 0),
        total_deductions: data.grand_total_deductions ?? data.summary?.total_deductions ?? 0,
        total_net: data.grand_total_net ?? data.summary?.total_net ?? 0,
        currency: data.employees?.[0]?.currency || "EGP"
      });
    } catch (err) {
      console.error("Payroll API error:", err);
      toast.error(ar ? "خطأ في تحميل مسيرات الرواتب للفترة المحددة" : "Error loading payroll runs for period");
    } finally {
      setLoading(false);
    }
  }, [ar, selectedYear, selectedMonth]);

  useEffect(() => {
    loadPayrollData();
  }, [loadPayrollData]);

  const handleStandardPayrollExport = async () => {
    const rows = (filteredEmployees || employees || []).map((e: any) => ({
      employee_code: e.employee_code || "",
      employee_name: e.employee_name || "",
      department_name: e.department_name || "",
      basic_salary: e.basic_salary ?? 0,
      allowances_total: e.allowances_total ?? 0,
      overtime_bonus: e.overtime_bonus ?? 0,
      total_deductions: e.total_deductions ?? e.deductions_total ?? 0,
      net_salary: e.net_salary ?? 0,
    }));
    if (!rows.length) { toast.error("لا توجد بيانات للرواتب"); return; }
    await standardExport({
      title: "مسير الرواتب",
      period: `${selectedMonth || ""}/${selectedYear || ""}`,
      fileName: `payroll_${selectedYear || "y"}_${selectedMonth || "m"}`,
      type: "excel",
      lang: "ar",
      columns: [
        { key: "employee_code", header: "الكود", width: 12 },
        { key: "employee_name", header: "الموظف", width: 24 },
        { key: "department_name", header: "القسم", width: 16 },
        { key: "basic_salary", header: "الأساسي", width: 12 },
        { key: "allowances_total", header: "البدلات", width: 12 },
        { key: "overtime_bonus", header: "إضافي", width: 12 },
        { key: "total_deductions", header: "الخصومات", width: 12 },
        { key: "net_salary", header: "الصافي", width: 12 },
      ],
      rows,
      summaryStats: [
        { label: "إجمالي الأساسي", value: summary?.total_salaries ?? 0 },
        { label: "إجمالي الصافي", value: summary?.total_net ?? 0 },
      ],
    });
  };

  const getToken = () =>
    localStorage.getItem(STORAGE_KEYS.token) ||
    localStorage.getItem("motionhr_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token");

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp || !amountValue || !reason) return;

    try {
      setSubmittingEntry(true);
      const token = localStorage.getItem(STORAGE_KEYS.token) ||
                    localStorage.getItem("motionhr_token") ||
                    localStorage.getItem("token") ||
                    localStorage.getItem("auth_token");

      const response = await fetch(`/api/hr/manual-entries/${entryType}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Token ${token}` } : {}),
        },
        body: JSON.stringify({
          employee_id: selectedEmp.employee_id,
          category: "other",
          amount_type: "fixed",
          amount_value: parseFloat(amountValue),
          reason: reason,
          target_year: parseInt(selectedYear, 10),
          target_month: parseInt(selectedMonth, 10),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to add entry");
      }

      toast.success(ar ? "تمت إضافة الحركة المالية بنجاح وتحديث الراتب!" : "Entry added successfully and payroll updated!");
      setAmountValue("");
      setReason("");
      
      // تحديث البيانات
      const updatedEmpsRes = await fetch(`/api/payroll/summary?year=${selectedYear}&month=${selectedMonth}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Token ${token}` } : {}),
        },
      });
      if (updatedEmpsRes.ok) {
        const updatedData = await updatedEmpsRes.json();
        setEmployees(updatedData.employees ?? []);
        setSummary({
          total_salaries: updatedData.grand_total_salary ?? updatedData.summary?.total_salaries ?? 0,
          total_allowances: (updatedData.grand_total_allowances ?? 0) + (updatedData.grand_total_overtime ?? 0) + (updatedData.grand_total_bonuses ?? 0),
          total_deductions: updatedData.grand_total_deductions ?? updatedData.summary?.total_deductions ?? 0,
          total_net: updatedData.grand_total_net ?? updatedData.summary?.total_net ?? 0,
          currency: updatedData.employees?.[0]?.currency || "EGP"
        });
        const matched = (updatedData.employees ?? []).find((e: any) => e.employee_id === selectedEmp.employee_id);
        if (matched) {
          setSelectedEmp(matched);
        }
      }

    } catch (err: any) {
      console.error("Add entry error:", err);
      toast.error(ar ? "فشل إضافة الحركة المالية" : "Failed to add entry");
    } finally {
      setSubmittingEntry(false);
    }
  };

  const formatCurrency = (val: number | undefined) => {
    return new Intl.NumberFormat(ar ? "ar-EG" : "en-US", {
      style: "currency",
      currency: summary?.currency || "EGP",
    }).format(val ?? 0);
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = (emp.employee_name || "").toLowerCase().includes(search.toLowerCase()) ||
                          (emp.employee_code || "").includes(search);
    const matchesBranch = branchFilter === "all" || emp.branch_name === branchFilter;
    const matchesDept = deptFilter === "all" || emp.department_name === deptFilter;
    return matchesSearch && matchesBranch && matchesDept;
  });

  return (
    <div className="space-y-6 p-6 md:p-8" dir={ar ? "rtl" : "ltr"}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{ar ? "إدارة ومسيرات الرواتب" : "Payroll Engine"}</h1>
          <p className="text-sm text-muted-foreground">{ar ? "حساب الأجور، البدلات، الخصومات وصافي المرتبات تلقائياً" : "Manage payroll, allowances, deductions and net salary"}</p>
        </div>
        <div className="flex gap-2">
          <Button className="gap-2" onClick={handleStandardPayrollExport}>
            <Download className="w-4 h-4" /> {ar ? "تصدير Excel" : "Export Excel"}
          </Button>
</div>
      </div>

      {/* كروت الإحصائيات المالية للفترة المحددة */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <span className="text-sm font-medium text-muted-foreground">{ar ? "إجمالي الرواتب الأساسية" : "Total Basic Salaries"}</span>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{loading ? "..." : formatCurrency(summary?.total_salaries)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <span className="text-sm font-medium text-emerald-600">{ar ? "إجمالي البدلات والمكافآت" : "Total Allowances"}</span>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-600">{loading ? "..." : formatCurrency(summary?.total_allowances)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <span className="text-sm font-medium text-destructive">{ar ? "إجمالي الاستقطاعات والخصومات" : "Total Deductions"}</span>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
            <div className="text-2xl font-bold text-destructive">{loading ? "..." : formatCurrency(summary?.total_deductions)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <span className="text-sm font-medium text-blue-600">{ar ? "صافي الرواتب المستحقة" : "Net Payroll Paid"}</span>
              <Wallet className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{loading ? "..." : formatCurrency(summary?.total_net)}</div>
          </CardContent>
        </Card>
      </div>

      {/* الفلاتر والبحث وفترة الرواتب */}
      <div className="rounded-xl border bg-card p-4 space-y-4 shadow-sm">
        <h4 className="text-sm font-bold flex items-center gap-2"><Filter className="w-4 h-4 text-primary" /> {ar ? "فلاتر وخيارات العرض" : "Filters & Display Options"}</h4>
        
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-5">
          {/* فلتر السنة */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{ar ? "السنة المالية" : "Fiscal Year"}</label>
            <Select value={selectedYear} onValueChange={(val) => setSelectedYear(val ?? "2026")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* فلتر الشهر */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{ar ? "شهر الرواتب" : "Payroll Month"}</label>
            <Select value={selectedMonth} onValueChange={(val) => setSelectedMonth(val ?? "8")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((m) => (
                  <SelectItem key={m} value={m}>{getMonthName(m)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* فلتر الفرع */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{ar ? "الفرع" : "Branch"}</label>
            <Select value={branchFilter} onValueChange={(val) => setBranchFilter(val ?? "all")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={ar ? "تصفية الفرع" : "Filter Branch"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{ar ? "كل الفروع" : "All Branches"}</SelectItem>
                {Array.from(new Set(employees.map(e => e.branch_name).filter(Boolean))).map(b => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* فلتر القسم */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{ar ? "القسم" : "Department"}</label>
            <Select value={deptFilter} onValueChange={(val) => setDeptFilter(val ?? "all")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={ar ? "تصفية القسم" : "Filter Dept"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{ar ? "كل الأقسام" : "All Departments"}</SelectItem>
                {Array.from(new Set(employees.map(e => e.department_name).filter(Boolean))).map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* حقل البحث بالاسم */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{ar ? "بحث بالاسم / الكود" : "Search Name / Code"}</label>
            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={ar ? "ابحث باسم الموظف..." : "Search..."}
                className="pr-9 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* جدول الرواتب والموظفين */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-36 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{ar ? "الموظف" : "Employee"}</TableHead>
                  <TableHead>{ar ? "المرتب الأساسي" : "Basic Salary"}</TableHead>
                  <TableHead className="text-emerald-600">{ar ? "البدلات (+)" : "Allowances (+)"}</TableHead>
                  <TableHead className="text-destructive">{ar ? "الاستقطاعات (-)" : "Deductions (-)"}</TableHead>
                  <TableHead className="font-bold text-blue-600">{ar ? "صافي المرتب" : "Net Salary"}</TableHead>
                  <TableHead className="text-left"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => {
                    const totalDeductions = emp.total_deductions ?? emp.deductions_total ?? 0;
                    return (
                      <TableRow key={emp.employee_id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                {(emp.employee_name || "E").charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-sm">{emp.employee_name}</p>
                              <p className="text-xs text-muted-foreground">{emp.employee_code} • {emp.job_title_name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(emp.basic_salary)}</TableCell>
                        <TableCell className="text-emerald-600">+{formatCurrency(emp.allowances_total + (emp.overtime_bonus || 0))}</TableCell>
                        <TableCell className="text-destructive">-{formatCurrency(totalDeductions)}</TableCell>
                        <TableCell className="font-bold text-blue-600">{formatCurrency(emp.net_salary)}</TableCell>
                        <TableCell className="text-left">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1"
                            onClick={() => {
                              setSelectedEmp(emp);
                              setDetailOpen(true);
                            }}
                          >
                            {ar ? "التفاصيل" : "Details"} <ChevronRight className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      {ar ? "لا توجد مسيرات رواتب مطابقة للفلاتر المحددة." : "No payroll records found for selected filters."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* موديل تفاصيل الراتب التفصيلي مع السياق التاريخي */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir={ar ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex flex-col gap-1">
              <span>{ar ? "تفاصيل مفردات المرتب" : "Payslip Breakdown"}</span>
              <span className="text-sm font-medium text-primary">
                📅 {ar ? `لفترة: ${getMonthName(selectedMonth)} ${selectedYear}` : `For Period: ${getMonthName(selectedMonth)} ${selectedYear}`}
              </span>
            </DialogTitle>
          </DialogHeader>
          {selectedEmp && (
            <div className="space-y-4 pt-3">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h4 className="font-bold text-lg">{selectedEmp.employee_name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedEmp.job_title_name} • {selectedEmp.department_name}</p>
                </div>
                <Badge>{selectedEmp.employee_code}</Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{ar ? "الراتب الأساسي" : "Basic Salary"}</span>
                  <span className="font-semibold">{formatCurrency(selectedEmp.basic_salary)}</span>
                </div>
                
                {/* استحقاقات */}
                <div className="flex justify-between text-sm text-emerald-600 border-t pt-2">
                  <span className="font-medium">{ar ? "إجمالي البدلات والمكافآت (+)" : "Total Allowances (+)"}</span>
                  <span className="font-bold">+{formatCurrency(selectedEmp.allowances_total + (selectedEmp.overtime_bonus || 0))}</span>
                </div>
                {selectedEmp.overtime_bonus > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600/80 pr-4">
                    <span>{ar ? "مكافأة إضافي (أوفرتايم)" : "Overtime Bonus"}</span>
                    <span>+{formatCurrency(selectedEmp.overtime_bonus)}</span>
                  </div>
                )}

                {/* استقطاعات */}
                <div className="flex justify-between text-sm text-destructive border-t pt-2">
                  <span className="font-medium">{ar ? "إجمالي الاستقطاعات والخصومات (-)" : "Total Deductions (-)"}</span>
                  <span className="font-bold">-{formatCurrency(selectedEmp.total_deductions ?? selectedEmp.deductions_total)}</span>
                </div>
                {selectedEmp.absence_deduction > 0 && (
                  <div className="flex justify-between text-xs text-destructive/80 pr-4">
                    <span>{ar ? "خصم غياب" : "Absence Deduction"}</span>
                    <span>-{formatCurrency(selectedEmp.absence_deduction)}</span>
                  </div>
                )}
                {selectedEmp.late_deduction > 0 && (
                  <div className="flex justify-between text-xs text-destructive/80 pr-4">
                    <span>{ar ? "خصم تأخير" : "Late Deduction"}</span>
                    <span>-{formatCurrency(selectedEmp.late_deduction)}</span>
                  </div>
                )}
              </div>

              {/* الصافي النهائي */}
              <div className="flex justify-between border-t border-dashed pt-3 text-lg font-bold text-blue-600 bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-lg">
                <span>{ar ? "صافي الراتب المستحق" : "Net Salary Payable"}</span>
                <span>{formatCurrency(selectedEmp.net_salary)}</span>
              </div>

              {/* فورم إضافة حركة مالية يدوية (خصم / مكافأة / بدل) */}
              <div className="border-t pt-4 mt-2">
                <h5 className="font-bold text-sm mb-3 text-muted-foreground flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary" />
                  {ar ? "إضافة استحقاق / استقطاع يدوي" : "Add Manual Earnings / Deductions"}
                </h5>
                <form onSubmit={handleAddEntry} className="space-y-3 bg-muted/40 p-3 rounded-lg border border-dashed">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">{ar ? "نوع الحركة" : "Entry Type"}</label>
                      <Select value={entryType} onValueChange={(val) => setEntryType(val as any)}>
                        <SelectTrigger className="h-9 bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="penalty">{ar ? "خصم / استقطاع (-)" : "Deduction / Penalty (-)"}</SelectItem>
                          <SelectItem value="bonus">{ar ? "مكافأة (+)" : "Bonus (+)"}</SelectItem>
                          <SelectItem value="allowance">{ar ? "بدل يدوّي (+)" : "Allowance (+)"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">{ar ? "القيمة (بالجنيه)" : "Amount"}</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        placeholder="0.00"
                        className="h-9 bg-background"
                        value={amountValue}
                        onChange={(e) => setAmountValue(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">{ar ? "السبب / البيان" : "Reason"}</label>
                    <Textarea
                      required
                      placeholder={ar ? "اكتب تفاصيل أو سبب الحركة المالية..." : "Reason..."}
                      className="resize-none h-16 min-h-[64px] bg-background"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>

                  <Button type="submit" size="sm" className="w-full gap-1 h-9 mt-1" disabled={submittingEntry}>
                    {submittingEntry ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    {ar ? "حفظ الحركة وتحديث الراتب فوراً" : "Add Entry & Recalculate"}
                  </Button>
                </form>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

