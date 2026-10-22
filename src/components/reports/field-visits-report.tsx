"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Clock, Download, Loader2, MapPin, Navigation, Route, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";
import { todayCairo } from "@/lib/utils";

interface Visit {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_code: string;
  department: string;
  visit_type_display: string;
  location_name: string;
  purpose: string;
  notes: string;
  status: string;
  status_display: string;
  is_ongoing: boolean;
  date: string | null;
  arrival_time: string | null;
  arrival_address: string;
  arrival_map: string;
  departure_time: string | null;
  departure_map: string;
  duration_minutes: number | null;
  distance_arrival_departure_m: number | null;
  tracking_points: number;
}

interface PerEmployee {
  employee_id: number;
  employee_name: string;
  employee_code: string;
  visits: number;
  completed: number;
  ongoing: number;
  total_minutes: number;
  avg_minutes: number;
}

interface Report {
  success: boolean;
  message?: string;
  total_visits: number;
  total_minutes: number;
  ongoing: number;
  per_employee: PerEmployee[];
  visits: Visit[];
}

interface TrackPoint {
  time: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  address: string;
}

const STATUS_CLS: Record<string, string> = {
  completed: "bg-emerald-500/10 text-emerald-700",
  arrived: "bg-sky-500/10 text-sky-700",
  in_progress: "bg-amber-500/10 text-amber-700",
  cancelled: "bg-slate-500/10 text-slate-600",
};

function fmtDuration(min: number | null, ar: boolean) {
  if (min === null || min === undefined) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return ar ? `${h} س ${m} د` : `${h}h ${m}m`;
}

// رابط خرايط جوجل بخط السير (أول وآخر نقطة وكام نقطة في النص)
function routeLink(points: TrackPoint[]) {
  const pts = points.filter(p => p.latitude !== null && p.longitude !== null);
  if (pts.length < 2) return "";
  const step = Math.max(1, Math.ceil(pts.length / 10));
  const picked = pts.filter((_, i) => i % step === 0);
  if (picked[picked.length - 1] !== pts[pts.length - 1]) picked.push(pts[pts.length - 1]);
  return "https://www.google.com/maps/dir/" + picked.map(p => `${p.latitude},${p.longitude}`).join("/");
}

