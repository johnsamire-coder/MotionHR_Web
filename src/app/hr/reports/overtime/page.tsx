"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, Calendar, Clock, Users, Wallet,
  Search, Loader2, Download, ChevronDown, ChevronUp, Ban,
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
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface OvertimeDay {
  date: string;
  shift: string;
  check_in: string | null;
  check_out: string | null;
  overtime_hours: number;
  counted_hours: number;
}

interface OvertimeEmployee {
  employee_id: number;
  employee_name: string;
  employee_code?: string;
  eligible: boolean;
  overtime_days: number;
  overtime_hours: number;
  counted_hours: number;
  multiplier: number | null;
  paid_hours: number;
  amount: number;
  details: OvertimeDay[];
}

interface OvertimeData {
  year: number;
  month: number;
  total_employees: number;
  totals: { overtime_hours: number; counted_hours: number; paid_hours: number; amount: number };
  employees: OvertimeEmployee[];
}

function StatCard({
  icon: Icon, label, value, subtitle, color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtitle?: string;
  color: string;
}) {
  return (
    <Card className="border-border/50 hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OvertimeReportPage() {
  const router = useRouter();
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";
  const t = (a: string, e: string) => (ar ? a : e);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<OvertimeData | null>(null);
  const [loadedKey, setLoadedKey] = useState("");
  const [search, setSearch] = useState("");
  const [show, setShow] = useState("all");
  const [expandedEmp, setExpandedEmp] = useState<number | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  const key = `${year}-${month}`;
  const loading = loadedKey !== key;

  useEffect(() => {
    if (!token) return;
    fetch(`/api/reports/overtime?year=${year}&month=${month}`, { headers: { Authorization: authHeader } })
      .then(r => r.json())
      .then(setData)
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoadedKey(`${year}-${month}`));
  }, [year, month, token, authHeader, d.failedLoad]);

  const monthNames = [
    d.January, d.February, d.March, d.April, d.May, d.June,
    d.July, d.August, d.September, d.October, d.November, d.December,
  ];
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const employees = data?.employees || [];
  const filtered = employees.filter(emp => {
    const q = search.toLowerCase();
    const matchSearch = !q || emp.employee_name.toLowerCase().includes(q) || (emp.employee_code || "").toLowerCase().includes(q);
    const matchShow = show === "all" || (show === "eligible" ? emp.eligible : !emp.eligible);
    return matchSearch && matchShow;
  });

  const money = (v: number) => v.toLocaleString(ar ? "ar-EG" : "en-US", { maximumFractionDigits: 2 });
  const hours = (v: number) => {
    const h = Math.floor(v);
    const m = Math.round((v - h) * 60);
    return ar ? `${h} س ${m} د` : `${h}h ${m}m`;
  };
  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString(ar ? "ar-EG" : "en-US", { weekday: "short", day: "numeric", month: "short" });

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/hr/reports-export/overtime/excel?year=${year}&month=${month}`, {
        headers: { Authorization: authHeader },
      });
      if (!res.ok) { toast.error(t("فشل التصدير", "Export failed")); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `overtime_${year}_${month}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("فشل التصدير", "Export failed"));
    }
  };

  const th = ar ? "text-right" : "text-left";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/hr/reports")} className="gap-2">
            {ar ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {d.backToReports}
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("تقرير الأوفر تايم", "Overtime Report")}</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("الساعات الإضافية لكل موظف ومبلغها في المرتب، يوم بيوم",
                 "Overtime hours per employee and what the payroll pays for them, day by day")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
            <Calendar className="w-4 h-4 text-muted-foreground mx-2" />
            <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
              <SelectTrigger className="border-0 bg-transparent w-[110px] focus:ring-0"><SelectValue /></SelectTrigger>
              <SelectContent>
                {months.map(m => <SelectItem key={m} value={String(m)}>{monthNames[m - 1]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
              <SelectTrigger className="border-0 bg-transparent w-[90px] focus:ring-0"><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" />
            {d.exportExcel}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Card key={i}><CardContent className="p-5"><div className="h-20 bg-muted animate-pulse rounded" /></CardContent></Card>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={Users} label={t("موظفين عندهم أوفر تايم", "Employees with overtime")}
            value={data?.total_employees || 0} color="bg-indigo-500/10 text-indigo-600" />
          <StatCard icon={Clock} label={t("الساعات المحسوبة", "Counted hours")}
            value={hours(data?.totals.counted_hours || 0)}
            subtitle={t(`الفعلية ${hours(data?.totals.overtime_hours || 0)} — المدفوعة ${hours(data?.totals.paid_hours || 0)}`,
                        `Actual ${hours(data?.totals.overtime_hours || 0)} — paid ${hours(data?.totals.paid_hours || 0)}`)}
            color="bg-amber-500/10 text-amber-600" />
          <StatCard icon={Wallet} label={t("إجمالي مبلغ الأوفر تايم", "Total overtime pay")}
            value={money(data?.totals.amount || 0)} subtitle={t("جنيه", "EGP")}
            color="bg-emerald-500/10 text-emerald-600" />
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder={d.searchEmployees} value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
            </div>
            <Select value={show} onValueChange={v => setShow(v ?? "all")}>
              <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("الكل", "All")}</SelectItem>
                <SelectItem value="eligible">{t("ليهم أوفر تايم", "Paid overtime")}</SelectItem>
                <SelectItem value="not">{t("مالهمش أوفر تايم", "No overtime pay")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="font-medium">{t("مفيش أوفر تايم في الشهر ده", "No overtime this month")}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={th}>{d.colEmployee}</TableHead>
                <TableHead className={th}>{t("الأيام", "Days")}</TableHead>
                <TableHead className={th}>{t("الفعلية", "Actual")}</TableHead>
                <TableHead className={th}>{t("المحسوبة", "Counted")}</TableHead>
                <TableHead className={th}>{t("المضاعف", "Multiplier")}</TableHead>
                <TableHead className={th}>{t("المدفوعة", "Paid")}</TableHead>
                <TableHead className={th}>{t("المبلغ", "Amount")}</TableHead>
                <TableHead className={th}></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(emp => {
                const open = expandedEmp === emp.employee_id;
                return (
                  <React.Fragment key={emp.employee_id}>
                    <TableRow className="hover:bg-muted/30">
                      <TableCell>
                        <div className="font-medium">{emp.employee_name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          {emp.employee_code}
                          {!emp.eligible && (
                            <Badge variant="outline" className="gap-1 text-[10px] bg-muted">
                              <Ban className="w-3 h-3" />{t("مالوش أوفر تايم", "No overtime pay")}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{emp.overtime_days}</TableCell>
                      <TableCell className="font-mono">{hours(emp.overtime_hours)}</TableCell>
                      <TableCell className="font-mono">{hours(emp.counted_hours)}</TableCell>
                      <TableCell className="font-mono">{emp.multiplier ? `× ${emp.multiplier}` : "—"}</TableCell>
                      <TableCell className="font-mono">{hours(emp.paid_hours)}</TableCell>
                      <TableCell className="font-mono font-semibold text-emerald-700">{money(emp.amount)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="gap-1 h-8"
                          onClick={() => setExpandedEmp(open ? null : emp.employee_id)}>
                          {t("الأيام", "Days")}
                          {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {open && (
                      <TableRow>
                        <TableCell colSpan={8} className="bg-muted/30 p-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className={th}>{t("اليوم", "Day")}</TableHead>
                                <TableHead className={th}>{t("الشيفت", "Shift")}</TableHead>
                                <TableHead className={th}>{t("الحضور", "In")}</TableHead>
                                <TableHead className={th}>{t("الانصراف", "Out")}</TableHead>
                                <TableHead className={th}>{t("الفعلية", "Actual")}</TableHead>
                                <TableHead className={th}>{t("المحسوبة", "Counted")}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {emp.details.map(day => (
                                <TableRow key={day.date}>
                                  <TableCell>{formatDate(day.date)}</TableCell>
                                  <TableCell>{day.shift || "—"}</TableCell>
                                  <TableCell dir="ltr" className="font-mono">{day.check_in || "—"}</TableCell>
                                  <TableCell dir="ltr" className="font-mono">{day.check_out || "—"}</TableCell>
                                  <TableCell className="font-mono">{hours(day.overtime_hours)}</TableCell>
                                  <TableCell className="font-mono">
                                    {day.counted_hours > 0 ? hours(day.counted_hours)
                                      : <span className="text-muted-foreground">{t("مايتحسبش", "Not counted")}</span>}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
