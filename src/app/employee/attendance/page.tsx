"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Clock, Calendar, Loader2, LogIn, LogOut,
  CheckCircle2, XCircle, MapPin, TrendingUp,
  AlertTriangle, Play, Square, Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

// ── Types ──────────────────────────────────────────
interface AttStatus {
  success: boolean;
  checked_in: boolean;
  checked_out: boolean;
  check_in_time?: string;
  check_out_time?: string;
  shift_name?: string;
  shift_start?: string;
  shift_end?: string;
  worker_type?: string;
  can_check_out?: boolean;
  allow_partial_checkout?: boolean;
  can_partial_checkout?: boolean;
  can_resume?: boolean;
  today?: {
    checked_in?: boolean;
    checked_out?: boolean;
    check_in_time?: string;
    check_out_time?: string;
    check_in_address?: string;
    status?: string;
  };
}

interface HistoryItem {
  date: string;
  date_display?: string;
  status?: string;
  check_in_time?: string;
  check_out_time?: string;
  check_in_address?: string;
  late_minutes?: number;
  work_hours?: number;
  overtime_hours?: number;
}

interface SummaryData {
  attendance?: {
    total_days: number;
    present: number;
    late: number;
    absent: number;
    total_late_minutes: number;
    total_work_hours: number;
  };
}

interface Visit {
  id: number;
  visit_type_display?: string;
  location_name: string;
  purpose: string;
  status: string;
  arrival_time?: string;
  departure_time?: string;
  duration_minutes?: number;
  is_active: boolean;
  arrival_address?: string;
}

interface VisitType { value: string; label: string }

interface FieldVisitsData {
  visits: Visit[];
  active_visit: Visit | null;
}

const STATUS_CONFIG: Record<string, {
  label_ar: string; label_en: string; color: string;
  icon: React.ComponentType<{ className?: string }>
}> = {
  present:  { label_ar: "حاضر",  label_en: "Present", color: "bg-emerald-500/10 text-emerald-700", icon: CheckCircle2 },
  late:     { label_ar: "متأخر", label_en: "Late",    color: "bg-amber-500/10 text-amber-700",    icon: AlertTriangle },
  absent:   { label_ar: "غائب",  label_en: "Absent",  color: "bg-red-500/10 text-red-700",        icon: XCircle },
  on_leave: { label_ar: "إجازة", label_en: "Leave",   color: "bg-blue-500/10 text-blue-700",      icon: Calendar },
};

function fmtMins(m?: number | null, ar = true) {
  if (!m || m <= 0) return "—";
  const h = Math.floor(m / 60), min = m % 60;
  if (h > 0) return ar ? `${h}س ${min}د` : `${h}h ${min}m`;
  return ar ? `${min}د` : `${min}m`;
}

