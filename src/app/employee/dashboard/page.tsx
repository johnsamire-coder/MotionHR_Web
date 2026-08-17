"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Clock, LogIn, LogOut, Pause, Play,
  Calendar, FileText, Briefcase, ChevronRight,
  Loader2, MapPin, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/stores/auth";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

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
    check_out_address?: string;
    status?: string;
  };
}

interface ShiftData {
  success: boolean;
  has_shift: boolean;
  today_shift?: {
    name: string;
    start_time: string;
    end_time: string;
    work_hours: number;
  };
}

const WORKER_TYPE_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  office:         { ar: "مكتبي",       en: "Office",          color: "bg-blue-500/10 text-blue-700" },
  field_free:     { ar: "ميداني حر",   en: "Field (Free)",    color: "bg-emerald-500/10 text-emerald-700" },
  field_assigned: { ar: "ميداني محدد", en: "Field (Assigned)", color: "bg-purple-500/10 text-purple-700" },
};

const STATUS_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  present: { ar: "حاضر",   en: "Present", color: "text-emerald-700 bg-emerald-500/10" },
  late:    { ar: "متأخر",  en: "Late",    color: "text-amber-700 bg-amber-500/10" },
  absent:  { ar: "غائب",   en: "Absent",  color: "text-red-700 bg-red-500/10" },
};

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const { user, employee } = useAuthStore();
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";

  const [status, setStatus]     = useState<AttStatus | null>(null);
  const [shift, setShift]       = useState<ShiftData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [checking, setChecking] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;
  const langHeader = ar ? "ar" : "en";

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const [sRes, shRes] = await Promise.all([
        fetch("/api/employee/status", {
          headers: { Authorization: authHeader, "Accept-Language": langHeader },
        }),
        fetch("/api/employee/my-shift", {
          headers: { Authorization: authHeader, "Accept-Language": langHeader },
        }),
      ]);
      const [sData, shData] = await Promise.all([sRes.json(), shRes.json()]);
      if (sData.success !== false) setStatus(sData);
      if (shData.success !== false) setShift(shData);
    } catch {
      toast.error(ar ? "فشل تحميل البيانات" : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token, ar]);

  useEffect(() => { loadData(); }, [loadData]);

  const doAttendance = async (action: "check_in" | "check_out") => {
    setChecking(true);
    try {
      let lat = 30.0444, lng = 31.2357;
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch { }

      const res = await fetch("/api/employee/attendance", {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
          "Accept-Language": langHeader,
        },
        body: JSON.stringify({ action, latitude: lat, longitude: lng }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        toast.success(
          action === "check_in"
            ? (ar ? "تم تسجيل الحضور ✅" : "Checked in ✅")
            : (ar ? "تم تسجيل الانصراف ✅" : "Checked out ✅")
        );
        await loadData();
      } else {
        toast.error(data.message || data.error || (ar ? "فشل" : "Failed"));
      }
    } catch {
      toast.error(ar ? "خطأ في الشبكة" : "Network error");
    } finally {
      setChecking(false);
    }
  };

  const doPartialCheckout = async () => {
    setChecking(true);
    try {
      let lat = 30.0444, lng = 31.2357;
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        );
        lat = pos.coords.latitude; lng = pos.coords.longitude;
      } catch { }
      const res = await fetch("/api/employee/partial-checkout", {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        toast.success(ar ? "تم تسجيل خروج مؤقت ✅" : "Partial checkout ✅");
        await loadData();
      } else {
        toast.error(data.message || (ar ? "فشل" : "Failed"));
      }
    } catch {
      toast.error(ar ? "خطأ" : "Error");
    } finally {
      setChecking(false);
    }
  };

  const doResume = async () => {
    setChecking(true);
    try {
      let lat = 30.0444, lng = 31.2357;
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        );
        lat = pos.coords.latitude; lng = pos.coords.longitude;
      } catch { }
      const res = await fetch("/api/employee/resume-checkin", {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        toast.success(ar ? "تم استئناف العمل ✅" : "Resumed ✅");
        await loadData();
      } else {
        toast.error(data.message || (ar ? "فشل" : "Failed"));
      }
    } catch { toast.error(ar ? "خطأ" : "Error"); }
    finally { setChecking(false); }
  };

  // ── القيم الصحيحة من status ─────────────────────────────
  // الـ API بيحط البيانات في status.today
  const today = status?.today;
  const checkedIn  = today?.checked_in  ?? status?.checked_in  ?? false;
  const checkedOut = today?.checked_out ?? status?.checked_out ?? false;
  const checkInTime  = today?.check_in_time  ?? status?.check_in_time;
  const checkOutTime = today?.check_out_time ?? status?.check_out_time;
  const checkInAddr  = today?.check_in_address;
  const todayStatus  = today?.status;
  const canCheckOut  = status?.can_check_out ?? false;
  const canResume    = status?.can_resume ?? false;
  const allowPartial = status?.allow_partial_checkout || status?.can_partial_checkout;
  const workerType   = status?.worker_type || "office";
  const todayShift   = shift?.today_shift;
  const workerInfo   = WORKER_TYPE_LABELS[workerType];
  const statusInfo   = STATUS_LABELS[todayStatus || ""] || null;

  // ── Render Button ─────────────────────────────────────────
  const renderBtn = () => {
    if (!status) return null;

    // حالة: الشيفت اكتمل
    if (checkedIn && checkedOut) {
      return (
        <div className="w-full py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30
                        flex items-center justify-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span className="text-emerald-700 font-semibold">
            {ar ? "اكتمل دوام اليوم ✅" : "Shift Complete ✅"}
          </span>
        </div>
      );
    }

    // حالة: استئناف
    if (canResume) {
      return (
        <Button onClick={doResume} disabled={checking}
          className="w-full h-14 gap-3 bg-blue-600 hover:bg-blue-700">
          {checking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
          {ar ? "استئناف العمل" : "Resume"}
        </Button>
      );
    }

    // حالة: مسجل حضور ولسه في الشيفت
    if (checkedIn && !checkedOut && canCheckOut) {
      return (
        <div className="space-y-2">
          <Button onClick={() => doAttendance("check_out")} disabled={checking}
            className="w-full h-14 gap-3 bg-red-600 hover:bg-red-700">
            {checking ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
            {ar ? "تسجيل الانصراف" : "Check Out"}
          </Button>
          {allowPartial && (
            <Button onClick={doPartialCheckout} disabled={checking} variant="outline"
              className="w-full h-11 gap-2 border-amber-500 text-amber-700 hover:bg-amber-50">
              <Pause className="w-4 h-4" />
              {ar ? "خروج مؤقت" : "Partial Checkout"}
            </Button>
          )}
        </div>
      );
    }

    // حالة: لم يسجل حضور
    if (!checkedIn) {
      return (
        <Button onClick={() => doAttendance("check_in")} disabled={checking}
          className="w-full h-16 text-lg gap-3 bg-emerald-600 hover:bg-emerald-700">
          {checking ? <Loader2 className="w-6 h-6 animate-spin" /> : <LogIn className="w-6 h-6" />}
          {ar ? "تسجيل الحضور" : "Check In"}
        </Button>
      );
    }

    return null;
  };

  const fmtClock = (d: Date) =>
    d.toLocaleTimeString(ar ? "ar-EG" : "en-US", {
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });

  const fmtDate = (d: Date) =>
    d.toLocaleDateString(ar ? "ar-EG" : "en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

  return (
    <div className="space-y-5 pb-6">

      {/* Header gradient */}
      <div className="bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/70 text-sm">{fmtDate(currentTime)}</p>
            <p className="text-4xl font-bold font-mono mt-1 tracking-widest">
              {fmtClock(currentTime)}
            </p>
          </div>
          <div className="text-end">
            <p className="text-white/70 text-xs">{ar ? "مرحباً" : "Welcome"}</p>
            <p className="font-semibold text-sm">{user?.first_name || user?.username}</p>
            {employee?.job_title && (
              <p className="text-white/80 text-xs mt-0.5">{employee.job_title}</p>
            )}
            <Badge className={`mt-1 text-[10px] border-0 ${workerInfo?.color || ""}`}>
              {ar ? workerInfo?.ar : workerInfo?.en}
            </Badge>
          </div>
        </div>

        {/* Shift bar */}
        {todayShift && (
          <div className="bg-white/10 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-white/70" />
                <span className="text-sm font-medium">{todayShift.name}</span>
              </div>
              <div dir="ltr" className="flex items-center gap-1 text-sm font-mono font-semibold">
                <span>{todayShift.start_time}</span>
                <span className="text-white/50 mx-1">→</span>
                <span>{todayShift.end_time}</span>
              </div>
            </div>
          </div>
        )}
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

              {/* Today Status Badge */}
              {statusInfo && (
                <div className="flex justify-center">
                  <Badge className={`${statusInfo.color} border-0 px-4 py-1 text-sm`}>
                    {ar ? statusInfo.ar : statusInfo.en}
                  </Badge>
                </div>
              )}

              {/* Times Grid */}
              {(checkedIn || checkInTime) && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <LogIn className="w-3 h-3 text-emerald-600" />
                      <p className="text-xs text-muted-foreground">
                        {ar ? "وقت الحضور" : "Check-in"}
                      </p>
                    </div>
                    <p className="font-bold font-mono text-emerald-700 text-lg">
                      {checkInTime || "—"}
                    </p>
                  </div>
                  <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <LogOut className="w-3 h-3 text-red-600" />
                      <p className="text-xs text-muted-foreground">
                        {ar ? "وقت الانصراف" : "Check-out"}
                      </p>
                    </div>
                    <p className="font-bold font-mono text-red-700 text-lg">
                      {checkOutTime || "—"}
                    </p>
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

              {/* Action Button */}
              {renderBtn()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Nav */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Calendar,  label: ar ? "إجازاتي"  : "My Leaves",   href: "/employee/leaves",       color: "text-emerald-600 bg-emerald-500/10" },
          { icon: FileText,  label: ar ? "طلباتي"   : "My Requests", href: "/employee/requests",     color: "text-purple-600 bg-purple-500/10" },
          { icon: Briefcase, label: ar ? "مهماتي"   : "My Missions", href: "/employee/missions",     color: "text-brand-primary bg-brand-primary/10" },
          { icon: Clock,     label: ar ? "حضوري"    : "Attendance",  href: "/employee/attendance",   color: "text-amber-600 bg-amber-500/10" },
        ].map((item, i) => (
          <Card key={i} onClick={() => router.push(item.href)}
            className="cursor-pointer hover:shadow-md transition hover:-translate-y-0.5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{item.label}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
