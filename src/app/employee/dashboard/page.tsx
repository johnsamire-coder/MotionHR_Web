"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Clock, Calendar, FileText, Briefcase, Wallet, User,
  LogIn, LogOut, TrendingUp, Loader2, ChevronRight, Activity,
  CheckCircle2, Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/stores/auth";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface AttendanceStatus {
  checked_in?: boolean;
  check_in_time?: string;
  check_out_time?: string;
  work_hours?: number;
  shift_name?: string;
  shift_start?: string;
  shift_end?: string;
}

interface EmployeeSummary {
  leave_balances?: {
    annual?: { remaining: number };
    sick?: { remaining: number };
    emergency?: { remaining: number };
  };
  upcoming_leaves?: Array<{ id: number; from: string; to: string; type: string }>;
  upcoming_missions?: Array<{ id: number; title: string; date: string }>;
}

function QuickAction({
  title, description, href, icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition group text-start"
    >
      <div className="w-10 h-10 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-brand-primary" />
    </button>
  );
}

function BalanceCard({
  label, remaining, color, icon: Icon,
}: {
  label: string;
  remaining: number;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="p-4 rounded-xl border border-border/50 hover:shadow-md transition">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-2xl font-bold">{remaining}</p>
    </div>
  );
}

export default function EmployeeDashboardPage() {
  const { user } = useAuthStore();
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const [status, setStatus] = useState<AttendanceStatus | null>(null);
  const [summary, setSummary] = useState<EmployeeSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEYS.token)
      : null;
    if (!token) return;
    const authHeader = token.startsWith("Token") ? token : `Token ${token}`;

    Promise.all([
      fetch("/api/employee/attendance-status", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/employee/summary", { headers: { Authorization: authHeader } }).then(r => r.json()),
    ]).then(([statusData, summaryData]) => {
      setStatus(statusData);
      setSummary(summaryData);
    })
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = () => {
    return new Date().toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  };

  const formatTime = (time?: string) => {
    if (!time) return "—";
    return time.substring(0, 5);
  };

  const isCheckedIn = status?.checked_in && status?.check_in_time && !status?.check_out_time;

  const [actionLoading, setActionLoading] = useState(false);

  const handleCheckInOut = async (action: "check_in" | "check_out") => {
    const token = typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEYS.token) : null;
    if (!token) return;
    const authHeader = token.startsWith("Token") ? token : `Token ${token}`;

    setActionLoading(true);
    try {
      // نجيب الموقع الجغرافي
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
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message_ar || data.message || (action === "check_in" ? "تم تسجيل الحضور" : "تم تسجيل الانصراف"));
        // نحدث الـ status
        const statusRes = await fetch("/api/employee/attendance-status", {
          headers: { Authorization: authHeader },
        });
        setStatus(await statusRes.json());
      } else {
        toast.error(data.message_ar || data.message || (lang === "ar" ? "فشل العملية" : "Operation failed"));
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e?.message || (lang === "ar" ? "خطأ في تسجيل الحضور" : "Check-in error"));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {d.empDashboardWelcome}، {user?.first_name} 👋
          </h1>
          <p className="text-muted-foreground mt-1">{d.empDashboardDesc}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          <Building2 className="w-4 h-4" />
          <span>{formatDate()}</span>
        </div>
      </div>

      {/* Check-in Status Card */}
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
                {isCheckedIn && status?.check_in_time && (
                  <p className="text-sm text-emerald-700 mt-1" dir="ltr">
                    {d.checkIn}: {formatTime(status.check_in_time)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {!isCheckedIn ? (
                <Button onClick={() => handleCheckInOut("check_in")} disabled={actionLoading} className="bg-brand-primary hover:bg-brand-primary/90 gap-2 h-12 px-6">
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                  {d.checkInNow}
                </Button>
              ) : (
                <Button onClick={() => handleCheckInOut("check_out")} disabled={actionLoading} variant="outline" className="border-red-500/20 text-red-700 hover:bg-red-50 gap-2 h-12 px-6">
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
                  {d.checkOutNow}
                </Button>
              )}
            </div>
          </div>

          {/* Shift Info */}
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

      {/* Leave Balances */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-brand-primary" />
            <h2 className="text-lg font-semibold">{d.myBalances}</h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <BalanceCard
                label={d.annualBalance}
                remaining={summary?.leave_balances?.annual?.remaining || 21}
                color="bg-emerald-500/10 text-emerald-600"
                icon={Calendar}
              />
              <BalanceCard
                label={d.sickBalance}
                remaining={summary?.leave_balances?.sick?.remaining || 14}
                color="bg-red-500/10 text-red-600"
                icon={Calendar}
              />
              <BalanceCard
                label={d.emergencyBalance}
                remaining={summary?.leave_balances?.emergency?.remaining || 7}
                color="bg-amber-500/10 text-amber-600"
                icon={Calendar}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-brand-primary" />
              <h2 className="text-lg font-semibold">{d.myUpcoming}</h2>
            </div>

            <div className="space-y-4">
              {/* Upcoming Leaves */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-cyan-600" />
                  <p className="text-sm font-medium">{d.upcomingLeaves}</p>
                </div>
                {summary?.upcoming_leaves && summary.upcoming_leaves.length > 0 ? (
                  <div className="space-y-2">
                    {summary.upcoming_leaves.slice(0, 3).map(lv => (
                      <div key={lv.id} className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-between">
                        <span className="text-sm font-medium">{lv.type}</span>
                        <span className="text-xs text-muted-foreground font-mono" dir="ltr">
                          {lv.from} → {lv.to}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    {d.noUpcomingLeaves}
                  </p>
                )}
              </div>

              {/* Upcoming Missions */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-4 h-4 text-purple-600" />
                  <p className="text-sm font-medium">{d.upcomingMissions}</p>
                </div>
                {summary?.upcoming_missions && summary.upcoming_missions.length > 0 ? (
                  <div className="space-y-2">
                    {summary.upcoming_missions.slice(0, 3).map(m => (
                      <div key={m.id} className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20 flex items-center justify-between">
                        <span className="text-sm font-medium">{m.title}</span>
                        <span className="text-xs text-muted-foreground font-mono" dir="ltr">
                          {m.date}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    {d.noUpcomingMissions}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">{d.quickActionsEmp}</h3>
            <div className="space-y-2">
              <QuickAction
                title={d.requestLeave}
                description={d.myLeaves}
                href="/employee/leaves"
                icon={Calendar}
              />
              <QuickAction
                title={d.submitRequest}
                description={d.myRequests}
                href="/employee/requests"
                icon={FileText}
              />
              <QuickAction
                title={d.viewPayslipMy}
                description={d.myPayslip}
                href="/employee/payslip"
                icon={Wallet}
              />
              <QuickAction
                title={d.viewProfileMy}
                description={d.myProfile}
                href="/employee/profile"
                icon={User}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
