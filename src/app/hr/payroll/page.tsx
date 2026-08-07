"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  DollarSign, Users, TrendingUp, TrendingDown, Wallet,
  Search, Download, FileText, Loader2, ChevronRight,
  Building2, Calendar, Filter, BarChart3, ArrowUpDown,
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
  gross_salary: number;
  late_deduction: number;
  absence_deduction: number;
  early_leave_deduction: number;
  insurance_deduction: number;
  installments_total: number;
  penalties_total: number;
  extra_deductions_total: number;
  total_deductions: number;
  net_salary: number;
  total_working_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  mission_days: number;
  on_leave_days: number;
  total_late_minutes: number;
  overtime_hours: number;
}

interface DeptLookup { id: number; name_ar: string; name_en: string; }
interface BranchLookup { id: number; name_ar: string; name_en: string; }

interface PayrollSummary {
  year: number;
  month: number;
  total_employees: number;
  grand_total_salary: number;
  grand_total_allowances: number;
  grand_total_overtime: number;
  grand_total_bonuses: number;
  grand_total_deductions: number;
  grand_total_net: number;
  employees: PayrollEmployee[];
}

function StatCard({
  icon: Icon, label, value, color, trend,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card className="border-border/50 hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 text-xs">
                {trend === "up" && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                {trend === "down" && <TrendingDown className="w-3 h-3 text-red-500" />}
              </div>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PayrollPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [deptMap, setDeptMap] = useState<Record<string, DeptLookup>>({});
  const [branchMap, setBranchMap] = useState<Record<string, BranchLookup>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "net" | "basic">("net");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/payroll/summary?year=${year}&month=${month}`, { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/departments", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/branches", { headers: { Authorization: authHeader } }).then(r => r.json()),
    ]).then(([payData, deptData, brData]) => {
      // ØªØ£ÙƒØ¯ Ø¥Ù† Ø§Ù„Ø¯Ø§ØªØ§ ØµØ­ÙŠØ­Ø© ÙˆÙÙŠÙ‡Ø§ employees array
      const safePayData = payData && typeof payData === 'object' ? {
        year: payData.year || year,
        month: payData.month || month,
        total_employees: payData.total_employees || 0,
        grand_total_salary: payData.grand_total_salary || 0,
        grand_total_allowances: payData.grand_total_allowances || 0,
        grand_total_overtime: payData.grand_total_overtime || 0,
        grand_total_bonuses: payData.grand_total_bonuses || 0,
        grand_total_deductions: payData.grand_total_deductions || 0,
        grand_total_net: payData.grand_total_net || 0,
        employees: Array.isArray(payData.employees) ? payData.employees : [],
      } : {
        year, month,
        total_employees: 0,
        grand_total_salary: 0,
        grand_total_allowances: 0,
        grand_total_overtime: 0,
        grand_total_bonuses: 0,
        grand_total_deductions: 0,
        grand_total_net: 0,
        employees: [],
      };
      setSummary(safePayData);

      const depts = Array.isArray(deptData) ? deptData : deptData.departments || [];
      const dm: Record<string, DeptLookup> = {};
      depts.forEach((dp: DeptLookup) => { dm[dp.name_ar] = dp; });
      setDeptMap(dm);

      const brs = Array.isArray(brData) ? brData : brData.branches || [];
      const bm: Record<string, BranchLookup> = {};
      brs.forEach((b: BranchLookup) => { bm[b.name_ar] = b; });
      setBranchMap(bm);
    })
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, [year, month]);

  const getDeptDisplayName = (name: string) => {
    const item = deptMap[name];
    if (!item) return name;
    return lang === "en" && item.name_en ? item.name_en : item.name_ar;
  };

  const getBranchDisplayName = (name: string) => {
    const item = branchMap[name];
    if (!item) return name;
    return lang === "en" && item.name_en ? item.name_en : item.name_ar;
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const monthNames = [
    d.January, d.February, d.March, d.April, d.May, d.June,
    d.July, d.August, d.September, d.October, d.November, d.December,
  ];

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const employees = summary?.employees || [];
  const departments = [...new Set(employees.map(e => e.department_name))].sort();
  const branches = [...new Set(employees.map(e => e.branch_name))].sort();

  const filtered = employees.filter(emp => {
    const matchSearch = !search ||
      emp.employee_name.toLowerCase().includes(search.toLowerCase()) ||
      emp.employee_code.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "all" || emp.department_name === deptFilter;
    const matchBranch = branchFilter === "all" || emp.branch_name === branchFilter;
    return matchSearch && matchDept && matchBranch;
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortBy === "name") cmp = a.employee_name.localeCompare(b.employee_name);
    else if (sortBy === "net") cmp = a.net_salary - b.net_salary;
    else if (sortBy === "basic") cmp = a.basic_salary - b.basic_salary;
    return sortDir === "asc" ? cmp : -cmp;
  });

  const toggleSort = (col: "name" | "net" | "basic") => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
  };

  const [selectedEmp, setSelectedEmp] = useState<PayrollEmployee | null>(null);

  const handleExportExcel = () => {
    if (!sorted.length) { toast.error(lang === "ar" ? "Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ÙŠØ§Ù†Ø§Øª" : "No data"); return; }
    const header = lang === "ar" ? ["Ø§Ù„Ù…ÙˆØ¸Ù","Ø§Ù„ÙƒÙˆØ¯","Ø§Ù„Ù‚Ø³Ù…","Ø§Ù„Ø£Ø³Ø§Ø³ÙŠ","Ø§Ù„Ø¨Ø¯Ù„Ø§Øª","Ø§Ù„Ø®ØµÙˆÙ…Ø§Øª","Ø§Ù„ØµØ§ÙÙŠ"] : ["Employee","Code","Department","Basic","Allowances","Deductions","Net"];
    const rows = sorted.map(e => [e.employee_name, e.employee_code, e.department_name, e.basic_salary, (e.allowances_total + e.bonuses_total + e.overtime_bonus).toFixed(2), e.total_deductions.toFixed(2), e.net_salary.toFixed(2)].join(","));
    const csv = "\uFEFF" + header.join(",") + "\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payroll_" + year + "_" + String(month).padStart(2, "0") + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success(lang === "ar" ? "ØªÙ… Ø§Ù„ØªØµØ¯ÙŠØ±" : "Exported");
  };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.payrollTitle}</h1>
          <p className="text-muted-foreground mt-1">{d.payrollDesc}</p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Month/Year Selectors */}
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
            <Calendar className="w-4 h-4 text-muted-foreground mx-2" />
            <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
              <SelectTrigger className="border-0 bg-transparent w-[110px] focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => (
                  <SelectItem key={m} value={String(m)}>{monthNames[m - 1]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
              <SelectTrigger className="border-0 bg-transparent w-[90px] focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" className="gap-2" onClick={handleExportExcel}>
            <Download className="w-4 h-4" />
            {d.exportExcel}
          </Button>
          <Button variant="outline" className="gap-2">
            <FileText className="w-4 h-4" />
            {d.exportPDF}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <Card className="border-brand-primary/30 bg-brand-primary/5">
          <CardContent className="p-8 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-brand-primary" />
            <div className="text-center">
              <p className="text-lg font-semibold mb-1">
                {lang === "ar" ? "Ø¬Ø§Ø±ÙŠ Ø­Ø³Ø§Ø¨ Ø§Ù„Ø±ÙˆØ§ØªØ¨..." : "Calculating payroll..."}
              </p>
              <p className="text-sm text-muted-foreground">
                {lang === "ar"
                  ? "Ù‚Ø¯ ÙŠØ³ØªØºØ±Ù‚ Ø°Ù„Ùƒ Ø­ØªÙ‰ 5 Ø¯Ù‚Ø§Ø¦Ù‚ Ù„Ø£ÙˆÙ„ Ù…Ø±Ø©ØŒ Ø¨Ø±Ø¬Ø§Ø¡ Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø±"
                  : "This may take up to 5 minutes on first load, please wait"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            icon={Users}
            label={d.totalEmployees}
            value={String(summary?.total_employees || 0)}
            color="bg-blue-500/10 text-blue-600"
          />
          <StatCard
            icon={DollarSign}
            label={d.grandTotalSalary}
            value={formatCurrency(summary?.grand_total_salary || 0)}
            color="bg-emerald-500/10 text-emerald-600"
          />
          <StatCard
            icon={TrendingUp}
            label={d.grandTotalAllowances}
            value={formatCurrency((summary?.grand_total_allowances || 0) + (summary?.grand_total_overtime || 0) + (summary?.grand_total_bonuses || 0))}
            color="bg-purple-500/10 text-purple-600"
          />
          <StatCard
            icon={TrendingDown}
            label={d.grandTotalDeductions}
            value={formatCurrency(summary?.grand_total_deductions || 0)}
            color="bg-red-500/10 text-red-600"
          />
          <StatCard
            icon={Wallet}
            label={d.grandTotalNet}
            value={formatCurrency(summary?.grand_total_net || 0)}
            color="bg-brand-primary/10 text-brand-primary"
          />
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={d.searchPayroll}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>

            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-[180px]">
                <Building2 className="w-4 h-4 ml-2" />
                <SelectValue placeholder={d.filterByBranch} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === "ar" ? "ÙƒÙ„ Ø§Ù„ÙØ±ÙˆØ¹" : "All Branches"}</SelectItem>
                {branches.map(b => (
                  <SelectItem key={b} value={b}>{getBranchDisplayName(b)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 ml-2" />
                <SelectValue placeholder={d.filterByDept} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{d.allDepts}</SelectItem>
                {departments.map(dep => (
                  <SelectItem key={dep} value={dep}>{getDeptDisplayName(dep)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Panel */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand-primary" />
              <h3 className="text-lg font-semibold">{d.payrollAnalytics}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
              <p className="text-xs text-muted-foreground mb-1">{d.topPaid}</p>
              <p className="text-lg font-bold">
                {sorted[0]?.employee_name || "â€”"}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                {formatCurrency(sorted[0]?.net_salary || 0)}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
              <p className="text-xs text-muted-foreground mb-1">{d.average}</p>
              <p className="text-lg font-bold">
                {formatCurrency(
                  employees.length
                    ? Math.round((summary?.grand_total_net || 0) / employees.length)
                    : 0
                )}
              </p>
              <p className="text-sm text-emerald-600 mt-1">
                {lang === "ar" ? "Ù…ØªÙˆØ³Ø· Ø§Ù„ØµØ§ÙÙŠ" : "Average Net"}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
              <p className="text-xs text-muted-foreground mb-1">{d.grandTotalOvertime}</p>
              <p className="text-lg font-bold">
                {formatCurrency(summary?.grand_total_overtime || 0)}
              </p>
              <p className="text-sm text-purple-600 mt-1">
                {lang === "ar" ? "Ø¨Ø¯Ù„ Ø§Ù„Ø¥Ø¶Ø§ÙÙŠ" : "Overtime Bonus"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Table */}
      <Card className="border-border/50">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {d.showingOf} <span className="font-semibold text-foreground">{sorted.length}</span> {d.of}{" "}
            <span className="font-semibold text-foreground">{employees.length}</span> {d.employee_count}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className={`cursor-pointer hover:bg-muted/50 ${lang === "ar" ? "text-right" : "text-left"}`}
                  onClick={() => toggleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    {d.empName}
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead className={lang === "ar" ? "text-right" : "text-left"}>
                  {d.colDept}
                </TableHead>
                <TableHead
                  className={`cursor-pointer hover:bg-muted/50 ${lang === "ar" ? "text-right" : "text-left"}`}
                  onClick={() => toggleSort("basic")}
                >
                  <div className="flex items-center gap-1">
                    {d.basicSalaryCol}
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead className={lang === "ar" ? "text-right" : "text-left"}>
                  {d.allowancesCol}
                </TableHead>
                <TableHead className={lang === "ar" ? "text-right" : "text-left"}>
                  {d.deductionsCol}
                </TableHead>
                <TableHead
                  className={`cursor-pointer hover:bg-muted/50 ${lang === "ar" ? "text-right" : "text-left"}`}
                  onClick={() => toggleSort("net")}
                >
                  <div className="flex items-center gap-1">
                    {d.netSalaryCol}
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <p className="font-medium">{d.noPayrollData}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map(emp => (
                  <TableRow key={emp.employee_id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setSelectedEmp(emp)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9">
                          <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-sm font-semibold">
                            {emp.employee_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{emp.employee_name}</div>
                          <div className="text-xs text-muted-foreground">{emp.employee_code}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{getDeptDisplayName(emp.department_name)}</div>
                      <div className="text-xs text-muted-foreground">{getBranchDisplayName(emp.branch_name)}</div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatCurrency(emp.basic_salary)}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-emerald-600">
                      +{formatCurrency(emp.allowances_total + emp.bonuses_total + emp.overtime_bonus)}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-red-600">
                      -{formatCurrency(emp.total_deductions)}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-brand-primary/10 text-brand-primary border-0 font-mono">
                        {formatCurrency(emp.net_salary)} {emp.currency}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ChevronRight className={`w-4 h-4 text-muted-foreground ${lang === "ar" ? "rotate-180" : ""}`} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Monthly Comparison */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-brand-primary" />
            <h3 className="text-lg font-semibold">{d.monthlyComparison}</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {d.monthlyComparisonDesc}
          </p>
          <div className="h-48 flex items-center justify-center bg-muted/30 rounded-lg text-muted-foreground text-sm">
            {lang === "ar" ? "Ø§Ù„Ø±Ø³Ù… Ø§Ù„Ø¨ÙŠØ§Ù†ÙŠ Ù‚Ø±ÙŠØ¨Ø§Ù‹" : "Chart coming soon"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


