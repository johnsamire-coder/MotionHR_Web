"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Calendar, Search, Filter, Loader2, CheckCircle2, XCircle,
  Clock, Users, Plus, Download, Building2, Activity, Palette,
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
import { XCircle as XIcon } from "lucide-react";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";
import { AddLeaveDialog } from "@/components/hr/add-leave-dialog";

interface LeaveBalance {
  leave_type: string;
  leave_type_en?: string;
  total_days: number;
  used_days: number;
  pending_days: number;
  remaining_days: number;
}

interface LeaveItem {
  id?: number;
  leave_type?: string;
  from_date?: string;
  to_date?: string;
  status?: string;
  days?: number;
}

interface EmployeeLeaves {
  employee_id: number;
  employee_name: string;
  department: string;
  total_approved_days: number;
  unpaid_days: number;
  half_day_count: number;
  leaves_count: number;
  leaves: LeaveItem[];
  balances: LeaveBalance[];
}

interface LeavesData {
  year: number;
  month: number;
  total_employees: number;
  employees: EmployeeLeaves[];
}

interface LeaveType {
  id: number;
  name: string;
  name_en?: string;
  category: string;
  days_allowed: number;
  is_paid: boolean;
  color: string;
  balance: {
    total: number;
    used: number;
    pending: number;
    remaining: number;
  };
}

interface DeptLookup { id: number; name_ar: string; name_en: string; }

