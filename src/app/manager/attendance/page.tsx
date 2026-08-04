"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Users, UserCheck, UserX, Clock, Calendar, ChevronLeft,
  ChevronRight, Loader2, Search, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface AttRecord {
  employee_id: number;
  employee_name: string;
  employee_code: string;
  department: string;
  check_in?: string;
  check_out?: string;
  hours_worked?: number;
  late_minutes?: number;
  status: string;
  status_code: string;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  present:  { color: "text-emerald-700", bg: "bg-emerald-500/10" },
  late:     { color: "text-amber-700",   bg: "bg-amber-500/10" },
  absent:   { color: "text-red-700",     bg: "bg-red-500/10" },
  leave:    { color: "text-blue-700",    bg: "bg-blue-500/10" },
  weekend:  { color: "text-slate-600",   bg: "bg-slate-100" },
  mission:  { color: "text-purple-700",  bg: "bg-purple-500/10" },
};

export default function ManagerAttendancePage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);

  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [records, setRecords] = useState<AttRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  const loadData = () => {
    if (!token) return;
    setLoading(true);
    fetch(`/api/manager/team-attendance?date=${date}`, {
      headers: { Authorization: authHeader },
    })
      .then(r => r.json())
      .then(data => {
        setRecords(Array.isArray(data?.records) ? data.records : (Array.isArray(data) ? data : []));
      })
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [date]);

  const changeDate = (delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().split("T")[0]);
  };

  const today = new Date().toISOString().split("T")[0];

  const stats = {
    present: records.filter(r => r.status_code === "present").length,
    late:    records.filter(r => r.status_code === "late").length,
    absent:  records.filter(r => r.status_code === "absent").length,
    leave:   records.filter(r => r.status_code === "leave").length,
  };

  const filtered = records.filter(r => {
    if (filterStatus !== "all" && r.status_code !== filterStatus) return false;
    if (search && !r.employee_name.toLowerCase().includes(search.toLowerCase()) &&
        !r.employee_code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const fmt = (t?: string) => {
    if (!t) return "—";
    return new Date(`2000-01-01T${t}`).toLocaleTimeString(
      lang === "ar" ? "ar-EG" : "en-US",
      { hour: "2-digit", minute: "2-digit" }
    );
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {lang === "ar" ? "حضور الفريق" : "Team Attendance"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {lang === "ar" ? "تابع حضور وانصراف فريقك" : "Track your team attendance"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          {lang === "ar" ? "تحديث" : "Refresh"}
        </Button>
      </div>

      {/* Date Navigator */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => changeDate(-1)}>
              <ChevronRight className="w-5 h-5" />
            </Button>
            <div className="text-center">
              <p className="font-semibold">{fmtDate(date)}</p>
              {date === today && (
                <Badge className="bg-emerald-500/10 text-emerald-700 border-0 text-xs mt-1">
                  {lang === "ar" ? "اليوم" : "Today"}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost" size="icon"
              onClick={() => changeDate(1)}
              disabled={date >= today}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { key: "present", label: lang === "ar" ? "حاضر" : "Present", icon: UserCheck, color: "emerald" },
          { key: "late",    label: lang === "ar" ? "متأخر" : "Late",    icon: Clock,     color: "amber" },
          { key: "absent",  label: lang === "ar" ? "غائب" : "Absent",   icon: UserX,     color: "red" },
          { key: "leave",   label: lang === "ar" ? "إجازة" : "Leave",   icon: Calendar,  color: "blue" },
        ].map(s => (
          <Card
            key={s.key}
            className={`border-2 cursor-pointer transition ${filterStatus === s.key ? `border-${s.color}-500` : "border-border"}`}
            onClick={() => setFilterStatus(filterStatus === s.key ? "all" : s.key)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <s.icon className={`w-4 h-4 text-${s.color}-600`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className={`text-2xl font-bold text-${s.color}-700 mt-1`}>
                {stats[s.key as keyof typeof stats]}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={d.searchEmployees}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-24 text-center">
            <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">{lang === "ar" ? "لا توجد سجلات" : "No records"}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-right p-4 text-sm font-semibold text-muted-foreground">
                      {lang === "ar" ? "الموظف" : "Employee"}
                    </th>
                    <th className="text-right p-4 text-sm font-semibold text-muted-foreground">
                      {lang === "ar" ? "القسم" : "Dept"}
                    </th>
                    <th className="text-center p-4 text-sm font-semibold text-muted-foreground">
                      {lang === "ar" ? "حضور" : "Check In"}
                    </th>
                    <th className="text-center p-4 text-sm font-semibold text-muted-foreground">
                      {lang === "ar" ? "انصراف" : "Check Out"}
                    </th>
                    <th className="text-center p-4 text-sm font-semibold text-muted-foreground">
                      {lang === "ar" ? "تأخير" : "Late"}
                    </th>
                    <th className="text-center p-4 text-sm font-semibold text-muted-foreground">
                      {lang === "ar" ? "الحالة" : "Status"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => {
                    const sc = STATUS_CONFIG[r.status_code] || STATUS_CONFIG.absent;
                    return (
                      <tr key={r.employee_id} className={`border-b ${i % 2 === 0 ? "" : "bg-muted/20"} hover:bg-muted/40 transition`}>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-9 h-9">
                              <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-sm">
                                {r.employee_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{r.employee_name}</p>
                              <p className="text-xs text-muted-foreground">{r.employee_code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">{r.department}</td>
                        <td className="p-4 text-center font-mono text-sm">{fmt(r.check_in)}</td>
                        <td className="p-4 text-center font-mono text-sm">{fmt(r.check_out)}</td>
                        <td className="p-4 text-center">
                          {r.late_minutes ? (
                            <span className="text-sm text-amber-700 font-semibold">{r.late_minutes} د</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <Badge className={`${sc.bg} ${sc.color} border-0 text-xs`}>
                            {r.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

