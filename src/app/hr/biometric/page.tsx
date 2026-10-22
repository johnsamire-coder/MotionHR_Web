"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, Fingerprint, Link2, Loader2, Plus, Upload, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";
import { todayCairo } from "@/lib/utils";

interface Device {
  id: number; serial_number: string; name: string; branch_id: number | null; branch: string;
  is_active: boolean; online: boolean; last_seen: string | null; last_upload: string | null; punches_today: number;
}
interface PinRow {
  pin: string; device_user_name: string; employee_id: number | null; employee_name: string; employee_code: string;
  manual: boolean; punches: number; last_punch: string | null;
}
interface DayRow {
  date: string; employee_id: number; employee_name: string; employee_code: string; first_punch: string;
  last_punch: string; punches: number; system_check_in: string; system_check_out: string; system_status: string;
  diff_in_minutes: number | null;
}

function authH() {
  const t = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) || "" : "";
  return t.startsWith("Token ") || t.startsWith("Bearer ") ? t : `Token ${t}`;
}

async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(`/api/biometric/${path}`, { ...init, headers: { Authorization: authH(), ...(init.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new Error(data.message || "حصلت مشكلة");
  return data;
}

export default function BiometricPage() {
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";
  const [tab, setTab] = useState<"devices" | "map" | "upload" | "report">("devices");

  // ── الأجهزة ──
  const [devices, setDevices] = useState<Device[]>([]);
  const [branches, setBranches] = useState<{ id: number; name_ar?: string; name?: string }[]>([]);
  const [sn, setSn] = useState("");
  const [devName, setDevName] = useState("");
  const [devBranch, setDevBranch] = useState("");
  const [busy, setBusy] = useState(false);

  const loadDevices = useCallback(async () => {
    try { setDevices((await api("devices")).devices || []); }
    catch (e) { toast.error((e as Error).message); }
  }, []);

  useEffect(() => {
    loadDevices();
    fetch("/api/branches", { headers: { Authorization: authH() } }).then(r => r.json())
      .then(d => setBranches(Array.isArray(d) ? d : d.branches || d.results || [])).catch(() => {});
  }, [loadDevices]);

  const addDevice = async () => {
    if (sn.trim().length < 4) { toast.error(ar ? "اكتب الرقم التسلسلي (SN) للجهاز" : "Enter the device serial number"); return; }
    setBusy(true);
    try {
      const d = await api("devices", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serial_number: sn.trim(), name: devName.trim(), branch_id: devBranch || null }) });
      toast.success(d.message);
      setSn(""); setDevName(""); setDevBranch("");
      loadDevices();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  const patchDevice = async (d: Device, body: Record<string, unknown>) => {
    try {
      await api(`devices/${d.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      loadDevices();
    } catch (e) { toast.error((e as Error).message); }
  };

  // ── الربط ──
  const [pins, setPins] = useState<PinRow[]>([]);
  const [employees, setEmployees] = useState<{ id: number; full_name: string; employee_code?: string }[]>([]);
  const [onlyUnmatched, setOnlyUnmatched] = useState(false);

  const loadPins = useCallback(async () => {
    try { setPins((await api("user-map")).pins || []); } catch (e) { toast.error((e as Error).message); }
  }, []);

  useEffect(() => {
    if (tab !== "map") return;
    loadPins();
    if (employees.length === 0) {
      fetch("/api/employees/list?page_size=2000", { headers: { Authorization: authH() } }).then(r => r.json())
        .then(d => setEmployees(d.results || d.employees || [])).catch(() => {});
    }
  }, [tab, loadPins, employees.length]);

  const linkPin = async (pin: string, employeeId: string) => {
    try {
      await api("user-map", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, employee_id: employeeId || null }) });
      toast.success(ar ? "اتحفظ الربط" : "Saved");
      loadPins();
    } catch (e) { toast.error((e as Error).message); }
  };

  // ── رفع ملف ──
  const [file, setFile] = useState<File | null>(null);
  const [uploadDevice, setUploadDevice] = useState("");
  const [uploadResult, setUploadResult] = useState<string>("");

  const doUpload = async () => {
    if (!file) { toast.error(ar ? "اختار الملف" : "Choose a file"); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (uploadDevice) fd.append("device_id", uploadDevice);
      const d = await api("upload", { method: "POST", body: fd });
      setUploadResult(d.message);
      toast.success(d.message);
    } catch (e) { toast.error((e as Error).message); setUploadResult((e as Error).message); } finally { setBusy(false); }
  };

  // ── التقرير ──
  const today = todayCairo();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [days, setDays] = useState<DayRow[]>([]);
  const [unmatchedPunches, setUnmatchedPunches] = useState(0);
  const [reportLoading, setReportLoading] = useState(false);

  const loadReport = useCallback(async () => {
    setReportLoading(true);
    try {
      const d = await api(`report?date_from=${from}&date_to=${to}`);
      setDays(d.days || []);
      setUnmatchedPunches(d.unmatched_punches || 0);
    } catch (e) { toast.error((e as Error).message); } finally { setReportLoading(false); }
  }, [from, to]);

  useEffect(() => { if (tab === "report") loadReport(); }, [tab, loadReport]);

  const exportReport = async (view: "daily" | "raw") => {
    try {
      const res = await fetch(`/api/biometric/report?date_from=${from}&date_to=${to}&view=${view}&export=xlsx`, { headers: { Authorization: authH() } });
      if (!res.ok) throw new Error();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(await res.blob());
      a.download = `biometric_${view}_${from}_${to}.xlsx`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch { toast.error(ar ? "فشل التصدير" : "Export failed"); }
  };

  const shownPins = onlyUnmatched ? pins.filter(p => !p.employee_id) : pins;
  const tabs = [
    { k: "devices", ar: "الأجهزة", en: "Devices", icon: Fingerprint },
    { k: "map", ar: "ربط الأرقام بالموظفين", en: "Link to employees", icon: Link2 },
    { k: "upload", ar: "رفع ملف بصمات", en: "Upload file", icon: Upload },
    { k: "report", ar: "التقرير والمقارنة", en: "Report", icon: Download },
  ] as const;

  return (
    <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Fingerprint className="w-6 h-6" />{ar ? "أجهزة البصمة" : "Biometric Devices"}</h1>
        <p className="text-sm text-muted-foreground">
          {ar ? "أجهزة ZKTeco: البصمات بتتسجل هنا وبتتقارن بالحضور. (لسه مابتدخلش الحضور ولا المرتبات)" : "ZKTeco devices: punches are recorded and compared with attendance (not applied yet)."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map(t => (
          <Button key={t.k} variant={tab === t.k ? "default" : "outline"} onClick={() => setTab(t.k)} className="gap-2">
            <t.icon className="w-4 h-4" />{ar ? t.ar : t.en}
          </Button>
        ))}
      </div>

      {tab === "devices" && (
        <>
          <Card><CardContent className="p-4 space-y-3">
            <div className="font-semibold">{ar ? "تسجيل جهاز" : "Register a device"}</div>
            <div className="flex flex-wrap gap-3 items-end">
              <label className="text-sm"><span className="block mb-1 text-muted-foreground">{ar ? "الرقم التسلسلي (SN)" : "Serial number (SN)"}</span>
                <input value={sn} onChange={e => setSn(e.target.value)} className="border rounded-md px-2 h-9 bg-background w-56" dir="ltr" /></label>
              <label className="text-sm"><span className="block mb-1 text-muted-foreground">{ar ? "اسم الجهاز" : "Name"}</span>
                <input value={devName} onChange={e => setDevName(e.target.value)} placeholder={ar ? "مثلاً: جهاز المدخل" : ""} className="border rounded-md px-2 h-9 bg-background" /></label>
              <label className="text-sm"><span className="block mb-1 text-muted-foreground">{ar ? "الفرع" : "Branch"}</span>
                <select value={devBranch} onChange={e => setDevBranch(e.target.value)} className="border rounded-md px-2 h-9 bg-background">
                  <option value="">{ar ? "—" : "—"}</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name_ar || b.name}</option>)}
                </select></label>
              <Button onClick={addDevice} disabled={busy} className="gap-2">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}{ar ? "تسجيل" : "Register"}</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {ar ? "الرقم التسلسلي مكتوب على ملصق ورا الجهاز، أو في الجهاز من: القائمة ← معلومات النظام ← معلومات الجهاز. وفي إعدادات الجهاز (Cloud Server / ADMS) اكتب عنوان السيرفر اللي هنبعتهولك." : "The SN is on the label behind the device or in System Info."}
            </p>
          </CardContent></Card>

          <Card><CardContent className="p-0 overflow-x-auto">
            {devices.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">{ar ? "مفيش أجهزة متسجلة لسه" : "No devices yet"}</div>
            ) : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>{ar ? "الجهاز" : "Device"}</TableHead>
                  <TableHead>{ar ? "الفرع" : "Branch"}</TableHead>
                  <TableHead>{ar ? "الاتصال" : "Connection"}</TableHead>
                  <TableHead>{ar ? "بصمات النهارده" : "Today"}</TableHead>
                  <TableHead>{ar ? "آخر اتصال" : "Last seen"}</TableHead>
                  <TableHead>{ar ? "الحالة" : "Status"}</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {devices.map(d => (
                    <TableRow key={d.id}>
                      <TableCell><div className="font-medium">{d.name || "—"}</div><div className="text-xs text-muted-foreground" dir="ltr">{d.serial_number}</div></TableCell>
                      <TableCell>
                        <select value={d.branch_id ?? ""} onChange={e => patchDevice(d, { branch_id: e.target.value || null })} className="border rounded-md px-2 h-8 bg-background text-sm">
                          <option value="">—</option>
                          {branches.map(b => <option key={b.id} value={b.id}>{b.name_ar || b.name}</option>)}
                        </select>
                      </TableCell>
                      <TableCell>{d.online
                        ? <span className="inline-flex items-center gap-1 text-emerald-700"><Wifi className="w-4 h-4" />{ar ? "متصل" : "Online"}</span>
                        : <span className="inline-flex items-center gap-1 text-muted-foreground"><WifiOff className="w-4 h-4" />{ar ? "مش متصل" : "Offline"}</span>}</TableCell>
                      <TableCell>{d.punches_today}</TableCell>
                      <TableCell className="text-xs">{d.last_seen || (ar ? "لسه مااتصلش" : "Never")}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => patchDevice(d, { is_active: !d.is_active })}>
                          {d.is_active ? (ar ? "شغال — إيقاف" : "Active — stop") : (ar ? "موقوف — تشغيل" : "Stopped — start")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>
        </>
      )}

      {tab === "map" && (
        <Card><CardContent className="p-0 overflow-x-auto">
          <div className="p-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground max-w-2xl">
              {ar ? "رقم الموظف على الجهاز بيتربط لوحده لو هو نفس كوده في البرنامج (أو نفس الأرقام اللي في الكود، زي 15 = EMP00015). الأرقام اللي ماتربطتش اختار موظفها هنا، وبصماتها القديمة هتتربط على طول." : "Device numbers link automatically when they match the employee code; link the rest here."}
            </p>
            <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={onlyUnmatched} onChange={e => setOnlyUnmatched(e.target.checked)} />{ar ? "اللي محتاج ربط بس" : "Unlinked only"}</label>
          </div>
          <Table>
            <TableHeader><TableRow>
              <TableHead>{ar ? "رقم الجهاز" : "Device no."}</TableHead>
              <TableHead>{ar ? "الاسم على الجهاز" : "Name on device"}</TableHead>
              <TableHead>{ar ? "الموظف" : "Employee"}</TableHead>
              <TableHead>{ar ? "البصمات" : "Punches"}</TableHead>
              <TableHead>{ar ? "آخر بصمة" : "Last"}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {shownPins.map(p => (
                <TableRow key={p.pin}>
                  <TableCell className="font-mono">{p.pin}</TableCell>
                  <TableCell>{p.device_user_name || "—"}</TableCell>
                  <TableCell>
                    <select value={p.employee_id ?? ""} onChange={e => linkPin(p.pin, e.target.value)}
                      className={`border rounded-md px-2 h-8 bg-background text-sm min-w-[200px] ${p.employee_id ? "" : "border-amber-400"}`}>
                      <option value="">{ar ? "— مش مربوط —" : "— not linked —"}</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}{e.employee_code ? ` (${e.employee_code})` : ""}</option>)}
                    </select>
                    {p.employee_id && !p.manual && <Badge className="ms-2 bg-sky-500/10 text-sky-700 border-0">{ar ? "تلقائي" : "auto"}</Badge>}
                  </TableCell>
                  <TableCell>{p.punches}</TableCell>
                  <TableCell className="text-xs">{p.last_punch || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {shownPins.length === 0 && <div className="py-12 text-center text-muted-foreground">{ar ? "مفيش أرقام لسه" : "Nothing yet"}</div>}
        </CardContent></Card>
      )}

      {tab === "upload" && (
        <Card><CardContent className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            {ar ? "للأجهزة اللي مش متوصلة بالنت: نزّل البصمات على فلاشة من الجهاز (ملف attlog.dat)، أو صدّرها Excel من برنامج الجهاز، وارفعها هنا. البصمة المكررة مابتتسجلش مرتين." : "For offline devices: upload attlog.dat from USB or an Excel export. Duplicates are ignored."}
          </p>
          <div className="flex flex-wrap gap-3 items-end">
            <label className="text-sm"><span className="block mb-1 text-muted-foreground">{ar ? "الملف" : "File"}</span>
              <input type="file" accept=".dat,.txt,.csv,.xlsx" onChange={e => setFile(e.target.files?.[0] || null)} className="text-sm" /></label>
            <label className="text-sm"><span className="block mb-1 text-muted-foreground">{ar ? "من جهاز (اختياري)" : "Device (optional)"}</span>
              <select value={uploadDevice} onChange={e => setUploadDevice(e.target.value)} className="border rounded-md px-2 h-9 bg-background">
                <option value="">—</option>
                {devices.map(d => <option key={d.id} value={d.id}>{d.name || d.serial_number}</option>)}
              </select></label>
            <Button onClick={doUpload} disabled={busy || !file} className="gap-2">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}{ar ? "رفع" : "Upload"}</Button>
          </div>
          {uploadResult && <div className="text-sm p-3 rounded-md bg-muted">{uploadResult}</div>}
        </CardContent></Card>
      )}

      {tab === "report" && (
        <>
          <Card><CardContent className="p-4 flex flex-wrap gap-3 items-end">
            <label className="text-sm"><span className="block mb-1 text-muted-foreground">{ar ? "من" : "From"}</span>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="border rounded-md px-2 h-9 bg-background" /></label>
            <label className="text-sm"><span className="block mb-1 text-muted-foreground">{ar ? "إلى" : "To"}</span>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} className="border rounded-md px-2 h-9 bg-background" /></label>
            <Button variant="outline" className="gap-2" onClick={() => exportReport("daily")}><Download className="w-4 h-4" />{ar ? "Excel المقارنة" : "Comparison Excel"}</Button>
            <Button variant="outline" className="gap-2" onClick={() => exportReport("raw")}><Download className="w-4 h-4" />{ar ? "Excel كل البصمات" : "All punches Excel"}</Button>
            {reportLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mb-2" />}
          </CardContent></Card>
          {unmatchedPunches > 0 && (
            <div className="text-sm p-3 rounded-md bg-amber-500/10 text-amber-800">
              {ar ? `فيه ${unmatchedPunches} بصمة لأرقام مش مربوطة بموظفين. اربطها من تبويب "ربط الأرقام".` : `${unmatchedPunches} punches are not linked to employees.`}
            </div>
          )}
          <Card><CardContent className="p-0 overflow-x-auto">
            {days.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">{ar ? "مفيش بصمات في الفترة دي" : "No punches"}</div>
            ) : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>{ar ? "التاريخ" : "Date"}</TableHead>
                  <TableHead>{ar ? "الموظف" : "Employee"}</TableHead>
                  <TableHead>{ar ? "أول بصمة" : "First"}</TableHead>
                  <TableHead>{ar ? "آخر بصمة" : "Last"}</TableHead>
                  <TableHead>{ar ? "حضور البرنامج" : "System in"}</TableHead>
                  <TableHead>{ar ? "انصراف البرنامج" : "System out"}</TableHead>
                  <TableHead>{ar ? "الحالة في البرنامج" : "System status"}</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {days.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.date}</TableCell>
                      <TableCell className="font-medium">{r.employee_name}</TableCell>
                      <TableCell>{r.first_punch}</TableCell>
                      <TableCell>{r.last_punch || "—"}</TableCell>
                      <TableCell className={r.diff_in_minutes !== null && Math.abs(r.diff_in_minutes) > 10 ? "text-amber-700 font-semibold" : ""}>{r.system_check_in || "—"}</TableCell>
                      <TableCell>{r.system_check_out || "—"}</TableCell>
                      <TableCell>{r.system_status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>
        </>
      )}
    </div>
  );
}