export function FieldVisitsReport() {
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";
  const today = todayCairo();
  const [dateFrom, setDateFrom] = useState(today.slice(0, 8) + "01");
  const [dateTo, setDateTo] = useState(today);
  const [employeeId, setEmployeeId] = useState("");
  const [status, setStatus] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [employees, setEmployees] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<{ visit: Visit; tracking: TrackPoint[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState<number | null>(null);

  const authH = () => {
    const t = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) || "" : "";
    return t.startsWith("Token ") || t.startsWith("Bearer ") ? t : `Token ${t}`;
  };

  const query = useCallback((extra: Record<string, string> = {}) => {
    const p = new URLSearchParams({ date_from: dateFrom, date_to: dateTo, ...extra });
    if (employeeId) p.set("employee_id", employeeId);
    if (status) p.set("status", status);
    return p.toString();
  }, [dateFrom, dateTo, employeeId, status]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/field-visits?${query()}`, { headers: { Authorization: authH() } });
      const data: Report = await res.json();
      if (!res.ok || data.success === false) {
        toast.error(data.message || (ar ? "فشل تحميل التقرير" : "Failed to load report"));
        setReport(null);
        return;
      }
      setReport(data);
      // قايمة الموظفين للفلتر من أول تحميل من غير فلتر موظف
      if (!employeeId) {
        setEmployees(data.per_employee.map(e => ({ id: e.employee_id, name: e.employee_name })));
      }
    } catch {
      toast.error(ar ? "خطأ في الاتصال" : "Network error");
    } finally {
      setLoading(false);
    }
  }, [query, ar, employeeId]);

  useEffect(() => { load(); }, [load]);

  const download = async (format: "xlsx" | "pdf") => {
    try {
      const res = await fetch(`/api/reports/field-visits?${query({ format })}`, { headers: { Authorization: authH() } });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `field_visits_${dateFrom}_${dateTo}.${format}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      toast.error(ar ? "فشل التصدير" : "Export failed");
    }
  };

  const openDetail = async (v: Visit) => {
    setDetailLoading(v.id);
    try {
      const res = await fetch(`/api/reports/field-visits/${v.id}`, { headers: { Authorization: authH() } });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message);
      setDetail({ visit: data.visit, tracking: data.tracking || [] });
    } catch (e) {
      toast.error((e as Error).message || (ar ? "فشل تحميل التفاصيل" : "Failed to load details"));
    } finally {
      setDetailLoading(null);
    }
  };

  const totals = useMemo(() => ({
    visits: report?.total_visits ?? 0,
    minutes: report?.total_minutes ?? 0,
    ongoing: report?.ongoing ?? 0,
    employees: report?.per_employee.length ?? 0,
  }), [report]);

  return (
    <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{ar ? "تقرير الزيارات الميدانية" : "Field Visits Report"}</h1>
          <p className="text-sm text-muted-foreground">
            {ar ? "كل زيارة: قعد قد إيه، وصل ومشي إمتى ومنين، وخط سيره خلال الزيارة" : "Duration, arrival/departure times and places, and the route during each visit"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => download("xlsx")} className="gap-2"><Download className="w-4 h-4" />Excel</Button>
          <Button variant="outline" onClick={() => download("pdf")} className="gap-2"><Download className="w-4 h-4" />PDF</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3 items-end">
          <label className="text-sm">
            <span className="block mb-1 text-muted-foreground">{ar ? "من" : "From"}</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border rounded-md px-2 h-9 bg-background" />
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-muted-foreground">{ar ? "إلى" : "To"}</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border rounded-md px-2 h-9 bg-background" />
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-muted-foreground">{ar ? "الموظف" : "Employee"}</span>
            <select value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="border rounded-md px-2 h-9 bg-background min-w-[180px]">
              <option value="">{ar ? "كل الموظفين" : "All employees"}</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-muted-foreground">{ar ? "الحالة" : "Status"}</span>
            <select value={status} onChange={e => setStatus(e.target.value)} className="border rounded-md px-2 h-9 bg-background">
              <option value="">{ar ? "الكل" : "All"}</option>
              <option value="completed">{ar ? "مكتملة" : "Completed"}</option>
              <option value="in_progress">{ar ? "جارية" : "In progress"}</option>
              <option value="arrived">{ar ? "وصل" : "Arrived"}</option>
              <option value="cancelled">{ar ? "ملغية" : "Cancelled"}</option>
            </select>
          </label>
          {loading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mb-2" />}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: MapPin, label: ar ? "عدد الزيارات" : "Visits", value: totals.visits },
          { icon: Clock, label: ar ? "إجمالي الوقت" : "Total time", value: fmtDuration(totals.minutes, ar) },
          { icon: Users, label: ar ? "موظفين زاروا" : "Employees", value: totals.employees },
          { icon: Navigation, label: ar ? "زيارات لسه جارية" : "Ongoing", value: totals.ongoing },
        ].map(c => (
          <Card key={c.label}><CardContent className="p-4 flex items-center gap-3">
            <c.icon className="w-8 h-8 text-brand-primary" />
            <div><div className="text-xs text-muted-foreground">{c.label}</div><div className="text-xl font-bold">{c.value}</div></div>
          </CardContent></Card>
        ))}
      </div>

      {report && report.per_employee.length > 0 && (
        <Card><CardContent className="p-0 overflow-x-auto">
          <div className="px-4 pt-4 font-semibold">{ar ? "ملخص لكل موظف" : "Per employee"}</div>
          <Table>
            <TableHeader><TableRow>
              <TableHead>{ar ? "الموظف" : "Employee"}</TableHead>
              <TableHead>{ar ? "الزيارات" : "Visits"}</TableHead>
              <TableHead>{ar ? "مكتملة" : "Completed"}</TableHead>
              <TableHead>{ar ? "إجمالي الوقت" : "Total time"}</TableHead>
              <TableHead>{ar ? "متوسط الزيارة" : "Average"}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {report.per_employee.map(e => (
                <TableRow key={e.employee_id}>
                  <TableCell className="font-medium">{e.employee_name} <span className="text-xs text-muted-foreground">{e.employee_code}</span></TableCell>
                  <TableCell>{e.visits}</TableCell>
                  <TableCell>{e.completed}</TableCell>
                  <TableCell>{fmtDuration(e.total_minutes, ar)}</TableCell>
                  <TableCell>{fmtDuration(e.avg_minutes, ar)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      )}

      <Card><CardContent className="p-0 overflow-x-auto">
        <div className="px-4 pt-4 font-semibold">{ar ? "كل الزيارات" : "All visits"}</div>
        {!report || report.visits.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">{loading ? "…" : (ar ? "مفيش زيارات في الفترة دي" : "No visits in this period")}</div>
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>{ar ? "التاريخ" : "Date"}</TableHead>
              <TableHead>{ar ? "الموظف" : "Employee"}</TableHead>
              <TableHead>{ar ? "النوع / المكان" : "Type / Place"}</TableHead>
              <TableHead>{ar ? "وصل" : "Arrived"}</TableHead>
              <TableHead>{ar ? "مشي" : "Left"}</TableHead>
              <TableHead>{ar ? "قعد" : "Stayed"}</TableHead>
              <TableHead>{ar ? "العنوان" : "Address"}</TableHead>
              <TableHead>{ar ? "الحالة" : "Status"}</TableHead>
              <TableHead />
            </TableRow></TableHeader>
            <TableBody>
              {report.visits.map(v => (
                <TableRow key={v.id}>
                  <TableCell className="whitespace-nowrap">{v.date}</TableCell>
                  <TableCell className="font-medium whitespace-nowrap">{v.employee_name}</TableCell>
                  <TableCell>
                    <div>{v.visit_type_display}</div>
                    <div className="text-xs text-muted-foreground">{v.location_name}</div>
                  </TableCell>
                  <TableCell>{v.arrival_time || "—"}</TableCell>
                  <TableCell>{v.departure_time || (v.is_ongoing ? (ar ? "لسه هناك" : "Still there") : "—")}</TableCell>
                  <TableCell className="whitespace-nowrap">{fmtDuration(v.duration_minutes, ar)}</TableCell>
                  <TableCell className="max-w-[260px]">
                    <div className="truncate" title={v.arrival_address}>{v.arrival_address || "—"}</div>
                    {v.arrival_map && <a href={v.arrival_map} target="_blank" rel="noreferrer" className="text-xs text-brand-primary hover:underline">{ar ? "على الخريطة" : "On map"}</a>}
                  </TableCell>
                  <TableCell><Badge className={`${STATUS_CLS[v.status] || "bg-slate-500/10 text-slate-600"} border-0`}>{v.status_display}</Badge></TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" disabled={detailLoading !== null} onClick={() => openDetail(v)} className="gap-1">
                      {detailLoading === v.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Route className="w-3 h-3" />}
                      {ar ? "التفاصيل" : "Details"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>

      <Dialog open={!!detail} onOpenChange={o => { if (!o) setDetail(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir={ar ? "rtl" : "ltr"}>
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>{detail.visit.employee_name} — {detail.visit.visit_type_display}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">{ar ? "المكان: " : "Place: "}</span>{detail.visit.location_name || "—"}</div>
                <div><span className="text-muted-foreground">{ar ? "التاريخ: " : "Date: "}</span>{detail.visit.date}</div>
                <div><span className="text-muted-foreground">{ar ? "وصل: " : "Arrived: "}</span>{detail.visit.arrival_time || "—"}</div>
                <div><span className="text-muted-foreground">{ar ? "مشي: " : "Left: "}</span>{detail.visit.departure_time || "—"}</div>
                <div><span className="text-muted-foreground">{ar ? "قعد: " : "Stayed: "}</span>{fmtDuration(detail.visit.duration_minutes, ar)}</div>
                <div><span className="text-muted-foreground">{ar ? "المسافة بين مكان الوصول والمغادرة: " : "Arrival→departure distance: "}</span>
                  {detail.visit.distance_arrival_departure_m !== null ? `${detail.visit.distance_arrival_departure_m} ${ar ? "م" : "m"}` : "—"}</div>
                <div className="col-span-2"><span className="text-muted-foreground">{ar ? "عنوان الوصول: " : "Arrival address: "}</span>{detail.visit.arrival_address || "—"}</div>
                {detail.visit.purpose && <div className="col-span-2"><span className="text-muted-foreground">{ar ? "الغرض: " : "Purpose: "}</span>{detail.visit.purpose}</div>}
                {detail.visit.notes && <div className="col-span-2"><span className="text-muted-foreground">{ar ? "ملاحظات: " : "Notes: "}</span>{detail.visit.notes}</div>}
                <div className="col-span-2 flex flex-wrap gap-3">
                  {detail.visit.arrival_map && <a href={detail.visit.arrival_map} target="_blank" rel="noreferrer" className="text-brand-primary hover:underline">{ar ? "مكان الوصول" : "Arrival point"}</a>}
                  {detail.visit.departure_map && <a href={detail.visit.departure_map} target="_blank" rel="noreferrer" className="text-brand-primary hover:underline">{ar ? "مكان المغادرة" : "Departure point"}</a>}
                  {routeLink(detail.tracking) && <a href={routeLink(detail.tracking)} target="_blank" rel="noreferrer" className="text-brand-primary hover:underline">{ar ? "خط السير على الخريطة" : "Route on map"}</a>}
                </div>
              </div>
              <div className="mt-4">
                <div className="font-semibold mb-2">{ar ? `نقاط التتبع خلال الزيارة (${detail.tracking.length})` : `Tracking points (${detail.tracking.length})`}</div>
                {detail.tracking.length === 0 ? (
                  <div className="text-sm text-muted-foreground">{ar ? "مفيش نقاط تتبع اتسجلت خلال الزيارة دي" : "No tracking points recorded during this visit"}</div>
                ) : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>{ar ? "الوقت" : "Time"}</TableHead>
                      <TableHead>{ar ? "العنوان" : "Address"}</TableHead>
                      <TableHead>{ar ? "الدقة" : "Accuracy"}</TableHead>
                      <TableHead />
                    </TableRow></TableHeader>
                    <TableBody>
                      {detail.tracking.map((p, i) => (
                        <TableRow key={i}>
                          <TableCell>{p.time}</TableCell>
                          <TableCell className="max-w-[260px] truncate" title={p.address}>{p.address || "—"}</TableCell>
                          <TableCell>{p.accuracy !== null ? `${Math.round(p.accuracy)} ${ar ? "م" : "m"}` : "—"}</TableCell>
                          <TableCell>{p.latitude !== null && <a href={`https://maps.google.com/?q=${p.latitude},${p.longitude}`} target="_blank" rel="noreferrer" className="text-xs text-brand-primary hover:underline">{ar ? "خريطة" : "Map"}</a>}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
