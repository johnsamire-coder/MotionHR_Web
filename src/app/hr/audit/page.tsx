"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Download, History, Loader2, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";
import { todayCairo } from "@/lib/utils";

interface Change { field: string; label: string; old: string; new: string }
interface LogRow {
  id: number | string;
  date: string;
  time: string;
  user_name: string;
  username: string;
  user_role: string;
  action: string;
  action_display: string;
  model_label: string;
  object_repr: string;
  employee_id: number | null;
  employee_name: string;
  changes: Change[];
  note: string;
  source_display: string;
  legacy?: boolean;
}

const ACTION_CLS: Record<string, string> = {
  create: "bg-emerald-500/10 text-emerald-700",
  update: "bg-sky-500/10 text-sky-700",
  delete: "bg-red-500/10 text-red-700",
  login: "bg-slate-500/10 text-slate-600",
  action: "bg-amber-500/10 text-amber-700",
};

function authH() {
  const t = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) || "" : "";
  return t.startsWith("Token ") || t.startsWith("Bearer ") ? t : `Token ${t}`;
}

async function downloadFile(url: string, name: string, ar: boolean) {
  try {
    const res = await fetch(url, { headers: { Authorization: authH() } });
    if (!res.ok) throw new Error();
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch {
    toast.error(ar ? "فشل التصدير" : "Export failed");
  }
}

function LogList({ rows, ar, showEmployee }: { rows: LogRow[]; ar: boolean; showEmployee: boolean }) {
  if (rows.length === 0) {
    return <div className="py-12 text-center text-muted-foreground">{ar ? "مفيش تعديلات في الفترة دي" : "No changes in this period"}</div>;
  }
  return (
    <div className="divide-y">
      {rows.map(r => (
        <div key={r.id} className="p-4 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge className={`${ACTION_CLS[r.action] || ACTION_CLS.action} border-0`}>{r.action_display}</Badge>
            <span className="font-semibold">{r.model_label}</span>
            {r.object_repr && <span className="text-muted-foreground">— {r.object_repr}</span>}
            {showEmployee && r.employee_name && (
              <span className="text-muted-foreground">{ar ? "· الموظف: " : "· Employee: "}<span className="text-foreground">{r.employee_name}</span></span>
            )}
          </div>
          <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
            <span>🗓 {r.date} {r.time}</span>
            <span>👤 {r.user_name || (ar ? "غير معروف" : "Unknown")}{r.username ? ` (${r.username})` : ""}</span>
            {r.source_display && <span>📍 {r.source_display}</span>}
          </div>
          {r.changes.length > 0 && (
            <div className="overflow-x-auto">
              <table className="text-sm w-full">
                <thead>
                  <tr className="text-xs text-muted-foreground">
                    <th className="text-start font-normal py-1 pe-4">{ar ? "الحقل" : "Field"}</th>
                    <th className="text-start font-normal py-1 pe-4">{ar ? "قبل" : "Before"}</th>
                    <th className="text-start font-normal py-1">{ar ? "بعد" : "After"}</th>
                  </tr>
                </thead>
                <tbody>
                  {r.changes.slice(0, 30).map((c, i) => (
                    <tr key={i} className="align-top">
                      <td className="py-1 pe-4 whitespace-nowrap">{c.label || c.field}</td>
                      <td className="py-1 pe-4 text-red-600 line-through decoration-red-300 break-all">{c.old || "—"}</td>
                      <td className="py-1 text-emerald-700 break-all">{c.new || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {r.note && <div className="text-xs text-muted-foreground">{ar ? "ملاحظة: " : "Note: "}{r.note}</div>}
        </div>
      ))}
    </div>
  );
}

function AuditContent() {
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";
  const params = useSearchParams();
  const today = todayCairo();
  const [tab, setTab] = useState<"all" | "employee">(params.get("employee") ? "employee" : "all");

  // ── سجل البرنامج كله ──
  const [from, setFrom] = useState(() => {
    const d = new Date(today); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(today);
  const [q, setQ] = useState("");
  const [userId, setUserId] = useState("");
  const [action, setAction] = useState("");
  const [users, setUsers] = useState<{ user_id: number; username: string; user_name: string }[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [denied, setDenied] = useState<string | null>(null);

  const logsQuery = useCallback((extra: Record<string, string> = {}) => {
    const p = new URLSearchParams({ date_from: from, date_to: to, page: String(page), page_size: "100", ...extra });
    if (q.trim()) p.set("q", q.trim());
    if (userId) p.set("user_id", userId);
    if (action) p.set("action", action);
    return p.toString();
  }, [from, to, page, q, userId, action]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/audit/logs?${logsQuery()}`, { headers: { Authorization: authH() } });
      const data = await res.json();
      if (res.status === 403) { setDenied(data.message || (ar ? "سجل البرنامج لصاحب الشركة بس" : "Owner only")); setLogs([]); return; }
      if (!res.ok || data.success === false) throw new Error(data.message);
      setDenied(null);
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (e) {
      toast.error((e as Error).message || (ar ? "فشل تحميل السجل" : "Failed to load log"));
    } finally {
      setLoading(false);
    }
  }, [logsQuery, ar]);

  useEffect(() => { if (tab === "all") loadLogs(); }, [tab, loadLogs]);

  useEffect(() => {
    fetch("/api/audit/filters", { headers: { Authorization: authH() } })
      .then(r => r.json()).then(d => { if (d.success) setUsers(d.users || []); }).catch(() => {});
  }, []);

  // ── سجل موظف ──
  const [employees, setEmployees] = useState<{ id: number; full_name: string; employee_code?: string }[]>([]);
  const [empId, setEmpId] = useState(params.get("employee") || "");
  const [onlyProfile, setOnlyProfile] = useState(false);
  const [history, setHistory] = useState<LogRow[]>([]);
  const [empName, setEmpName] = useState("");
  const [empLoading, setEmpLoading] = useState(false);

  useEffect(() => {
    fetch("/api/employees/list?page_size=2000", { headers: { Authorization: authH() } })
      .then(r => r.json()).then(d => setEmployees(d.results || d.employees || [])).catch(() => {});
  }, []);

  const loadHistory = useCallback(async () => {
    if (!empId) { setHistory([]); return; }
    setEmpLoading(true);
    try {
      const p = new URLSearchParams();
      if (onlyProfile) p.set("only_profile", "1");
      const res = await fetch(`/api/audit/employee/${empId}?${p}`, { headers: { Authorization: authH() } });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message);
      setHistory(data.history || []);
      setEmpName(data.employee?.name || "");
    } catch (e) {
      toast.error((e as Error).message || (ar ? "فشل تحميل سجل الموظف" : "Failed to load"));
      setHistory([]);
    } finally {
      setEmpLoading(false);
    }
  }, [empId, onlyProfile, ar]);

  useEffect(() => { if (tab === "employee") loadHistory(); }, [tab, loadHistory]);

  const pages = Math.max(1, Math.ceil(total / 100));

  return (
    <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><History className="w-6 h-6" />{ar ? "سجل التعديلات" : "Change Log"}</h1>
        <p className="text-sm text-muted-foreground">
          {ar ? "مين عمل إيه وإمتى، وقبل وبعد كل تعديل" : "Who changed what and when, with before and after"}
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant={tab === "all" ? "default" : "outline"} onClick={() => setTab("all")} className="gap-2"><History className="w-4 h-4" />{ar ? "سجل البرنامج" : "Program log"}</Button>
        <Button variant={tab === "employee" ? "default" : "outline"} onClick={() => setTab("employee")} className="gap-2"><User className="w-4 h-4" />{ar ? "سجل موظف" : "Employee log"}</Button>
      </div>

      {tab === "all" && (
        denied ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">{denied}</CardContent></Card>
        ) : (
          <>
            <Card>
              <CardContent className="p-4 flex flex-wrap gap-3 items-end">
                <label className="text-sm"><span className="block mb-1 text-muted-foreground">{ar ? "من" : "From"}</span>
                  <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }} className="border rounded-md px-2 h-9 bg-background" /></label>
                <label className="text-sm"><span className="block mb-1 text-muted-foreground">{ar ? "إلى" : "To"}</span>
                  <input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }} className="border rounded-md px-2 h-9 bg-background" /></label>
                <label className="text-sm"><span className="block mb-1 text-muted-foreground">{ar ? "اليوزر" : "User"}</span>
                  <select value={userId} onChange={e => { setUserId(e.target.value); setPage(1); }} className="border rounded-md px-2 h-9 bg-background min-w-[160px]">
                    <option value="">{ar ? "الكل" : "All"}</option>
                    {users.map(u => <option key={u.user_id} value={u.user_id}>{u.user_name || u.username}</option>)}
                  </select></label>
                <label className="text-sm"><span className="block mb-1 text-muted-foreground">{ar ? "العملية" : "Action"}</span>
                  <select value={action} onChange={e => { setAction(e.target.value); setPage(1); }} className="border rounded-md px-2 h-9 bg-background">
                    <option value="">{ar ? "الكل" : "All"}</option>
                    <option value="create">{ar ? "إضافة" : "Create"}</option>
                    <option value="update">{ar ? "تعديل" : "Update"}</option>
                    <option value="delete">{ar ? "حذف" : "Delete"}</option>
                    <option value="login">{ar ? "تسجيل دخول" : "Login"}</option>
                  </select></label>
                <label className="text-sm flex-1 min-w-[180px]"><span className="block mb-1 text-muted-foreground">{ar ? "بحث" : "Search"}</span>
                  <div className="relative"><Search className="w-4 h-4 absolute top-2.5 start-2 text-muted-foreground" />
                    <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { setPage(1); loadLogs(); } }}
                      placeholder={ar ? "اسم موظف أو يوزر..." : "Employee or user..."} className="border rounded-md ps-8 pe-2 h-9 w-full bg-background" /></div></label>
                <Button variant="outline" className="gap-2" onClick={() => downloadFile(`/api/audit/logs?${logsQuery({ export: "xlsx" })}`, `audit_${from}_${to}.xlsx`, ar)}>
                  <Download className="w-4 h-4" />Excel</Button>
              </CardContent>
            </Card>
            <Card><CardContent className="p-0">
              <div className="px-4 pt-4 text-sm text-muted-foreground flex items-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {ar ? `عدد التعديلات: ${total}` : `Changes: ${total}`}
              </div>
              <LogList rows={logs} ar={ar} showEmployee />
              {pages > 1 && (
                <div className="flex items-center justify-center gap-3 p-4">
                  <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>{ar ? "السابق" : "Prev"}</Button>
                  <span className="text-sm">{page} / {pages}</span>
                  <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>{ar ? "التالي" : "Next"}</Button>
                </div>
              )}
            </CardContent></Card>
          </>
        )
      )}

      {tab === "employee" && (
        <>
          <Card>
            <CardContent className="p-4 flex flex-wrap gap-3 items-end">
              <label className="text-sm"><span className="block mb-1 text-muted-foreground">{ar ? "الموظف" : "Employee"}</span>
                <select value={empId} onChange={e => setEmpId(e.target.value)} className="border rounded-md px-2 h-9 bg-background min-w-[240px]">
                  <option value="">{ar ? "اختار موظف" : "Choose employee"}</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}{e.employee_code ? ` (${e.employee_code})` : ""}</option>)}
                </select></label>
              <label className="text-sm flex items-center gap-2 h-9">
                <input type="checkbox" checked={onlyProfile} onChange={e => setOnlyProfile(e.target.checked)} />
                {ar ? "بيانات الموظف بس (المرتب والاسم والتليفون...)" : "Profile changes only"}
              </label>
              {empId && (
                <Button variant="outline" className="gap-2" onClick={() => downloadFile(`/api/audit/employee/${empId}?export=xlsx${onlyProfile ? "&only_profile=1" : ""}`, `employee_${empId}_history.xlsx`, ar)}>
                  <Download className="w-4 h-4" />Excel</Button>
              )}
              {empLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mb-2" />}
            </CardContent>
          </Card>
          {empId && (
            <Card><CardContent className="p-0">
              <div className="px-4 pt-4 font-semibold">{empName} <span className="text-sm text-muted-foreground font-normal">{ar ? `· ${history.length} تعديل` : `· ${history.length} changes`}</span></div>
              <LogList rows={history} ar={ar} showEmployee={false} />
            </CardContent></Card>
          )}
        </>
      )}
    </div>
  );
}

export default function AuditPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <AuditContent />
    </Suspense>
  );
}