function StatCard({
  icon: Icon, label, value, color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card className="border-border/50 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LeavesPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<LeavesData | null>(null);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [deptMap, setDeptMap] = useState<Record<string, DeptLookup>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [showAddLeave, setShowAddLeave] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<EmployeeLeaves | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/leaves/enhanced?year=${year}&month=${month}`, { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/leaves/types", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/departments", { headers: { Authorization: authHeader } }).then(r => r.json()),
    ]).then(([leavesData, typesData, deptData]) => {
      setData(leavesData);
      setLeaveTypes(typesData?.leave_types || []);

      const depts = Array.isArray(deptData) ? deptData : deptData.departments || [];
      const dm: Record<string, DeptLookup> = {};
      depts.forEach((dp: DeptLookup) => { dm[dp.name_ar] = dp; });
      setDeptMap(dm);
    })
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, [year, month]);


  const getLeaveTypeName = (type: LeaveType) => {
    return lang === "en" && type.name_en ? type.name_en : type.name;
  };

  const getDeptName = (name: string) => {
    const item = deptMap[name];
    if (!item) return name;
    return lang === "en" && item.name_en ? item.name_en : item.name_ar;
  };

  const monthNames = [
    d.January, d.February, d.March, d.April, d.May, d.June,
    d.July, d.August, d.September, d.October, d.November, d.December,
  ];

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const employees = data?.employees || [];
  const departments = [...new Set(employees.map(e => e.department))].sort();

  const handleCancelLeave = async (leaveId: number) => {
    const reason = window.prompt("سبب الإلغاء:");
    if (!reason || !reason.trim()) return;
    setCancelling(leaveId);
    try {
      const res = await fetch("/api/leaves/" + leaveId + "/cancel", {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        toast.success(data.message || "تم الإلغاء");
        setSelectedEmp(null);
        reloadData();
      } else {
        toast.error(data.error || data.message || "فشل الإلغاء");
      }
    } catch {
      toast.error("خطأ في الشبكة");
    } finally {
      setCancelling(null);
    }
  };

  const handleExportLeaves = () => {
    const header = ["الموظف","القسم","إجمالي الأيام","غير مدفوعة","نصف يوم","عدد الطلبات"];
    const rows = filtered.map(e => [e.employee_name, e.department, e.total_approved_days, e.unpaid_days, e.half_day_count, e.leaves_count]);
    const csv = "\uFEFF" + [header,...rows].map(r=>r.join(",")).join("\n");
    const blob = new Blob([csv], {type:"text/csv;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "leaves_" + year + "_" + month + ".csv";
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const reloadData = () => {
    setLoading(true);
    fetch("/api/leaves/enhanced?year=" + year + "&month=" + month, { headers: { Authorization: authHeader } })
      .then(r => r.json()).then(d => setData(d)).finally(() => setLoading(false));
  };

  const filtered = employees.filter(emp => {
    const matchSearch = !search || emp.employee_name.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "all" || emp.department === deptFilter;
    return matchSearch && matchDept;
  });

  // Stats
  const totalApproved = employees.reduce((sum, e) => sum + (e.leaves?.filter(l => l.status === "approved").length || 0), 0);
  const totalPending = employees.reduce((sum, e) => sum + (e.leaves?.filter(l => l.status === "pending").length || 0), 0);
  const totalRejected = employees.reduce((sum, e) => sum + (e.leaves?.filter(l => l.status === "rejected").length || 0), 0);
  const totalLeaves = totalApproved + totalPending + totalRejected;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.leavesTitle}</h1>
          <p className="text-muted-foreground mt-1">{d.leavesDesc}</p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
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

          <Button variant="outline" onClick={handleExportLeaves} className="gap-2">
            <Download className="w-4 h-4" />
            {d.exportExcel}
          </Button>
          <Button onClick={() => setShowAddLeave(true)} className="gap-2 bg-brand-primary hover:bg-brand-primary/90">
            <Plus className="w-4 h-4" />
            {d.addLeave}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-4"><div className="h-16 bg-muted animate-pulse rounded" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Activity} label={d.totalLeaves} value={totalLeaves} color="bg-blue-500/10 text-blue-600" />
          <StatCard icon={CheckCircle2} label={d.approvedLeaves} value={totalApproved} color="bg-emerald-500/10 text-emerald-600" />
          <StatCard icon={Clock} label={d.pendingLeaves} value={totalPending} color="bg-amber-500/10 text-amber-600" />
          <StatCard icon={XCircle} label={d.rejectedLeaves} value={totalRejected} color="bg-red-500/10 text-red-600" />
        </div>
      )}

      {/* Leave Types Cards */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-brand-primary" />
            <h3 className="text-lg font-semibold">{d.leaveTypesTitle}</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {leaveTypes.map(type => (
              <Card key={type.id} className="border-2" style={{ borderColor: type.color + "40" }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: type.color + "20", color: type.color }}
                    >
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{getLeaveTypeName(type)}</p>
                    </div>
                  </div>

                  <div className="space-y-1 mt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{d.daysAllowed}</span>
                      <span className="font-bold" style={{ color: type.color }}>
                        {type.days_allowed} {d.daysUnit}
                      </span>
                    </div>
                    {!type.is_paid && (
                      <Badge variant="outline" className="text-[10px] bg-gray-500/10 border-0 mt-1">
                        {d.colUnpaid}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={d.searchEmployees}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>

            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-[180px]">
                <Building2 className="w-4 h-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{d.allDepts}</SelectItem>
                {departments.map(dep => (
                  <SelectItem key={dep} value={dep}>{getDeptName(dep)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employees Balances Table */}
      <Card className="border-border/50">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-primary" />
            <h3 className="text-lg font-semibold">{d.balancesTitle}</h3>
          </div>
          <div className="text-sm text-muted-foreground">
            {d.showingOf} <span className="font-semibold text-foreground">{filtered.length}</span> {d.of}{" "}
            <span className="font-semibold text-foreground">{employees.length}</span> {d.employee_count}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="font-medium">{d.noLeavesData}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.colEmployee}</TableHead>
                <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.colDept}</TableHead>
                {leaveTypes.map(type => (
                  <TableHead
                    key={type.id}
                    className={lang === "ar" ? "text-right" : "text-left"}
                  >
                    <div className="text-xs" style={{ color: type.color }}>{getLeaveTypeName(type)}</div>
                  </TableHead>
                ))}
                <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.colUnpaid}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(emp => (
                <TableRow key={emp.employee_id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-sm font-semibold">
                          {emp.employee_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <button onClick={() => setSelectedEmp(emp)} className="font-medium text-brand-primary hover:underline text-right">{emp.employee_name}</button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{getDeptName(emp.department)}</span>
                  </TableCell>

                  {leaveTypes.map(type => {
                    const balance = emp.balances?.find(b => b.leave_type === type.name);
                    if (!balance) return <TableCell key={type.id}>—</TableCell>;
                    return (
                      <TableCell key={type.id}>
                        <div className="flex flex-col">
                          <div className="text-sm font-semibold" style={{ color: type.color }}>
                            {balance.remaining_days} / {balance.total_days}
                          </div>
                          {balance.used_days > 0 && (
                            <div className="text-[10px] text-muted-foreground">
                              {d.daysUsed}: {balance.used_days}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    );
                  })}

                  <TableCell>
                    {emp.unpaid_days > 0 ? (
                      <span className="text-gray-600 font-semibold">{emp.unpaid_days}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {selectedEmp && (
        <Dialog open={!!selectedEmp} onOpenChange={v => !v && setSelectedEmp(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إجازات {selectedEmp.employee_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 pt-2">
              {selectedEmp.leaves && selectedEmp.leaves.length > 0 ? (
                selectedEmp.leaves.map((lv: any) => (
                  <div key={lv.id} className="border rounded p-3 flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-medium">{lv.leave_type}</div>
                      <div className="text-xs text-muted-foreground">من {lv.start_date} إلى {lv.end_date} ({lv.days_count} يوم)</div>
                      {lv.reason && <div className="text-xs mt-1">{lv.reason}</div>}
                    </div>
                    <Badge className={
                      lv.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                      lv.status === "pending" ? "bg-amber-100 text-amber-700" :
                      lv.status === "rejected" ? "bg-red-100 text-red-700" :
                      "bg-slate-100 text-slate-700"
                    }>
                      {lv.status === "approved" ? "موافق" : lv.status === "pending" ? "معلق" : lv.status === "rejected" ? "مرفوض" : "ملغي"}
                    </Badge>
                    {(lv.status === "approved" || lv.status === "pending") && (
                      <Button size="sm" variant="outline" disabled={cancelling === lv.id} onClick={() => handleCancelLeave(lv.id)} className="text-red-600 border-red-200 hover:bg-red-50">
                        {cancelling === lv.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XIcon className="w-3 h-3" />}
                        إلغاء
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">لا توجد إجازات</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <AddLeaveDialog open={showAddLeave} onClose={() => setShowAddLeave(false)} onSuccess={reloadData} />
    </div>
  );
}
