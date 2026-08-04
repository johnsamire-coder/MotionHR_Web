"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Clock, MapPin, LogIn, LogOut, Pause, Play,
  Calendar, FileText, Briefcase, ChevronRight,
  Loader2, Building2, User, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/stores/auth";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface AttStatus {
  success: boolean;
  date: string;
  checked_in: boolean;
  checked_out: boolean;
  check_in_time?: string;
  check_out_time?: string;
  shift_name?: string;
  shift_start?: string;
  shift_end?: string;
  shift_mode?: string;
  worker_type?: string;
  can_check_out?: boolean;
  allow_partial_checkout?: boolean;
  can_partial_checkout?: boolean;
  can_resume?: boolean;
  has_open_session?: boolean;
  sessions_today?: number;
  remaining_seconds?: number;
}

interface ShiftData {
  success: boolean;
  has_shift: boolean;
  today_shift?: {
    name: string;
    start_time: string;
    end_time: string;
    work_hours: number;
    shift_type: string;
    work_days: string[];
    grace_period: number;
  };
}

const WORKER_TYPE_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  office:         { ar: "مكتبي",        en: "Office",         color: "bg-blue-500/10 text-blue-700" },
  field_free:     { ar: "ميداني حر",    en: "Field (Free)",   color: "bg-emerald-500/10 text-emerald-700" },
  field_assigned: { ar: "ميداني محدد",  en: "Field (Assigned)",color: "bg-purple-500/10 text-purple-700" },
};

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";

  const [status, setStatus]   = useState<AttStatus | null>(null);
  const [shift, setShift]     = useState<ShiftData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;
  const langHeader = ar ? "ar" : "en";

  // ── Clock ──────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Load Status + Shift ────────────────────────────────
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
      toast.error(ar ? "فشل تحميل البيانات" : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [token, ar]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Check In/Out ───────────────────────────────────────
  const handleAttendance = async (action: "check_in" | "check_out") => {
    setChecking(true);
    try {
      // نجيب الموقع
      let lat = 30.0444, lng = 31.2357;
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch { /* استخدم الموقع الافتراضي */ }

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

  // ── Partial Checkout ───────────────────────────────────
  const handlePartialCheckout = async () => {
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

      const res = await fetch("/api/employee/partial-checkout", {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        toast.success(ar ? "تم تسجيل خروج مؤقت ✅" : "Partial checkout done ✅");
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

  // ── Resume ─────────────────────────────────────────────
  const handleResume = async () => {
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

      const res = await fetch("/api/employee/resume-checkin", {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        toast.success(ar ? "تم استئناف العمل ✅" : "Resumed ✅");
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

  const workerTypeInfo = WORKER_TYPE_LABELS[status?.worker_type || "office"];
  const todayShift = shift?.today_shift;

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString(ar ? "ar-EG" : "en-US", {
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });

  const fmtDate = (d: Date) =>
    d.toLocaleDateString(ar ? "ar-EG" : "en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

  // ── Render Attendance Button ───────────────────────────
  const renderAttBtn = () => {
    if (!status) return null;
    const { checked_in, checked_out, can_check_out, can_resume, can_partial_checkout, allow_partial_checkout } = status;

    if (!checked_in) {
      return (
        <Button
          onClick={() => handleAttendance("check_in")}
          disabled={checking}
          className="w-full h-16 text-lg gap-3 bg-emerald-600 hover:bg-emerald-700"
        >
          {checking ? <Loader2 className="w-6 h-6 animate-spin" /> : <LogIn className="w-6 h-6" />}
          {ar ? "تسجيل الحضور" : "Check In"}
        </Button>
      );
    }

    if (checked_in && !checked_out && can_check_out) {
      return (
        <div className="space-y-2">
          <Button
            onClick={() => handleAttendance("check_out")}
            disabled={checking}
            className="w-full h-14 text-base gap-3 bg-red-600 hover:bg-red-700"
          >
            {checking ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
            {ar ? "تسجيل الانصراف" : "Check Out"}
          </Button>
          {(allow_partial_checkout || can_partial_checkout) && (
            <Button
              onClick={handlePartialCheckout}
              disabled={checking}
              variant="outline"
              className="w-full h-12 gap-2 border-amber-500 text-amber-700 hover:bg-amber-50"
            >
              <Pause className="w-4 h-4" />
              {ar ? "خروج مؤقت" : "Partial Checkout"}
            </Button>
          )}
        </div>
      );
    }

    if (can_resume) {
      return (
        <Button
          onClick={handleResume}
          disabled={checking}
          className="w-full h-14 gap-3 bg-blue-600 hover:bg-blue-700"
        >
          {checking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
          {ar ? "استئناف العمل" : "Resume Check-in"}
        </Button>
      );
    }

    if (checked_in && checked_out) {
      return (
        <div className="w-full h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-emerald-700 font-semibold">
            {ar ? "اكتمل دوام اليوم ✅" : "Shift Complete ✅"}
          </span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6 pb-6">

      {/* Header */}
      <div className="bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/70 text-sm">{fmtDate(currentTime)}</p>
            <p className="text-4xl font-bold font-mono mt-1 tracking-wider">
              {fmtTime(currentTime)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-xs">{ar ? "مرحباً" : "Welcome"}</p>
            <p className="font-semibold">{user?.first_name || user?.username}</p>
            {workerTypeInfo && (
              <Badge className={`mt-1 text-[10px] border-0 ${workerTypeInfo.color}`}>
                {ar ? workerTypeInfo.ar : workerTypeInfo.en}
              </Badge>
            )}
          </div>
        </div>

        {/* Shift Info */}
        {todayShift && (
          <div className="bg-white/10 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-white/70" />
              <span className="text-sm">{todayShift.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm" dir="ltr">
              <span className="font-mono font-semibold">{todayShift.start_time}</span>
              <span className="text-white/50">→</span>
              <span className="font-mono font-semibold">{todayShift.end_time}</span>
            </div>
          </div>
        )}
      </div>

      {/* Check In/Out Card */}
      <Card>
        <CardContent className="p-5">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status Row */}
              {status && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      {ar ? "وقت الحضور" : "Check-in"}
                    </p>
                    <p className="font-bold font-mono text-emerald-700">
                      {status.check_in_time || "—"}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      {ar ? "وقت الانصراف" : "Check-out"}
                    </p>
                    <p className="font-bold font-mono text-red-700">
                      {status.check_out_time || "—"}
                    </p>
                  </div>
                </div>
              )}
              {renderAttBtn()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Calendar,  label: ar ? "إجازاتي"   : "My Leaves",    href: "/employee/leaves",      color: "text-emerald-600 bg-emerald-500/10" },
          { icon: FileText,  label: ar ? "طلباتي"    : "My Requests",  href: "/employee/requests",    color: "text-purple-600 bg-purple-500/10" },
          { icon: Briefcase, label: ar ? "مهماتي"    : "My Missions",  href: "/employee/missions",    color: "text-brand-primary bg-brand-primary/10" },
          { icon: Clock,     label: ar ? "حضوري"     : "Attendance",   href: "/employee/attendance",  color: "text-amber-600 bg-amber-500/10" },
        ].map((item, i) => (
          <Card
            key={i}
            onClick={() => router.push(item.href)}
            className="cursor-pointer hover:shadow-md transition hover:-translate-y-0.5"
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{item.label}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
