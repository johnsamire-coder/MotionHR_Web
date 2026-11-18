"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Download, Loader2, Printer, Search, FileText, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Emp {
  id: number; employee_code?: string; full_name?: string; first_name_ar?: string; last_name_ar?: string;
  department?: string; department_id?: number | null; branch?: string; branch_id?: number | null;
}
interface Day {
  date: string; weekday: string; shift: string; check_in: string | null; check_out: string | null; work_hours: number;
  status: string; status_ar: string; late_minutes: number; late_deducted_minutes: number; late_amount: number;
  early_minutes: number; early_deducted_minutes: number; early_amount: number; overtime_hours: number;
  overtime_counted_hours: number; overtime_multiplier: number; overtime_amount: number; absence_amount: number;
  missing_checkout_amount: number; notes: string;
}
interface Statement {
  employee: { id: number; code: string; name: string; job: string; basic_salary: number; department?: string; branch?: string };
  date_from: string; date_to: string;
  months: { year: number; month: number; days: number; daily_salary: number; hourly_rate: number }[];
  days: Day[];
  totals: Record<string, number>;
  summary: Record<string, number>;
}
interface Result { date_from: string; date_to: string; statements: Statement[]; grand: Record<string, number> }

type Mode = "employees" | "department" | "branch";

const norm = (x: string) => (x || "").toLowerCase().replace(/[ى]/g, "ي").replace(/[ة]/g, "ه").replace(/[أإآ]/g, "ا").trim();
const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1, 12).toISOString().slice(0, 10); };
const m = (v: number) => (v ? v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—");
const n = (v: number) => (v ? String(v) : "—");

function DaysTable({ st, t }: { st: Statement; t: (a: string, e: string) => string }) {
  return (
    <div className="overflow-x-auto">
      <Table className="text-xs">
        <TableHeader><TableRow>
          {[t("التاريخ", "Date"), t("اليوم", "Day"), t("الشيفت", "Shift"), t("الحضور", "In"), t("الانصراف", "Out"), t("ساعات", "Hours"), t("الحالة", "Status"),
            t("تأخير د", "Late m"), t("مخصوم د", "Ded. m"), t("خصم التأخير", "Late amt"), t("مبكر د", "Early m"), t("مخصوم د", "Ded. m"), t("خصم المبكر", "Early amt"),
            t("أوفر فعلي س", "OT h"), t("أوفر محسوب س", "OT counted"), t("قيمة الأوفر", "OT amt"), t("خصم الغياب", "Absence"), t("ملاحظات", "Notes")]
            .map((h, i) => <TableHead key={i} className="whitespace-nowrap">{h}</TableHead>)}
        </TableRow></TableHeader>
        <TableBody>
          {st.days.map(d => (
            <TableRow key={d.date} className={d.status === "absent" ? "bg-rose-50" : ""}>
              <TableCell className="whitespace-nowrap">{d.date}</TableCell><TableCell>{d.weekday}</TableCell><TableCell className="whitespace-nowrap">{d.shift}</TableCell>
              <TableCell>{d.check_in || "—"}</TableCell><TableCell>{d.check_out || "—"}</TableCell><TableCell>{n(d.work_hours)}</TableCell><TableCell>{d.status_ar}</TableCell>
              <TableCell>{n(d.late_minutes)}</TableCell><TableCell>{n(d.late_deducted_minutes)}</TableCell><TableCell>{m(d.late_amount)}</TableCell>
              <TableCell>{n(d.early_minutes)}</TableCell><TableCell>{n(d.early_deducted_minutes)}</TableCell><TableCell>{m(d.early_amount)}</TableCell>
              <TableCell>{n(d.overtime_hours)}</TableCell><TableCell>{n(d.overtime_counted_hours)}</TableCell><TableCell>{m(d.overtime_amount)}</TableCell>
              <TableCell>{m(d.absence_amount)}</TableCell><TableCell className="min-w-[260px] text-start">{d.notes}</TableCell>
            </TableRow>))}
          <TableRow className="bg-emerald-50 font-bold">
            <TableCell colSpan={5}>{t("الإجمالي", "Total")}</TableCell><TableCell>{n(st.totals.work_hours)}</TableCell><TableCell />
            <TableCell>{n(st.totals.late_minutes)}</TableCell><TableCell>{n(st.totals.late_deducted_minutes)}</TableCell><TableCell>{m(st.totals.late_amount)}</TableCell>
            <TableCell>{n(st.totals.early_minutes)}</TableCell><TableCell>{n(st.totals.early_deducted_minutes)}</TableCell><TableCell>{m(st.totals.early_amount)}</TableCell>
            <TableCell>{n(st.totals.overtime_hours)}</TableCell><TableCell>{n(st.totals.overtime_counted_hours)}</TableCell><TableCell>{m(st.totals.overtime_amount)}</TableCell>
            <TableCell>{m(st.totals.absence_amount)}</TableCell><TableCell />
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

export default function PeriodStatementPage() {
  const router = useRouter();
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";
  const t = (a: string, e: string) => (ar ? a : e);
  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const auth = token?.startsWith("Token") ? token : `Token ${token}`;

  const [emps, setEmps] = useState<Emp[]>([]);
  const [mode, setMode] = useState<Mode>("employees");
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<number[]>([]);
  const [group, setGroup] = useState<number | null>(null);
  const [excluded, setExcluded] = useState<number[]>([]);
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [data, setData] = useState<Result | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch("/api/employees/list?include_self=1", { headers: { Authorization: auth } })
      .then(r => r.json()).then(d => setEmps(d.results || d.employees || [])).catch(() => {});
  }, [token, auth]);

  const name = (e: Emp) => e.full_name || `${e.first_name_ar || ""} ${e.last_name_ar || ""}`.trim();
  const groups = useMemo(() => {
    const map = new Map<number, string>();
    emps.forEach(e => {
      const id = mode === "department" ? e.department_id : e.branch_id;
      const nm = mode === "department" ? e.department : e.branch;
      if (id) map.set(id, nm || `#${id}`);
    });
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "ar"));
  }, [emps, mode]);
  const inGroup = useMemo(() => emps.filter(e => group && (mode === "department" ? e.department_id === group : e.branch_id === group)), [emps, group, mode]);
  const pool = mode === "employees" ? emps : inGroup;
  const list = useMemo(() => pool.filter(e => !q || norm(name(e)).includes(norm(q)) || norm(e.employee_code || "").includes(norm(q))), [pool, q]);

  const toggle = (arr: number[], set: (v: number[]) => void, id: number) => set(arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);
  const switchMode = (md: Mode) => { setMode(md); setGroup(null); setExcluded([]); setQ(""); };

  const qs = () => {
    const base = `date_from=${from}&date_to=${to}`;
    if (mode === "employees") return `${base}&employee_ids=${picked.join(",")}`;
    const key = mode === "department" ? "department_id" : "branch_id";
    return `${base}&${key}=${group}${excluded.length ? `&exclude_ids=${excluded.join(",")}` : ""}`;
  };
  const ready = mode === "employees" ? picked.length > 0 : !!group;

  const load = async () => {
    if (!ready) { toast.error(t("اختار الموظفين أو القسم أو الفرع", "Choose who")); return; }
    setLoading(true);
    try {
      const r = await fetch(`/api/reports/period-statement?${qs()}`, { headers: { Authorization: auth } });
      const d = await r.json();
      if (!r.ok || d.success === false) { toast.error(d.error || t("حصل خطأ", "Error")); setData(null); }
      else { setData({ date_from: d.date_from, date_to: d.date_to, statements: d.statements || [d], grand: d.grand || {} }); setOpen(null); }
    } catch { toast.error(t("حصل خطأ", "Error")); }
    setLoading(false);
  };

  const excel = async () => {
    const r = await fetch(`/api/reports/period-statement/excel?${qs()}`, { headers: { Authorization: auth } });
    if (!r.ok) { toast.error(t("فشل التصدير", "Export failed")); return; }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(await r.blob());
    a.download = `statement_${from}_${to}.xlsx`;
    a.click();
  };

  const print = () => {
    if (!data) return;
    const many = data.statements.length > 1;
    const sumRow = (st: Statement) => { const s = st.summary;
      return `<tr><td>${st.employee.code}</td><td>${st.employee.name}</td><td>${st.employee.department || ""}</td><td>${m(s.pay_for_days)}</td><td>${m(s.overtime)}</td><td>${m(s.late)}</td><td>${m(s.early_leave)}</td><td>${m(s.absence)}</td><td>${m(s.missing_checkout)}</td><td><b>${m(s.net)}</b></td></tr>`; };
    const g = data.grand;
    const summary = many ? `<h3>الملخص — ${data.statements.length} موظف</h3><table><tr><th>الكود</th><th>الموظف</th><th>القسم</th><th>أجر الأيام</th><th>+ أوفر تايم</th><th>− تأخير</th><th>− مبكر</th><th>− غياب</th><th>− نسيان انصراف</th><th>الصافي</th></tr>${data.statements.map(sumRow).join("")}
      <tr class="tot"><td></td><td>الإجمالي</td><td></td><td>${m(g.pay_for_days)}</td><td>${m(g.overtime)}</td><td>${m(g.late)}</td><td>${m(g.early_leave)}</td><td>${m(g.absence)}</td><td>${m(g.missing_checkout)}</td><td>${m(g.net)}</td></tr></table>` : "";
    const one = (st: Statement) => {
      const s = st.summary;
      const rows = st.days.map(d => `<tr class="${d.status === "absent" ? "abs" : ""}"><td>${d.date}</td><td>${d.weekday}</td><td>${d.check_in || "—"}</td><td>${d.check_out || "—"}</td><td>${n(d.work_hours)}</td><td>${d.status_ar}</td><td>${n(d.late_minutes)}</td><td>${n(d.late_deducted_minutes)}</td><td>${m(d.late_amount)}</td><td>${n(d.early_minutes)}</td><td>${n(d.early_deducted_minutes)}</td><td>${m(d.early_amount)}</td><td>${n(d.overtime_counted_hours)}</td><td>${m(d.overtime_amount)}</td><td>${m(d.absence_amount)}</td><td class="nt">${d.notes}</td></tr>`).join("");
      const rates = st.months.map(x => `${x.month}/${x.year}: أجر اليوم ${x.daily_salary} • أجر الساعة ${x.hourly_rate}`).join(" — ");
      return `<div class="emp"><h2>${st.employee.code} ${st.employee.name}</h2><div>${st.employee.job} • من ${st.date_from} إلى ${st.date_to} • الراتب الأساسي ${st.employee.basic_salary.toLocaleString()} • ${rates}</div>
        <table><tr><th>التاريخ</th><th>اليوم</th><th>الحضور</th><th>الانصراف</th><th>ساعات</th><th>الحالة</th><th>تأخير د</th><th>مخصوم د</th><th>خصم التأخير</th><th>مبكر د</th><th>مخصوم د</th><th>خصم المبكر</th><th>أوفر محسوب س</th><th>قيمة الأوفر</th><th>خصم الغياب</th><th>ملاحظات</th></tr>${rows}</table>
        <table class="sum"><tr><td>أجر الأيام (${s.calendar_days} يوم)</td><td>${m(s.pay_for_days)}</td></tr><tr><td>+ الأوفر تايم</td><td>${m(s.overtime)}</td></tr><tr><td>− خصم التأخير</td><td>${m(s.late)}</td></tr>
        <tr><td>− خصم الانصراف المبكر</td><td>${m(s.early_leave)}</td></tr><tr><td>− خصم الغياب</td><td>${m(s.absence)}</td></tr><tr><td>− خصم نسيان الانصراف</td><td>${m(s.missing_checkout)}</td></tr><tr class="tot"><td>الصافي المستحق</td><td>${m(s.net)}</td></tr></table></div>`;
    };
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>كشف حضور ومستحقات</title><style>
      @page{size:A4 landscape;margin:8mm} body{font-family:Arial,sans-serif;font-size:10px;color:#1a1438}
      h2,h3{margin:0;color:#1a0b4a} table{border-collapse:collapse;width:100%;margin-top:6px} th{background:#1a0b4a;color:#fff;padding:3px;font-size:9px}
      td{border:1px solid #ccc;padding:2px 3px;text-align:center} td.nt{text-align:right;font-size:8.5px} tr.abs td{background:#fff1f2}
      .sum{width:45%} .sum td{font-size:11px} tr.tot td{font-weight:bold;background:#ddf7ec} .emp{page-break-before:always} .emp:first-child{page-break-before:auto}</style></head><body>
      <h2>كشف حضور ومستحقات — من ${data.date_from} إلى ${data.date_to}</h2>${summary}${data.statements.map(one).join("")}
      <p>الأجر بالأيام التقويمية (الراتب ÷ أيام الشهر). البدلات والحوافز والتأمينات والسلف غير محسوبة هنا.</p>
      <script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  };

  const tab = (md: Mode, label: string) => (
    <button onClick={() => switchMode(md)} className={`px-4 py-1.5 rounded-full text-sm border ${mode === md ? "bg-primary text-primary-foreground border-primary" : "bg-background"}`}>{label}</button>
  );
  const single = data && data.statements.length === 1 ? data.statements[0] : null;

  return (
    <div className="space-y-5 p-1" dir={ar ? "rtl" : "ltr"}>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/hr/reports")}>{ar ? <ArrowRight /> : <ArrowLeft />}</Button>
        <div>
          <h1 className="text-2xl font-bold">{t("كشف حضور ومستحقات لفترة", "Period statement")}</h1>
          <p className="text-sm text-muted-foreground">{t("موظف أو أكتر، أو قسم، أو فرع (مع استثناء أشخاص)، من تاريخ لتاريخ، يوم بيوم بالخصومات والأوفر تايم والصافي", "Employees, a department or a branch, any date range")}</p>
        </div>
      </div>

      <Card><CardContent className="p-4 space-y-3">
        <div className="flex flex-wrap gap-2">{tab("employees", t("موظفين", "Employees"))}{tab("department", t("قسم", "Department"))}{tab("branch", t("فرع", "Branch"))}</div>
        <div className="grid gap-3 md:grid-cols-4 items-start">
          <div className="md:col-span-2 space-y-2">
            {mode !== "employees" && (
              <select className="w-full border rounded-md h-9 px-2 bg-background" value={group ?? ""} onChange={e => { setGroup(e.target.value ? Number(e.target.value) : null); setExcluded([]); }}>
                <option value="">{mode === "department" ? t("اختار القسم", "Choose department") : t("اختار الفرع", "Choose branch")}</option>
                {groups.map(([id, nm]) => <option key={id} value={id}>{nm}</option>)}
              </select>
            )}
            {(mode === "employees" || group) && (<>
              <label className="text-sm font-medium">{mode === "employees" ? t("اختار الموظفين", "Choose employees") : t(`ماعدا (اختياري) — ${inGroup.length - excluded.length} من ${inGroup.length} داخلين`, "Except (optional)")}</label>
              <div className="relative"><Search className="absolute top-2.5 start-2 w-4 h-4 text-muted-foreground" />
                <Input className="ps-8" value={q} onChange={e => setQ(e.target.value)} placeholder={t("ابحث بالاسم أو الكود", "Search name or code")} /></div>
              <div className="max-h-48 overflow-auto border rounded-md">
                {list.slice(0, 200).map(e => {
                  const on = mode === "employees" ? picked.includes(e.id) : excluded.includes(e.id);
                  return (
                    <label key={e.id} className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted cursor-pointer">
                      <input type="checkbox" checked={on} onChange={() => mode === "employees" ? toggle(picked, setPicked, e.id) : toggle(excluded, setExcluded, e.id)} />
                      <span className={mode !== "employees" && on ? "line-through text-muted-foreground" : ""}>{name(e)}</span>
                      <span className="text-xs text-muted-foreground">{e.employee_code}</span>
                    </label>);
                })}
              </div>
              {mode === "employees" && picked.length > 0 && (
                <div className="flex flex-wrap gap-1">{picked.map(id => { const e = emps.find(x => x.id === id); return e ? (
                  <span key={id} className="text-xs bg-primary/10 rounded-full px-2 py-0.5 flex items-center gap-1">{name(e)}<X className="w-3 h-3 cursor-pointer" onClick={() => toggle(picked, setPicked, id)} /></span>) : null; })}
                  <button className="text-xs underline" onClick={() => setPicked([])}>{t("مسح الكل", "Clear")}</button></div>)}
            </>)}
          </div>
          <div className="space-y-1"><label className="text-sm font-medium">{t("من", "From")}</label><Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
            <label className="text-sm font-medium">{t("إلى", "To")}</label><Input type="date" value={to} onChange={e => setTo(e.target.value)} /></div>
          <div className="flex flex-col gap-2">
            <Button onClick={load} disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} {t("اعرض الكشف", "Show")}</Button>
            <Button variant="outline" onClick={excel} disabled={!data}><Download className="w-4 h-4" /> Excel</Button>
            <Button variant="outline" onClick={print} disabled={!data}><Printer className="w-4 h-4" /> {t("طباعة / PDF", "Print / PDF")}</Button>
          </div>
        </div>
      </CardContent></Card>

      {single && (<>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          {[[t("أجر الأيام", "Pay"), single.summary.pay_for_days], [t("+ الأوفر تايم", "+ Overtime"), single.summary.overtime],
            [t("− التأخير", "− Late"), single.summary.late], [t("− الانصراف المبكر", "− Early"), single.summary.early_leave],
            [t("− الغياب", "− Absence"), single.summary.absence], [t("− نسيان الانصراف", "− Missing out"), single.summary.missing_checkout],
            [t("الصافي", "Net"), single.summary.net]].map(([l, v], i) => (
            <Card key={i} className={i === 6 ? "bg-emerald-50 border-emerald-300" : ""}><CardContent className="p-3">
              <p className="text-xs text-muted-foreground">{l}</p><p className="text-lg font-bold">{m(Number(v))}</p></CardContent></Card>))}
        </div>
        <p className="text-xs text-muted-foreground">
          {single.employee.code} {single.employee.name} • {single.months.map(x => `${x.month}/${x.year}: ${t("أجر اليوم", "day")} ${x.daily_salary} • ${t("أجر الساعة", "hour")} ${x.hourly_rate}`).join(" — ")}
        </p>
        <Card><CardContent className="p-0"><DaysTable st={single} t={t} /></CardContent></Card>
      </>)}

      {data && !single && (
        <Card><CardContent className="p-0 overflow-x-auto">
          <Table className="text-sm">
            <TableHeader><TableRow>
              {[t("الكود", "Code"), t("الموظف", "Employee"), t("القسم", "Dept"), t("حضور", "Present"), t("تأخير", "Late"), t("غياب", "Absent"),
                t("أجر الأيام", "Pay"), t("+ أوفر تايم", "+ OT"), t("− تأخير", "− Late"), t("− مبكر", "− Early"), t("− غياب", "− Absence"), t("− نسيان انصراف", "− Missing"), t("الصافي", "Net"), ""]
                .map((h, i) => <TableHead key={i} className="whitespace-nowrap">{h}</TableHead>)}
            </TableRow></TableHeader>
            <TableBody>
              {data.statements.map(st => (
                <React.Fragment key={st.employee.id}>
                  <TableRow>
                    <TableCell>{st.employee.code}</TableCell><TableCell className="whitespace-nowrap font-medium">{st.employee.name}</TableCell><TableCell>{st.employee.department}</TableCell>
                    <TableCell>{st.summary.present_days}</TableCell><TableCell>{st.summary.late_days}</TableCell><TableCell>{st.summary.absent_days}</TableCell>
                    <TableCell>{m(st.summary.pay_for_days)}</TableCell><TableCell>{m(st.summary.overtime)}</TableCell><TableCell>{m(st.summary.late)}</TableCell>
                    <TableCell>{m(st.summary.early_leave)}</TableCell><TableCell>{m(st.summary.absence)}</TableCell><TableCell>{m(st.summary.missing_checkout)}</TableCell>
                    <TableCell className="font-bold">{m(st.summary.net)}</TableCell>
                    <TableCell><Button variant="ghost" size="sm" onClick={() => setOpen(open === st.employee.id ? null : st.employee.id)}>
                      {t("الأيام", "Days")} {open === st.employee.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</Button></TableCell>
                  </TableRow>
                  {open === st.employee.id && <TableRow><TableCell colSpan={14} className="p-0 bg-muted/30"><DaysTable st={st} t={t} /></TableCell></TableRow>}
                </React.Fragment>))}
              <TableRow className="bg-emerald-50 font-bold">
                <TableCell colSpan={6}>{t("الإجمالي", "Total")} — {data.grand.employees} {t("موظف", "employees")}</TableCell>
                <TableCell>{m(data.grand.pay_for_days)}</TableCell><TableCell>{m(data.grand.overtime)}</TableCell><TableCell>{m(data.grand.late)}</TableCell>
                <TableCell>{m(data.grand.early_leave)}</TableCell><TableCell>{m(data.grand.absence)}</TableCell><TableCell>{m(data.grand.missing_checkout)}</TableCell>
                <TableCell>{m(data.grand.net)}</TableCell><TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent></Card>
      )}
      {data && <p className="text-xs text-muted-foreground">{t("الأجر بالأيام التقويمية (الراتب ÷ أيام الشهر). البدلات والحوافز والتأمينات والسلف غير محسوبة هنا.", "Pay by calendar days. Allowances, bonuses, insurance and advances are not included.")}</p>}
    </div>
  );
}