export default function MyAttendancePage() {
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";

  // ── State ────────────────────────────────────────
  const [status, setStatus]       = useState<AttStatus | null>(null);
  const [history, setHistory]     = useState<HistoryItem[]>([]);
  const [summary, setSummary]     = useState<SummaryData | null>(null);
  const [fieldData, setFieldData] = useState<FieldVisitsData>({ visits: [], active_visit: null });
  const [visitTypes, setVisitTypes] = useState<VisitType[]>([]);
  const [loading, setLoading]     = useState(true);
  const [checking, setChecking]   = useState(false);
  const [endingVisit, setEndingVisit] = useState(false);
  const [startingVisit, setStartingVisit] = useState(false);
  const [showVisitDialog, setShowVisitDialog] = useState(false);
  const [visitForm, setVisitForm] = useState({ visit_type: "client_visit", purpose: "" });

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;
  const langH = ar ? "ar" : "en";

  // ── Load ─────────────────────────────────────────
  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: authH, "Accept-Language": langH };
      const [stRes, hiRes, suRes, fvRes, vtRes] = await Promise.all([
        fetch("/api/employee/status", { headers }),
        fetch("/api/employee/history", { headers }),
        fetch("/api/employee/summary", { headers }),
        fetch("/api/employee/field-visits", { headers }),
        fetch("/api/employee/field-visits/types", { headers: { Authorization: authH } }),
      ]);
      const [stD, hiD, suD, fvD, vtD] = await Promise.all([
        stRes.json(), hiRes.json(), suRes.json(), fvRes.json(), vtRes.json(),
      ]);
      if (stD.success !== false) setStatus(stD);
      setHistory(hiD?.items || []);
      setSummary(suD);
      setFieldData({ visits: fvD?.visits || [], active_visit: fvD?.active_visit || null });
      setVisitTypes(vtD?.types || []);
    } catch {
      toast.error(ar ? "فشل تحميل البيانات" : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token, ar, authH, langH]);

  useEffect(() => { load(); }, [load]);

  // ── GPS Helper ───────────────────────────────────
  const getGPS = async (): Promise<{ lat: number; lng: number } | null> => {
    if (!navigator.geolocation) return null;
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
      );
      return { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch {
      return null;
    }
  };

  // ── Check In/Out ─────────────────────────────────
  const handleAttendance = async (action: "check_in" | "check_out") => {
    setChecking(true);
    try {
      const gps = await getGPS();
      if (!gps) {
        toast.error(ar
          ? "الموقع الجغرافي غير متاح. يرجى تفعيل GPS والسماح بالصلاحية."
          : "Location is unavailable. Please enable GPS and allow location permission.");
        return;
      }
      const res = await fetch("/api/employee/attendance", {
        method: "POST",
        headers: { Authorization: authH, "Content-Type": "application/json", "Accept-Language": langH },
        body: JSON.stringify({ action, latitude: gps.lat, longitude: gps.lng }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        toast.success(action === "check_in"
          ? (ar ? "تم تسجيل الحضور ✅" : "Checked in ✅")
          : (ar ? "تم تسجيل الانصراف ✅" : "Checked out ✅"));
        await load();
      } else {
        toast.error(data.message_ar || data.message || (ar ? "فشل" : "Failed"));
      }
    } catch { toast.error(ar ? "خطأ في الاتصال" : "Connection error"); }
    finally { setChecking(false); }
  };

  // ── Start Field Visit ────────────────────────────
  const handleStartVisit = async () => {
    if (!visitForm.purpose.trim()) {
      toast.error(ar ? "الغرض مطلوب" : "Purpose is required");
      return;
    }
    setStartingVisit(true);
    try {
      const gps = await getGPS();
      const res = await fetch("/api/employee/field-visits", {
        method: "POST",
        headers: { Authorization: authH, "Content-Type": "application/json", "Accept-Language": langH },
        body: JSON.stringify({
          visit_type: visitForm.visit_type,
          purpose: visitForm.purpose,
          location_name: `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}`,
          latitude: gps.lat,
          longitude: gps.lng,
        }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        toast.success(ar ? "تم بدء الزيارة الميدانية ✅" : "Field visit started ✅");
        setShowVisitDialog(false);
        setVisitForm({ visit_type: "client_visit", purpose: "" });
        await load();
      } else {
        toast.error(data.message || (ar ? "فشل" : "Failed"));
      }
    } catch { toast.error(ar ? "خطأ" : "Error"); }
    finally { setStartingVisit(false); }
  };

  // ── End Field Visit ──────────────────────────────
  const handleEndVisit = async () => {
    if (!fieldData.active_visit) return;
    setEndingVisit(true);
    try {
      const gps = await getGPS();
      const res = await fetch(`/api/employee/field-visits/${fieldData.active_visit.id}/end`, {
        method: "POST",
        headers: { Authorization: authH, "Content-Type": "application/json", "Accept-Language": langH },
        body: JSON.stringify({ latitude: gps.lat, longitude: gps.lng }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        toast.success(ar ? "تم إنهاء الزيارة ✅" : "Visit ended ✅");
        await load();
      } else {
        toast.error(data.message || (ar ? "فشل" : "Failed"));
      }
    } catch { toast.error(ar ? "خطأ" : "Error"); }
    finally { setEndingVisit(false); }
  };

  // ── Derived values ───────────────────────────────
  const today       = status?.today;
  const checkedIn   = today?.checked_in  ?? status?.checked_in  ?? false;
  const checkedOut  = today?.checked_out ?? status?.checked_out ?? false;
  const checkInTime = today?.check_in_time  ?? status?.check_in_time;
  const checkOutTime= today?.check_out_time ?? status?.check_out_time;
  const checkInAddr = today?.check_in_address;
  const todayStatus = today?.status;
  const canCheckOut = status?.can_check_out ?? false;
  const workerType  = status?.worker_type || "office";
  const isField     = workerType === "field_free" || workerType === "field_assigned";
  const activeVisit = fieldData.active_visit;
  const hasActiveVisit = !!activeVisit;
  const att         = summary?.attendance;
  const statusInfo  = STATUS_CONFIG[todayStatus || ""];

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString(ar ? "ar-EG" : "en-US", {
      weekday: "short", day: "numeric", month: "short",
    });

  // ── Render Buttons ───────────────────────────────
  const renderButtons = () => {
    if (!status) return null;

    // اكتمل الدوام
    if (checkedIn && checkedOut) {
      return (
        <div className="w-full py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span className="text-emerald-700 font-semibold">
            {ar ? "اكتمل دوام اليوم ✅" : "Shift Complete ✅"}
          </span>
        </div>
      );
    }

    // لم يسجل حضور
    if (!checkedIn) {
      return (
        <Button onClick={() => handleAttendance("check_in")} disabled={checking}
          className="w-full h-16 text-lg gap-3 bg-emerald-600 hover:bg-emerald-700">
          {checking ? <Loader2 className="w-6 h-6 animate-spin" /> : <LogIn className="w-6 h-6" />}
          {ar ? "تسجيل الحضور" : "Check In"}
        </Button>
      );
    }

    // سجل حضور ولسه في الشيفت
    if (checkedIn && !checkedOut) {
      return (
        <div className="space-y-2">

          {/* ── زيارة ميدانية (للميداني فقط) ── */}
          {isField && !hasActiveVisit && (
            <Button
              onClick={() => { setVisitForm({ visit_type: "client_visit", purpose: "" }); setShowVisitDialog(true); }}
              disabled={checking}
              className="w-full h-12 gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Navigation className="w-4 h-4" />
              {ar ? "بدء زيارة ميدانية" : "Start Field Visit"}
            </Button>
          )}

          {/* ── زيارة نشطة ── */}
          {isField && hasActiveVisit && (
            <>
              <div className="w-full py-3 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-blue-700 font-semibold text-sm">
                  {ar ? "تم بدء الزيارة ✅" : "Visit Started ✅"}
                  {activeVisit?.location_name && (
                    <span className="text-xs font-normal text-blue-600 mr-2">
                      — {activeVisit.location_name}
                    </span>
                  )}
                </span>
              </div>

              <Button
                onClick={handleEndVisit}
                disabled={endingVisit}
                className="w-full h-14 gap-3 bg-amber-600 hover:bg-amber-700"
              >
                {endingVisit ? <Loader2 className="w-5 h-5 animate-spin" /> : <Square className="w-5 h-5" />}
                {ar ? "إنهاء الزيارة الميدانية" : "End Field Visit"}
              </Button>
            </>
          )}

          {/* ── تسجيل الانصراف ── */}
          {!hasActiveVisit && canCheckOut && (
            <Button
              onClick={() => handleAttendance("check_out")}
              disabled={checking}
              className="w-full h-14 gap-3 bg-red-600 hover:bg-red-700"
            >
              {checking ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
              {ar ? "تسجيل الانصراف" : "Check Out"}
            </Button>
          )}
        </div>
      );
    }

    return null;
  };

  // ── Today's Visits ───────────────────────────────
  const todayStr = new Date().toISOString().split("T")[0];
  const todayVisits = fieldData.visits.filter(v => v.arrival_time);

  return (
    <div className="space-y-6 pb-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {ar ? "سجل حضوري" : "My Attendance"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {ar ? "سجل الحضور والانصراف والزيارات الميدانية" : "Attendance, check-in/out and field visits"}
        </p>
      </div>

      {/* Check-in Card */}
      <Card>
        <CardContent className="p-5">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">

              {/* Status Badge */}
              {statusInfo && (
                <div className="flex justify-center">
                  <Badge className={`${statusInfo.color} border-0 px-4 py-1 text-sm`}>
                    {ar ? statusInfo.label_ar : statusInfo.label_en}
                  </Badge>
                </div>
              )}

              {/* Times */}
              {(checkedIn || checkInTime) && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <LogIn className="w-3 h-3 text-emerald-600" />
                      <p className="text-xs text-muted-foreground">{ar ? "حضور" : "In"}</p>
                    </div>
                    <p className="font-bold font-mono text-emerald-700 text-lg">{checkInTime || "—"}</p>
                  </div>
                  <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <LogOut className="w-3 h-3 text-red-600" />
                      <p className="text-xs text-muted-foreground">{ar ? "انصراف" : "Out"}</p>
                    </div>
                    <p className="font-bold font-mono text-red-700 text-lg">{checkOutTime || "—"}</p>
                  </div>
                </div>
              )}

              {/* Address */}
              {checkInAddr && (
                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-2">
                  <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-brand-primary" />
                  <span className="line-clamp-2">{checkInAddr}</span>
                </div>
              )}

              {/* Buttons */}
              {renderButtons()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Visit Info */}
      {isField && hasActiveVisit && (
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Navigation className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-blue-800 text-sm">
                  {ar ? "زيارة نشطة" : "Active Visit"}
                </p>
                <p className="text-xs text-blue-700">
                  {activeVisit?.visit_type_display} — {activeVisit?.purpose}
                </p>
                {activeVisit?.arrival_time && (
                  <p className="text-xs text-blue-600 mt-0.5">
                    {ar ? "بدأت" : "Since"}: {activeVisit.arrival_time}
                    {activeVisit.duration_minutes ? ` (${fmtMins(activeVisit.duration_minutes, ar)})` : ""}
                  </p>
                )}
                {activeVisit?.arrival_address && (
                  <p className="text-xs text-blue-600 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {activeVisit.arrival_address}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Field Visits */}
      {isField && todayVisits.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-brand-primary" />
              {ar ? "زيارات اليوم" : "Today's Visits"}
            </h3>
            <div className="space-y-2">
              {todayVisits.map(v => (
                <div
                  key={v.id}
                  className={`p-3 rounded-lg border text-sm ${
                    v.is_active
                      ? "border-blue-500/30 bg-blue-500/5"
                      : "border-border bg-muted/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {v.is_active
                        ? <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      }
                      <span className="font-medium text-xs">{v.visit_type_display}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {v.arrival_time}{v.departure_time ? ` → ${v.departure_time}` : ""}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{v.purpose}</p>
                  {v.arrival_address && (
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="line-clamp-1">{v.arrival_address}</span>
                    </p>
                  )}
                  {v.duration_minutes != null && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ⏱️ {fmtMins(v.duration_minutes, ar)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: ar ? "إجمالي" : "Total",  value: att?.total_days ?? 0,  color: "text-brand-primary bg-brand-primary/10", icon: Calendar },
          { label: ar ? "حاضر"   : "Present", value: att?.present ?? 0,     color: "text-emerald-700 bg-emerald-500/10",    icon: CheckCircle2 },
          { label: ar ? "متأخر"  : "Late",    value: att?.late ?? 0,        color: "text-amber-700 bg-amber-500/10",        icon: AlertTriangle },
          { label: ar ? "غائب"   : "Absent",  value: att?.absent ?? 0,      color: "text-red-700 bg-red-500/10",            icon: XCircle },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
              <p className="text-2xl font-bold">{loading ? "..." : s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Late + Work Hours */}
      {att && (att.total_late_minutes > 0 || att.total_work_hours > 0) && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-amber-500/5 border-amber-500/20">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{ar ? "إجمالي التأخير" : "Total Late"}</p>
              <p className="text-xl font-bold text-amber-700">{fmtMins(att.total_late_minutes, ar)}</p>
            </CardContent>
          </Card>
          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{ar ? "ساعات العمل" : "Work Hours"}</p>
              <p className="text-xl font-bold text-emerald-700">{att.total_work_hours.toFixed(1)} {ar ? "س" : "h"}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* History */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-brand-primary" />
          <h2 className="text-lg font-semibold">{ar ? "سجل الحضور" : "Attendance History"}</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : history.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Clock className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">{ar ? "لا يوجد سجلات" : "No records"}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {history.map((rec, i) => {
              const sc = STATUS_CONFIG[rec.status || ""] || STATUS_CONFIG.present;
              const Icon = sc.icon;
              return (
                <Card key={i} className="hover:shadow-md transition">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold text-sm">{rec.date_display || fmtDate(rec.date)}</span>
                      </div>
                      <Badge className={`${sc.color} border-0 gap-1 text-xs`}>
                        <Icon className="w-3 h-3" />{ar ? sc.label_ar : sc.label_en}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <div className="bg-emerald-500/5 rounded-lg p-2 text-center">
                        <p className="text-xs text-muted-foreground">{ar ? "حضور" : "In"}</p>
                        <p className="font-bold font-mono text-emerald-700 text-sm">{rec.check_in_time || "—"}</p>
                      </div>
                      <div className="bg-red-500/5 rounded-lg p-2 text-center">
                        <p className="text-xs text-muted-foreground">{ar ? "انصراف" : "Out"}</p>
                        <p className="font-bold font-mono text-red-700 text-sm">{rec.check_out_time || "—"}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {rec.late_minutes && rec.late_minutes > 0 && (
                        <span className="text-amber-700 font-semibold">⏰ {fmtMins(rec.late_minutes, ar)}</span>
                      )}
                      {rec.work_hours && rec.work_hours > 0 && (
                        <span>🕐 {Number(rec.work_hours).toFixed(1)}{ar ? "س" : "h"}</span>
                      )}
                    </div>
                    {rec.check_in_address && (
                      <div className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-brand-primary" />
                        <span className="line-clamp-1">{rec.check_in_address}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ══ Start Visit Dialog ══ */}
      <Dialog open={showVisitDialog} onOpenChange={v => !v && setShowVisitDialog(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-blue-600" />
              {ar ? "بدء زيارة ميدانية" : "Start Field Visit"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">

            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              {ar
                ? "سيتم تسجيل موقعك الحالي تلقائياً عند بدء الزيارة"
                : "Your current GPS location will be recorded automatically"}
            </p>

            {/* Visit Type */}
            <div>
              <label className="text-sm font-medium mb-1 block">{ar ? "نوع الزيارة" : "Visit Type"}</label>
              <select
                value={visitForm.visit_type}
                onChange={e => setVisitForm(p => ({ ...p, visit_type: e.target.value }))}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
              >
                {visitTypes.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Purpose */}
            <div>
              <label className="text-sm font-medium mb-1 block">{ar ? "الغرض من الزيارة *" : "Purpose *"}</label>
              <Input
                value={visitForm.purpose}
                onChange={e => setVisitForm(p => ({ ...p, purpose: e.target.value }))}
                placeholder={ar ? "مثال: شراء خامات / متابعة مشروع" : "e.g. Buy materials / Follow up project"}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleStartVisit}
                disabled={startingVisit}
                className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2"
              >
                {startingVisit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {ar ? "بدء الزيارة" : "Start Visit"}
              </Button>
              <Button variant="outline" onClick={() => setShowVisitDialog(false)} className="flex-1">
                {ar ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
