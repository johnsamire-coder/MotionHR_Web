"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Clock, Calendar, Loader2, TrendingUp,
  CheckCircle2, XCircle, LogIn, LogOut,
} from "lucide-react";
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
}

export default function MyAttendancePage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEYS.token)
      : null;
    if (!token) return;
    const authHeader = token.startsWith("Token") ? token : `Token ${token}`;

    fetch("/api/employee/attendance-history", { headers: { Authorization: authHeader } })
      .then(r => r.json())
      .then(data => setRecords(data?.items || []))
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
      weekday: "short", day: "numeric", month: "short",
    });
  };

  const formatTime = (time?: string) => {
    if (!time) return "—";
    return time.substring(0, 5);
  };

  const getStatusBadge = (status?: string) => {
    const map: Record<string, { label: string; color: string }> = {
      present: { label: d.statusPresent, color: "bg-emerald-500/10 text-emerald-700" },
      late: { label: d.statusLate, color: "bg-amber-500/10 text-amber-700" },
      absent: { label: d.statusAbsent, color: "bg-red-500/10 text-red-700" },
    };
    const info = map[status || ""] || { label: "—", color: "bg-gray-500/10 text-gray-700" };
    return <Badge className={`${info.color} border-0`}>{info.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{d.myAttendance}</h1>
        <p className="text-muted-foreground mt-1">{d.attendanceDesc}</p>
      </div>

      <Card>
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
