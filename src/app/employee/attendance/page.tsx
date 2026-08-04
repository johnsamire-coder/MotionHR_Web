"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Clock, Calendar, Loader2, LogIn, LogOut,
  CheckCircle2, XCircle, MapPin, TrendingUp,
  Coffee, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface AttendanceRecord {
  date: string;
  check_in?: string;
  check_out?: string;
  work_hours?: number;
  status?: string;
  late_minutes?: number;
  check_in_address?: string;
  check_out_address?: string;
}

interface AttendanceStatus {
  checked_in?: boolean;
  check_in_time?: string;
  check_out_time?: string;
  work_hours?: number;
  shift_name?: string;
  shift_start?: string;
  shift_end?: string;
  today?: {
    date?: string;
    status?: string;
    checked_in?: boolean;
    check_in_time?: string;
    check_in_address?: string;
    checked_out?: boolean;
    check_out_time?: string;
    check_out_address?: string;
  };
}

export default function MyAttendancePage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);

  const [status, setStatus] = useState<AttendanceStatus | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  const loadData = useCallback(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      fetch("/api/employee/attendance-status", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/employee/history", { headers: { Authorization: authHeader } }).then(r => r.json()),
    ]).then(([statusData, historyData]) => {
      setStatus(statusData);
      setRecords(historyData?.items || historyData?.records || []);
    })
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, [token, authHeader, d.failedLoad]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCheckInOut = async (action: "check_in" | "check_out") => {
    setActionLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation not supported"));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const res = await fetch("/api/employee/checkin", {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message_ar || data.message);
        loadData();
      } else {
        toast.error(data.message_ar || data.message);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e?.message || (lang === "ar" ? "خطأ" : "Error"));
    } finally {
      setActionLoading(false);
    }
  };

  const isCheckedIn = status?.today?.checked_in && !status?.today?.checked_out;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
      weekday: "short", day: "numeric", month: "short",
    });
  };

  const formatTime = (time?: string) => {
    if (!time) return "—";
    return time.length > 5 ? time.substring(0, 5) : time;
  };

  const getStatusBadge = (statusVal?: string) => {
    const map: Record<string, { label: string; color: string }> = {
      present: { label: d.statusPresent, color: "bg-emerald-500/10 text-emerald-700" },
      late: { label: d.statusLate, color: "bg-amber-500/10 text-amber-700" },
      absent: { label: d.statusAbsent, color: "bg-red-500/10 text-red-700" },
      on_leave: { label: d.statusOnLeaveAtt, color: "bg-blue-500/10 text-blue-700" },
    };
    const info = map[statusVal || ""] || { label: "—", color: "bg-gray-500/10 text-gray-700" };
    return <Badge className={`${info.color} border-0`}>{info.label}</Badge>;
  };

  // Stats calculations
  const totalRecords = records.length;
  const presentDays = records.filter(r => r.status === "present" || r.status === "late").length;
  const lateDays = records.filter(r => r.status === "late").length;
  const absentDays = records.filter(r => r.status === "absent").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{d.myAttendance}</h1>
        <p className="text-muted-foreground mt-1">
          {lang === "ar" ? "سجل الحضور والانصراف الخاص بك" : "Your attendance and check-in/out records"}
        </p>
      </div>

      {/* Check-in Card */}
      <Card className={`border-0 ${isCheckedIn ? "bg-gradient-to-br from-emerald-500/10 to-emerald-500/5" : "bg-gradient-to-br from-brand-primary/10 to-brand-primary/5"}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                isCheckedIn ? "bg-emerald-500/20" : "bg-brand-primary/20"
              }`}>
                {isCheckedIn ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                ) : (
                  <Clock className="w-8 h-8 text-brand-primary" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{d.checkInStatus}</p>
                <p className="text-2xl font-bold">
                  {isCheckedIn ? d.checkedIn : d.notCheckedIn}
                </p>
                {status?.today?.check_in_time && (
                  <p className="text-sm text-emerald-700 mt-1 flex items-center gap-1">
                    <LogIn className="w-3 h-3" />
                    {d.checkIn}: {status.today.check_in_time}
                    {status.today.check_out_time && (
                      <>
                        <span className="mx-2">•</span>
                        <LogOut className="w-3 h-3" />
                        {d.checkOut}: {status.today.check_out_time}
                      </>
                    )}
                  </p>
                )}
                {status?.today?.check_in_address && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {status.today.check_in_address}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {!isCheckedIn && !status?.today?.checked_out && (
                <Button
                  onClick={() => handleCheckInOut("check_in")}
                  disabled={actionLoading}
                  className="bg-brand-primary hover:bg-brand-primary/90 gap-2 h-12 px-6"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                  {d.checkInNow}
                </Button>
              )}
              {isCheckedIn && (
                <Button
                  onClick={() => handleCheckInOut("check_out")}
                  disabled={actionLoading}
                  variant="outline"
                  className="border-red-500/20 text-red-700 hover:bg-red-50 gap-2 h-12 px-6"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
                  {d.checkOutNow}
                </Button>
              )}
            </div>
          </div>

          {status?.shift_name && (
            <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
              <div>
                <p className="text-xs text-muted-foreground">{d.myShift}</p>
                <p className="font-semibold text-sm mt-1">{status.shift_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{d.shiftStart}</p>
                <p className="font-mono font-semibold text-sm mt-1" dir="ltr">
                  {formatTime(status.shift_start)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{d.shiftEnd}</p>
                <p className="font-mono font-semibold text-sm mt-1" dir="ltr">
                  {formatTime(status.shift_end)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {lang === "ar" ? "إجمالي الأيام" : "Total Days"}
                </p>
                <p className="text-xl font-bold">{totalRecords}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{d.statusPresent}</p>
                <p className="text-xl font-bold">{presentDays}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{d.statusLate}</p>
                <p className="text-xl font-bold">{lateDays}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{d.statusAbsent}</p>
                <p className="text-xl font-bold">{absentDays}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card>
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-primary" />
            <h2 className="text-lg font-semibold">
              {lang === "ar" ? "سجل الحضور" : "Attendance History"}
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : records.length === 0 ? (
          <CardContent className="py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 mx-auto">
              <Clock className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="font-medium">{d.noAttendanceData}</p>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.requestDate}</TableHead>
                <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.checkIn}</TableHead>
                <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.checkOut}</TableHead>
                <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.workHours}</TableHead>
                <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.lateMinutesCol}</TableHead>
                <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.colStatus}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((rec, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{formatDate(rec.date)}</TableCell>
                  <TableCell className="font-mono" dir="ltr">{formatTime(rec.check_in)}</TableCell>
                  <TableCell className="font-mono" dir="ltr">{formatTime(rec.check_out)}</TableCell>
                  <TableCell className="font-mono">{rec.work_hours?.toFixed(1) || "—"}</TableCell>
                  <TableCell>
                    {rec.late_minutes ? (
                      <span className="text-amber-600 font-mono">{rec.late_minutes}</span>
                    ) : "—"}
                  </TableCell>
                  <TableCell>{getStatusBadge(rec.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
