"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { standardExport } from "@/lib/utils/export-report";
import {
  Clock, UserCheck, UserX, Calendar, Briefcase, AlertCircle,
  Search, Filter, Loader2, ChevronLeft, ChevronRight,
  Download, FileText, Building2, MapPin, Edit3, Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

interface AttendanceEmployee {
  employee_id: number;
  attendance_id?: number;
  employee_name: string;
  department: string;
  branch: string;
  status: "present" | "late" | "absent" | "on_leave" | "weekend" | "mission" | "no_data";
  check_in: string | null;
  check_out: string | null;
  work_hours: number;
  late_minutes: number;
  early_leave_minutes: number;
  overtime_hours: number;
  is_night_shift: boolean;
  is_weekend_work: boolean;
  shift_name: string;
  gps_disabled?: boolean;
  gps_alert_note?: string;
}

interface AttendanceData {
  date: string;
  total_employees: number;
  stats: {
    present: number;
    late: number;
    absent: number;
    on_leave: number;
    weekend: number;
    mission: number;
    no_data: number;
  };
  employees: AttendanceEmployee[];
}

interface DeptLookup { id: number; name_ar: string; name_en: string; }
interface BranchLookup { id: number; name_ar: string; name_en: string; }

function StatCard({
  icon: Icon, label, value, color, active, onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Card
      className={`border transition-all cursor-pointer hover:shadow-md ${
        active ? "border-brand-primary shadow-md" : "border-border/50"
      }`}
      onClick={onClick}
    >
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

export default function AttendancePage() {
  const handleExportAttendance = async () => {
    const rows = (filteredData || data || []).map((r: any) => ({
      employee_name: r.employee_name || r.name || "",
      department: r.department_name || r.department || "",
      status: r.status || "",
      check_in: r.check_in || r.check_in_time || "",
      check_out: r.check_out || r.check_out_time || "",
      late_minutes: r.late_minutes ?? r.total_late_minutes ?? "",
      work_hours: r.work_hours ?? r.total_work_hours ?? "",
    }));
    if (!rows.length) { toast.error("لا توجد بيانات للتصدير"); return; }
    await standardExport({
      title: "تقرير الحضور اليومي",
      fileName: `attendance_${new Date().toISOString().slice(0,10)}`,
      type: "excel",
      lang: "ar",
      columns: [
        { key: "employee_name", header: "الموظف", width: 22 },
        { key: "department", header: "القسم", width: 18 },
        { key: "status", header: "الحالة", width: 12 },
        { key: "check_in", header: "حضور", width: 12 },
        { key: "check_out", header: "انصراف", width: 12 },
        { key: "late_minutes", header: "تأخير (د)", width: 12 },
        { key: "work_hours", header: "ساعات العمل", width: 14 },
      ],
      rows,
    });
  };

  const handleMonthlyReport = () => {
    window.location.href = `/hr/reports/monthly-attendance?date=${selectedDate}`;
  };
  const d = useDict();
  const lang = useLangStore((s) => s.lang);

  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [data, setData] = useState<AttendanceData | null>(null);
  const [deptMap, setDeptMap] = useState<Record<string, DeptLookup>>({});
  const [branchMap, setBranchMap] = useState<Record<string, BranchLookup>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");

  // Modal Edit Attendance State
  const [editingAtt, setEditingAtt] = useState<{
    open: boolean;
    employee_id: number;
    attendance_id: number;
    employee_name: string;
    date: string;
    check_in: string;
    check_out: string;
    status: string;
    reason: string;
  }>({
    open: false,
    employee_id: 0,
    attendance_id: 0,
    employee_name: "",
    date: "",
    check_in: "",
    check_out: "",
    status: "present",
    reason: "",
  });
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  const handleOpenAdjust = (emp: AttendanceEmployee) => {
    setEditingAtt({
      open: true,
      employee_id: emp.employee_id,
      attendance_id: emp.attendance_id || emp.employee_id,
      employee_name: emp.employee_name,
      date: selectedDate,
      check_in: emp.check_in ? emp.check_in.substring(11, 16) : (emp.check_in || ""),
      check_out: emp.check_out ? emp.check_out.substring(11, 16) : (emp.check_out || ""),
      status: emp.status === "no_data" ? "present" : emp.status,
      reason: "",
    });
  };

  const handleSaveAdjust = async () => {
    if (!editingAtt.reason.trim()) {
      toast.error(lang === "ar" ? "يجب كتابة سبب التعديل بالتفصيل" : "Please provide a reason for the adjustment");
      return;
    }

    setSubmittingAdjust(true);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.token);
      const authHeader = token?.startsWith("Token ") || token?.startsWith("Bearer ") ? token : `Token ${token}`;

      const res = await fetch(`https://jssolutions-eg.com/attendance/api/mobile/manager/attendance/${editingAtt.attendance_id}/adjust/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          check_in_time: editingAtt.check_in || null,
          check_out_time: editingAtt.check_out || null,
          status: editingAtt.status,
          reason: editingAtt.reason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(lang === "ar" ? "تم تعديل سجل الحضور بنجاح" : "Attendance record adjusted successfully");
        setEditingAtt(prev => ({ ...prev, open: false }));
        // إعادة تحميل البيانات
        fetchAttendanceData();
      } else {
        toast.error(data.message || (lang === "ar" ? "فشل التعديل" : "Failed to adjust"));
      }
    } catch (err) {
      toast.error(lang === "ar" ? "حدث خطأ أثناء حفظ التعديل" : "Error saving adjustment");
    } finally {
      setSubmittingAdjust(false);
    }
  };


  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/attendance/daily?date=${selectedDate}`, { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/departments", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/branches", { headers: { Authorization: authHeader } }).then(r => r.json()),
    ]).then(([attData, deptData, brData]) => {
      setData(attData);

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
  }, [selectedDate]);

  const getDeptName = (name: string) => {
    const item = deptMap[name];
    if (!item) return name;
    return lang === "en" && item.name_en ? item.name_en : item.name_ar;
  };

  const getBranchName = (name: string) => {
    const item = branchMap[name];
    if (!item) return name;
    return lang === "en" && item.name_en ? item.name_en : item.name_ar;
  };

  const getStatusInfo = (status: string) => {
    const map: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
      present: { label: d.statusPresent, color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20", icon: UserCheck },
      late: { label: d.statusLate, color: "bg-amber-500/10 text-amber-700 border-amber-500/20", icon: Clock },
      absent: { label: d.statusAbsent, color: "bg-red-500/10 text-red-700 border-red-500/20", icon: UserX },
      on_leave: { label: d.statusOnLeaveAtt, color: "bg-blue-500/10 text-blue-700 border-blue-500/20", icon: Calendar },
      weekend: { label: d.statusWeekend, color: "bg-gray-500/10 text-gray-700 border-gray-500/20", icon: Calendar },
      mission: { label: d.statusMission, color: "bg-purple-500/10 text-purple-700 border-purple-500/20", icon: Briefcase },
      no_data: { label: d.statusNoData, color: "bg-gray-500/10 text-gray-500 border-gray-500/20", icon: AlertCircle },
    };
    return map[status] || map.no_data;
  };

  const formatTime = (time: string | null) => {
    if (!time) return "—";
    try {
      const parts = time.split("T")[1]?.split(":") || time.split(":");
      return `${parts[0]}:${parts[1]}`;
    } catch {
      return time;
    }
  };

  const employees = data?.employees || [];
  const departments = [...new Set(employees.map(e => e.department))].sort();

  const filtered = employees.filter(emp => {
    const matchSearch = !search || emp.employee_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || emp.status === statusFilter;
    const matchDept = deptFilter === "all" || emp.department === deptFilter;
    return matchSearch && matchStatus && matchDept;
  });

  // Navigation buttons
  const navigateDate = (offset: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + offset);
    setSelectedDate(current.toISOString().split("T")[0]);
  };

  const formatDate = (dateStr: string) => {
    const dateObj = new Date(dateStr);
    return dateObj.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.attendanceTitle}</h1>
          <p className="text-muted-foreground mt-1">{d.attendanceDesc}</p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Button variant="outline" onClick={() => setSelectedDate(todayStr)} className="gap-2">
            <Calendar className="w-4 h-4" />
            {d.today}
          </Button>
          <Button variant="outline" onClick={handleExportAttendance} className="gap-2">
            <Download className="w-4 h-4" />
            {d.exportAttendance}
          </Button>
          <Button variant="outline" onClick={handleMonthlyReport} className="gap-2">
            <FileText className="w-4 h-4" />
            {d.monthlyReport}
          </Button>
        </div>
      </div>

      {/* Date Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDate(-1)}
            >
              {lang === "ar" ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </Button>

            <div className="flex-1 flex items-center justify-center gap-4">
              <Calendar className="w-5 h-5 text-brand-primary" />
              <div className="text-center">
                <div className="text-sm text-muted-foreground">{d.selectDate}</div>
                <div className="text-lg font-bold">{formatDate(selectedDate)}</div>
              </div>
              <Input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-40"
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDate(1)}
              disabled={selectedDate >= todayStr}
            >
              {lang === "ar" ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}><CardContent className="p-4"><div className="h-16 bg-muted animate-pulse rounded" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <>
      {/* ATT-10b: GPS Alert Banner */}
      {(data?.employees || []).filter(e => e.gps_disabled).length > 0 && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-red-700">
              {lang === "ar"
                ? `تحذير: ${(data?.employees || []).filter(e => e.gps_disabled).length} موظف GPS مغلق`
                : `Warning: ${(data?.employees || []).filter(e => e.gps_disabled).length} employee(s) with GPS disabled`}
            </p>
            <p className="text-sm text-red-600 mt-1">
              {(data?.employees || [])
                .filter(e => e.gps_disabled)
                .map(e => e.employee_name)
                .join(" — ")}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            icon={UserCheck}
            label={d.totalPresent}
            value={data?.stats.present || 0}
            color="bg-emerald-500/10 text-emerald-600"
            active={statusFilter === "present"}
            onClick={() => setStatusFilter(statusFilter === "present" ? "all" : "present")}
          />
          <StatCard
            icon={Clock}
            label={d.totalLate}
            value={data?.stats.late || 0}
            color="bg-amber-500/10 text-amber-600"
            active={statusFilter === "late"}
            onClick={() => setStatusFilter(statusFilter === "late" ? "all" : "late")}
          />
          <StatCard
            icon={UserX}
            label={d.totalAbsent}
            value={data?.stats.absent || 0}
            color="bg-red-500/10 text-red-600"
            active={statusFilter === "absent"}
            onClick={() => setStatusFilter(statusFilter === "absent" ? "all" : "absent")}
          />
          <StatCard
            icon={Calendar}
            label={d.totalOnLeave}
            value={data?.stats.on_leave || 0}
            color="bg-blue-500/10 text-blue-600"
            active={statusFilter === "on_leave"}
            onClick={() => setStatusFilter(statusFilter === "on_leave" ? "all" : "on_leave")}
          />
          <StatCard
            icon={Calendar}
            label={d.totalWeekend}
            value={data?.stats.weekend || 0}
            color="bg-gray-500/10 text-gray-600"
            active={statusFilter === "weekend"}
            onClick={() => setStatusFilter(statusFilter === "weekend" ? "all" : "weekend")}
          />
          <StatCard
            icon={Briefcase}
            label={d.totalMission}
            value={data?.stats.mission || 0}
            color="bg-purple-500/10 text-purple-600"
            active={statusFilter === "mission"}
            onClick={() => setStatusFilter(statusFilter === "mission" ? "all" : "mission")}
          />
        </div>
      </>
      )}
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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{d.allStatusesAtt}</SelectItem>
                <SelectItem value="present">{d.statusPresent}</SelectItem>
                <SelectItem value="late">{d.statusLate}</SelectItem>
                <SelectItem value="absent">{d.statusAbsent}</SelectItem>
                <SelectItem value="on_leave">{d.statusOnLeaveAtt}</SelectItem>
                <SelectItem value="weekend">{d.statusWeekend}</SelectItem>
                <SelectItem value="mission">{d.statusMission}</SelectItem>
              </SelectContent>
            </Select>

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

      {/* Attendance Table */}
      <Card className="border-border/50">
        <div className="p-4 border-b border-border flex items-center justify-between">
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
            <p className="font-medium">{d.noAttendanceData}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.colEmployee}</TableHead>
                <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.colDept}</TableHead>
                <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.shiftName}</TableHead>
                <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.checkIn}</TableHead>
                <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.checkOut}</TableHead>
                <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.workHours}</TableHead>
                <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.lateMinutesCol}</TableHead>
                <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.colStatus}</TableHead>
                <TableHead className="text-center w-[90px]">{lang === "ar" ? "تعديل" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(emp => {
                const statusInfo = getStatusInfo(emp.status);
                const StatusIcon = statusInfo.icon;
                return (
                  <TableRow key={emp.employee_id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9">
                          <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-sm font-semibold">
                            {emp.employee_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-medium">{emp.employee_name}</span>
                          {emp.gps_disabled && (
                            <div className="mt-1 flex items-center gap-1 text-[11px] text-red-600">
                              <MapPin className="w-3 h-3" />
                              <span>{lang === "ar" ? "GPS مغلق / الموقع غير متاح" : "GPS Off / Location Unavailable"}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{getDeptName(emp.department)}</div>
                      <div className="text-xs text-muted-foreground">{getBranchName(emp.branch)}</div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{emp.shift_name}</span>
                      {emp.is_night_shift && (
                        <Badge variant="outline" className="ml-1 bg-indigo-500/10 text-indigo-700 border-0 text-[10px]">
                          {d.nightShift}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{formatTime(emp.check_in)}</TableCell>
                    <TableCell className="font-mono text-sm">{formatTime(emp.check_out)}</TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {emp.work_hours ? emp.work_hours.toFixed(1) : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {emp.late_minutes > 0 ? (
                        <span className="text-amber-600 font-mono">{emp.late_minutes}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusInfo.color} border font-medium gap-1`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                                      <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-brand-primary"
                        onClick={() => handleOpenAdjust(emp)}
                        title={lang === "ar" ? "تعديل الحضور" : "Edit Attendance"}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Edit Attendance Dialog */}
      <Dialog open={editingAtt.open} onOpenChange={(open) => setEditingAtt(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-md" dir={lang === "ar" ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-primary" />
              <span>{lang === "ar" ? `تعديل حضور: ${editingAtt.employee_name}` : `Adjust Attendance: ${editingAtt.employee_name}`}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-md flex items-center justify-between">
              <span>{lang === "ar" ? "التاريخ:" : "Date:"}</span>
              <span className="font-semibold text-foreground font-mono">{editingAtt.date}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{lang === "ar" ? "وقت الحضور" : "Check-in Time"}</Label>
                <Input
                  type="time"
                  value={editingAtt.check_in}
                  onChange={(e) => setEditingAtt(prev => ({ ...prev, check_in: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">{lang === "ar" ? "وقت الانصراف" : "Check-out Time"}</Label>
                <Input
                  type="time"
                  value={editingAtt.check_out}
                  onChange={(e) => setEditingAtt(prev => ({ ...prev, check_out: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{lang === "ar" ? "حالة الحضور" : "Status"}</Label>
              <Select
                value={editingAtt.status}
                onValueChange={(val) => setEditingAtt(prev => ({ ...prev, status: val }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">{lang === "ar" ? "حاضر (Present)" : "Present"}</SelectItem>
                  <SelectItem value="late">{lang === "ar" ? "متأخر (Late)" : "Late"}</SelectItem>
                  <SelectItem value="absent">{lang === "ar" ? "غائب (Absent)" : "Absent"}</SelectItem>
                  <SelectItem value="early_leave">{lang === "ar" ? "انصراف مبكر (Early Leave)" : "Early Leave"}</SelectItem>
                  <SelectItem value="on_leave">{lang === "ar" ? "في إجازة (On Leave)" : "On Leave"}</SelectItem>
                  <SelectItem value="mission">{lang === "ar" ? "مأمورية (Mission)" : "Mission"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-red-600 dark:text-red-400">
                {lang === "ar" ? "سبب التعديل (إجباري) *" : "Adjustment Reason (Required) *"}
              </Label>
              <Textarea
                rows={3}
                placeholder={lang === "ar" ? "اكتب سبب تعديل الحضور بالتفصيل (مثل: عطل في البصمة، مأمورية خارجية...)" : "Detailed reason for adjustment..."}
                value={editingAtt.reason}
                onChange={(e) => setEditingAtt(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingAtt(prev => ({ ...prev, open: false }))}
              disabled={submittingAdjust}
            >
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={handleSaveAdjust}
              disabled={submittingAdjust}
              className="bg-brand-primary text-white hover:bg-brand-primary/90 gap-1.5"
            >
              {submittingAdjust ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{lang === "ar" ? "حفظ التعديل" : "Save Changes"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



