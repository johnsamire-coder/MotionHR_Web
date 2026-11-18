"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Download, Loader2, Printer, Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Emp { id: number; employee_code?: string; full_name?: string; first_name_ar?: string; last_name_ar?: string }
interface Day {
  date: string; weekday: string; shift: string; check_in: string | null; check_out: string | null; work_hours: number;
  status: string; status_ar: string; late_minutes: number; late_deducted_minutes: number; late_amount: number;
  early_minutes: number; early_deducted_minutes: number; early_amount: number; overtime_hours: number;
  overtime_counted_hours: number; overtime_multiplier: number; overtime_amount: number; absence_amount: number;
  missing_checkout_amount: number; notes: string;
}
interface Statement {
  employee: { id: number; code: string; name: string; job: string; basic_salary: number };
  date_from: string; date_to: string;
  months: { year: number; month: number; days: number; daily_salary: number; hourly_rate: number }[];
  days: Day[];
  totals: Record<string, number>;
  summary: Record<string, number>;
}

const norm = (x: string) => (x || "").toLowerCase().replace(/[ى]/g, "ي").replace(/[ة]/g, "ه").replace(/[أإآ]/g, "ا").trim();
const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1, 12).toISOString().slice(0, 10); };

export default function PeriodStatementPage() {
  const router = useRouter();
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";
  const t = (a: string, e: string) => (ar ? a : e);
  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const auth = token?.startsWith("Token") ? token : `Token ${token}`;

  const [emps, setEmps] = useState<Emp[]>([]);
  const [q, setQ] = useState("");
  const [empId, setEmpId] = useState<number | null>(null);
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [data, setData] = useState<Statement | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch("/api/employees/list?include_self=1", { headers: { Authorization: auth } })
      .then(r => r.json()).then(d => setEmps(d.results || d.employees || [])).catch(() => {});
  }, [token, auth]);

  const name = (e: Emp) => e.full_name || `${e.first_name_ar || ""} ${e.last_name_ar || ""}`.trim();
  const list = useMemo(() => emps.filter(e => !q || norm(name(e)).includes(norm(q)) || norm(e.employee_code || "").includes(norm(q))), [emps, q]);
  const qs = `employee_id=${empId}&date_from=${from}&date_to=${to}`;

  const load = async () => {
    if (!empId) { toast.error(t("اختار الموظف", "Choose the employee")); return; }
    setLoading(true);
    try {
      const r = await fetch(`/api/reports/period-statement?${qs}`, { headers: { Authorization: auth } });
      const d = await r.json();
      if (!r.ok || d.success === false) { toast.error(d.error || t("حصل خطأ", "Error")); setData(null); }
      else setData(d);
    } catch { toast.error(t("حصل خطأ", "Error")); }
    setLoading(false);
  };

  const excel = async () => {
    const r = await fetch(`/api/reports/period-statement/excel?${qs}`, { headers: { Authorization: auth } });
    if (!r.ok) { toast.error(t("فشل التصدير", "Export failed")); return; }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(await r.blob());
    a.download = `statement_${data?.employee.code || ""}_${from}_${to}.xlsx`;
    a.click();
  };

  const m = (v: number) => (v ? v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—");
  const n = (v: number) => (v ? String(v) : "—");

  const print = () => {
    if (!data) return;
    const s = data.summary;
    const rows = data.days.map(d => `<tr class="${d.status === "absent" ? "abs" : ""}"><td>${d.date}</td><td>${d.weekday}</td><td>${d.check_in || "—"}</td><td>${d.check_out || "—"}</td><td>${n(d.work_hours)}</td><td>${d.status_ar}</td><td>${n(d.late_minutes)}</td><td>${n(d.late_deducted_minutes)}</td><td>${m(d.late_amount)}</td><td>${n(d.early_minutes)}</td><td>${n(d.early_deducted_minutes)}</td><td>${m(d.early_amount)}</td><td>${n(d.overtime_counted_hours)}</td><td>${m(d.overtime_amount)}</td><td>${m(d.absence_amount)}</td><td class="nt">${d.notes}</td></tr>`).join("");
    const rates = data.months.map(x => `${x.month}/${x.year}: أجر اليوم ${x.daily_salary} • أجر الساعة ${x.hourly_rate}`).join(" — ");
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>كشف ${data.employee.name}</title><style>
      @page{size:A4 landscape;margin:8mm} body{font-family:Arial,sans-serif;font-size:10px;color:#1a1438}
      h2{margin:0;color:#1a0b4a} table{border-collapse:collapse;width:100%;margin-top:6px} th{background:#1a0b4a;color:#fff;padding:3px;font-size:9px}
      td{border:1px solid #ccc;padding:2px 3px;text-align:center} td.nt{text-align:right;font-size:8.5px} tr.abs td{background:#fff1f2}
      .sum{width:45%} .sum td{font-size:11px} .sum tr:last-child td{font-weight:bold;background:#ddf7ec}</style></head><body>
      <h2>كشف حضور ومستحقات — ${data.employee.code} ${data.employee.name}</h2>
      <div>${data.employee.job} • من ${data.date_from} إلى ${data.date_to} • الراتب الأساسي ${data.employee.basic_salary.toLocaleString()} • ${rates}</div>
      <table><tr><th>التاريخ</th><th>اليوم</th><th>الحضور</th><th>الانصراف</th><th>ساعات</th><th>الحالة</th><th>تأخير د</th><th>مخصوم د</th><th>خصم التأخير</th><th>مبكر د</th><th>مخصوم د</th><th>خصم المبكر</th><th>أوفر محسوب س</th><th>قيمة الأوفر</th><th>خصم الغياب</th><th>ملاحظات</th></tr>${rows}</table>
      <table class="sum"><tr><td>عدد الأيام</td><td>${s.calendar_days}</td></tr><tr><td>أجر الأيام</td><td>${m(s.pay_for_days)}</td></tr><tr><td>+ الأوفر تايم</td><td>${m(s.overtime)}</td></tr>
      <tr><td>− خصم التأخير</td><td>${m(s.late)}</td></tr><tr><td>− خصم الانصراف المبكر</td><td>${m(s.early_leave)}</td></tr><tr><td>− خصم الغياب</td><td>${m(s.absence)}</td></tr>
      <tr><td>− خصم نسيان الانصراف</td><td>${m(s.missing_checkout)}</td></tr><tr><td>الصافي المستحق</td><td>${m(s.net)}</td></tr></table>
      <p>الأجر بالأيام التقويمية (الراتب ÷ أيام الشهر). البدلات والحوافز والتأمينات والسلف غير محسوبة هنا.</p>
      <script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  };

  return (
    <div className="space-y-5 p-1" dir={ar ? "rtl" : "ltr"}>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/hr/reports")}>{ar ? <ArrowRight /> : <ArrowLeft />}</Button>
        <div>
          <h1 className="text-2xl font-bold">{t("كشف حضور ومستحقات لفترة", "Period statement")}</h1>
          <p className="text-sm text-muted-foreground">{t("موظف واحد، من تاريخ لتاريخ، يوم بيوم: التأخير والانصراف المبكر والأوفر تايم والغياب والصافي", "One employee, any date range, day by day")}</p>
        </div>
      </div>

      <Card><CardContent className="p-4 grid gap-3 md:grid-cols-4 items-end">
        <div className="md:col-span-2 space-y-1">
          <label className="text-sm font-medium">{t("الموظف", "Employee")}</label>
          <div className="relative"><Search className="absolute top-2.5 start-2 w-4 h-4 text-muted-foreground" />
            <Input className="ps-8" value={q} onChange={e => setQ(e.target.value)} placeholder={t("ابحث بالاسم أو الكود", "Search name or code")} /></div>
          <div className="max-h-40 overflow-auto border rounded-md">
            {list.slice(0, 50).map(e => (
              <button key={e.id} onClick={() => { setEmpId(e.id); setQ(name(e)); }}
                className={`w-full text-start px-3 py-1.5 text-sm hover:bg-muted ${empId === e.id ? "bg-primary/10 font-semibold" : ""}`}>
                {name(e)} <span className="text-xs text-muted-foreground">{e.employee_code}</span>
              </button>))}
          </div>
        </div>
        <div className="space-y-1"><label className="text-sm font-medium">{t("من", "From")}</label><Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
          <label className="text-sm font-medium">{t("إلى", "To")}</label><Input type="date" value={to} onChange={e => setTo(e.target.value)} /></div>
        <div className="flex flex-col gap-2">
          <Button onClick={load} disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} {t("اعرض الكشف", "Show")}</Button>
          <Button variant="outline" onClick={excel} disabled={!data}><Download className="w-4 h-4" /> Excel</Button>
          <Button variant="outline" onClick={print} disabled={!data}><Printer className="w-4 h-4" /> {t("طباعة / PDF", "Print / PDF")}</Button>
        </div>
      </CardContent></Card>

      {data && (<>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          {[[t("أجر الأيام", "Pay"), data.summary.pay_for_days], [t("+ الأوفر تايم", "+ Overtime"), data.summary.overtime],
            [t("− التأخير", "− Late"), data.summary.late], [t("− الانصراف المبكر", "− Early"), data.summary.early_leave],
            [t("− الغياب", "− Absence"), data.summary.absence], [t("− نسيان الانصراف", "− Missing out"), data.summary.missing_checkout],
            [t("الصافي", "Net"), data.summary.net]].map(([l, v], i) => (
            <Card key={i} className={i === 6 ? "bg-emerald-50 border-emerald-300" : ""}><CardContent className="p-3">
              <p className="text-xs text-muted-foreground">{l}</p><p className="text-lg font-bold">{m(Number(v))}</p></CardContent></Card>))}
        </div>
        <p className="text-xs text-muted-foreground">
          {data.months.map(x => `${x.month}/${x.year}: ${t("أجر اليوم", "day")} ${x.daily_salary} • ${t("أجر الساعة", "hour")} ${x.hourly_rate}`).join(" — ")}
          {" • "}{t("عدد الأيام", "Days")} {data.summary.calendar_days} • {t("حاضر", "present")} {data.summary.present_days} • {t("متأخر", "late")} {data.summary.late_days} • {t("غائب", "absent")} {data.summary.absent_days}
        </p>
        <Card><CardContent className="p-0 overflow-x-auto">
          <Table className="text-xs">
            <TableHeader><TableRow>
              {[t("التاريخ", "Date"), t("اليوم", "Day"), t("الشيفت", "Shift"), t("الحضور", "In"), t("الانصراف", "Out"), t("ساعات", "Hours"), t("الحالة", "Status"),
                t("تأخير د", "Late m"), t("مخصوم د", "Ded. m"), t("خصم التأخير", "Late amt"), t("مبكر د", "Early m"), t("مخصوم د", "Ded. m"), t("خصم المبكر", "Early amt"),
                t("أوفر فعلي س", "OT h"), t("أوفر محسوب س", "OT counted"), t("قيمة الأوفر", "OT amt"), t("خصم الغياب", "Absence"), t("ملاحظات", "Notes")]
                .map((h, i) => <TableHead key={i} className="whitespace-nowrap">{h}</TableHead>)}
            </TableRow></TableHeader>
            <TableBody>
              {data.days.map(d => (
                <TableRow key={d.date} className={d.status === "absent" ? "bg-rose-50" : ""}>
                  <TableCell className="whitespace-nowrap">{d.date}</TableCell><TableCell>{d.weekday}</TableCell><TableCell className="whitespace-nowrap">{d.shift}</TableCell>
                  <TableCell>{d.check_in || "—"}</TableCell><TableCell>{d.check_out || "—"}</TableCell><TableCell>{n(d.work_hours)}</TableCell><TableCell>{d.status_ar}</TableCell>
                  <TableCell>{n(d.late_minutes)}</TableCell><TableCell>{n(d.late_deducted_minutes)}</TableCell><TableCell>{m(d.late_amount)}</TableCell>
                  <TableCell>{n(d.early_minutes)}</TableCell><TableCell>{n(d.early_deducted_minutes)}</TableCell><TableCell>{m(d.early_amount)}</TableCell>
                  <TableCell>{n(d.overtime_hours)}</TableCell><TableCell>{n(d.overtime_counted_hours)}</TableCell><TableCell>{m(d.overtime_amount)}</TableCell>
                  <TableCell>{m(d.absence_amount)}</TableCell><TableCell className="min-w-[260px] text-start">{d.notes}</TableCell>
                </TableRow>))}
              <TableRow className="bg-emerald-50 font-bold">
                <TableCell colSpan={5}>{t("الإجمالي", "Total")}</TableCell><TableCell>{n(data.totals.work_hours)}</TableCell><TableCell />
                <TableCell>{n(data.totals.late_minutes)}</TableCell><TableCell>{n(data.totals.late_deducted_minutes)}</TableCell><TableCell>{m(data.totals.late_amount)}</TableCell>
                <TableCell>{n(data.totals.early_minutes)}</TableCell><TableCell>{n(data.totals.early_deducted_minutes)}</TableCell><TableCell>{m(data.totals.early_amount)}</TableCell>
                <TableCell>{n(data.totals.overtime_hours)}</TableCell><TableCell>{n(data.totals.overtime_counted_hours)}</TableCell><TableCell>{m(data.totals.overtime_amount)}</TableCell>
                <TableCell>{m(data.totals.absence_amount)}</TableCell><TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent></Card>
        <p className="text-xs text-muted-foreground">{t("الأجر بالأيام التقويمية (الراتب ÷ أيام الشهر). البدلات والحوافز والتأمينات والسلف غير محسوبة هنا.", "Pay by calendar days. Allowances, bonuses, insurance and advances are not included.")}</p>
      </>)}
    </div>
  );
}
