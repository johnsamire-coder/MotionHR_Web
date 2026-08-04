"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Clock, Calendar, Loader2, LogIn, LogOut,
  CheckCircle2, XCircle, MapPin, TrendingUp, AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface HistoryItem {
  date: string;
  date_display?: string;
  status?: string;
  checked_in?: boolean;
  checked_out?: boolean;
  check_in_time?: string;
  check_out_time?: string;
  check_in_address?: string;
  check_out_address?: string;
  late_minutes?: number;
  work_hours?: number;
  early_leave_minutes?: number;
  overtime_hours?: number;
}

interface SummaryData {
  month?: string;
  attendance?: {
    total_days: number;
    present: number;
    late: number;
    absent: number;
    total_late_minutes: number;
    total_work_hours: number;
  };
}

const STATUS_CONFIG: Record<string, {
  label_ar: string; label_en: string; color: string; icon: React.ComponentType<{ className?: string }>
}> = {
  present: { label_ar: "حاضر",  label_en: "Present", color: "bg-emerald-500/10 text-emerald-700", icon: CheckCircle2 },
  late:    { label_ar: "متأخر", label_en: "Late",    color: "bg-amber-500/10 text-amber-700",    icon: AlertTriangle },
  absent:  { label_ar: "غائب",  label_en: "Absent",  color: "bg-red-500/10 text-red-700",        icon: XCircle },
  on_leave:{ label_ar: "إجازة", label_en: "Leave",   color: "bg-blue-500/10 text-blue-700",      icon: Calendar },
};

export default function MyAttendancePage() {
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";

  const [history, setHistory]   = useState<HistoryItem[]>([]);
  const [summary, setSummary]   = useState<SummaryData | null>(null);
  const [loading, setLoading]   = useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;
  const langHeader = ar ? "ar" : "en";

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [hRes, sRes] = await Promise.all([
        fetch("/api/employee/history", {
          headers: { Authorization: authHeader, "Accept-Language": langHeader },
        }),
        fetch("/api/employee/summary", {
          headers: { Authorization: authHeader, "Accept-Language": langHeader },
        }),
      ]);
      const [hData, sData] = await Promise.all([hRes.json(), sRes.json()]);
      setHistory(hData?.items || []);
      setSummary(sData);
    } catch {
      toast.error(ar ? "فشل تحميل البيانات" : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token, ar]);

  useEffect(() => { load(); }, [load]);

  const att = summary?.attendance;

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString(ar ? "ar-EG" : "en-US", {
      weekday: "short", day: "numeric", month: "short",
    });

  const fmtMins = (m?: number) => {
    if (!m || m === 0) return "—";
    const h = Math.floor(m / 60);
    const min = m % 60;
    if (h > 0) return ar ? `${h}س ${min}د` : `${h}h ${min}m`;
    return ar ? `${min}د` : `${min}m`;
  };

  return (
    <div className="space-y-6 pb-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {ar ? "سجل حضوري" : "My Attendance"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {ar ? "سجل الحضور والانصراف الخاص بك" : "Your check-in and check-out records"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: ar ? "إجمالي الأيام" : "Total Days",   value: att?.total_days ?? 0,   color: "text-brand-primary bg-brand-primary/10",  icon: Calendar },
          { label: ar ? "حاضر"          : "Present",       value: att?.present ?? 0,       color: "text-emerald-700 bg-emerald-500/10",       icon: CheckCircle2 },
          { label: ar ? "متأخر"         : "Late",          value: att?.late ?? 0,           color: "text-amber-700 bg-amber-500/10",           icon: AlertTriangle },
          { label: ar ? "غائب"          : "Absent",        value: att?.absent ?? 0,         color: "text-red-700 bg-red-500/10",               icon: XCircle },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
              <p className="text-2xl font-bold">
                {loading ? "..." : s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary extras */}
      {att && (att.total_late_minutes > 0 || att.total_work_hours > 0) && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-amber-500/5 border-amber-500/20">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">
                {ar ? "إجمالي التأخير هذا الشهر" : "Total Late This Month"}
              </p>
              <p className="text-xl font-bold text-amber-700">
                {fmtMins(att.total_late_minutes)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">
                {ar ? "إجمالي ساعات العمل" : "Total Work Hours"}
              </p>
              <p className="text-xl font-bold text-emerald-700">
                {att.total_work_hours.toFixed(1)} {ar ? "س" : "h"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* History */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-brand-primary" />
          <h2 className="text-lg font-semibold">
            {ar ? "سجل الحضور" : "Attendance History"}
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : history.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Clock className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {ar ? "لا يوجد سجلات حضور" : "No attendance records"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {history.map((rec, i) => {
              const sc = STATUS_CONFIG[rec.status || ""] || STATUS_CONFIG.present;
              const Icon = sc.icon;
              return (
                <Card key={i} className="hover:shadow-md transition">
                  <CardContent className="p-5">
                    {/* Date + Status */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold">
                          {rec.date_display || fmtDate(rec.date)}
                        </span>
                      </div>
                      <Badge className={`${sc.color} border-0 gap-1 text-xs`}>
                        <Icon className="w-3 h-3" />
                        {ar ? sc.label_ar : sc.label_en}
                      </Badge>
                    </div>

                    {/* Times */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-emerald-500/5 rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <LogIn className="w-3 h-3 text-emerald-600" />
                          <p className="text-xs text-muted-foreground">
                            {ar ? "حضور" : "Check-in"}
                          </p>
                        </div>
                        <p className="font-bold font-mono text-emerald-700">
                          {rec.check_in_time || "—"}
                        </p>
                      </div>
                      <div className="bg-red-500/5 rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <LogOut className="w-3 h-3 text-red-600" />
                          <p className="text-xs text-muted-foreground">
                            {ar ? "انصراف" : "Check-out"}
                          </p>
                        </div>
                        <p className="font-bold font-mono text-red-700">
                          {rec.check_out_time || "—"}
                        </p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {rec.late_minutes && rec.late_minutes > 0 ? (
                        <span className="text-amber-700 font-semibold">
                          ⏰ {ar ? "تأخير" : "Late"}: {fmtMins(rec.late_minutes)}
                        </span>
                      ) : null}
                      {rec.work_hours && rec.work_hours > 0 ? (
                        <span>
                          🕐 {ar ? "ساعات العمل" : "Work"}: {Number(rec.work_hours).toFixed(1)}{ar ? "س" : "h"}
                        </span>
                      ) : null}
                      {rec.overtime_hours && rec.overtime_hours > 0 ? (
                        <span className="text-emerald-700">
                          ⚡ {ar ? "إضافي" : "OT"}: {Number(rec.overtime_hours).toFixed(1)}{ar ? "س" : "h"}
                        </span>
                      ) : null}
                    </div>

                    {/* Address */}
                    {rec.check_in_address && (
                      <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
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
    </div>
  );
}
