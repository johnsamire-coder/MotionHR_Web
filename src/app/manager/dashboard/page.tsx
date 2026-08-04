"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users, UserCheck, UserX, Clock, Briefcase, FileText,
  Building2, MapPin, ChevronRight, Activity, TrendingUp,
  AlertCircle, CheckCircle2, Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/stores/auth";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface DashboardStats {
  today: string;
  team_size: number;
  present_today: number;
  absent_today: number;
  late_today: number;
  pending_requests: number;
  active_missions: number;
}

interface PendingItem {
  id: number;
  employee_name?: string;
  type?: string;
  request_type?: string;
  submitted_at?: string;
}

function StatCard({
  icon: Icon, label, value, color, subtitle, href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
  subtitle?: string;
  href?: string;
}) {
  const router = useRouter();
  return (
    <Card
      onClick={() => href && router.push(href)}
      className={`border-border/50 hover:shadow-md transition ${href ? "cursor-pointer" : ""}`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ManagerDashboardPage() {
  const router = useRouter();
  const { user, company } = useAuthStore();
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pending, setPending] = useState<{ leaves?: PendingItem[]; requests?: PendingItem[] }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
    if (!token) return;
    const authHeader = token.startsWith("Token") ? token : `Token ${token}`;

    Promise.all([
      fetch("/api/manager/dashboard-stats", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/manager/pending", { headers: { Authorization: authHeader } }).then(r => r.json()),
    ]).then(([statsData, pendingData]) => {
      setStats(statsData);
      setPending({
        leaves: pendingData?.pending_leaves || [],
        requests: pendingData?.pending_requests || [],
      });
    })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatDate = () => {
    return new Date().toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  };

  const totalPending = (pending.leaves?.length || 0) + (pending.requests?.length || 0);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {d.managerWelcome}، {user?.first_name} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            {d.myTeamDesc} — {company?.name}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          <Building2 className="w-4 h-4" />
          <span>{formatDate()}</span>
        </div>
      </div>

      {/* Alert للطلبات المعلقة */}
      {totalPending > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold">
                    {lang === "ar" ? `عندك ${totalPending} طلب معلق` : `You have ${totalPending} pending items`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {lang === "ar" ? "يحتاج للمراجعة" : "Awaiting your review"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push("/manager/requests")}
                className="text-sm font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
              >
                {lang === "ar" ? "مراجعة" : "Review"} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          icon={Users}
          label={d.teamSize}
          value={loading ? "..." : (stats?.team_size ?? 0)}
          color="bg-blue-500/10 text-blue-600"
          href="/manager/team"
        />
        <StatCard
          icon={UserCheck}
          label={d.presentToday}
          value={loading ? "..." : (stats?.present_today ?? 0)}
          color="bg-emerald-500/10 text-emerald-600"
          href="/manager/attendance"
        />
        <StatCard
          icon={UserX}
          label={lang === "ar" ? "غائب اليوم" : "Absent Today"}
          value={loading ? "..." : (stats?.absent_today ?? 0)}
          color="bg-red-500/10 text-red-600"
          href="/manager/attendance"
        />
        <StatCard
          icon={Clock}
          label={lang === "ar" ? "متأخر" : "Late"}
          value={loading ? "..." : (stats?.late_today ?? 0)}
          color="bg-amber-500/10 text-amber-600"
        />
        <StatCard
          icon={FileText}
          label={d.pendingRequests}
          value={loading ? "..." : totalPending}
          color="bg-purple-500/10 text-purple-600"
          href="/manager/requests"
        />
        <StatCard
          icon={Briefcase}
          label={lang === "ar" ? "مهمات" : "Missions"}
          value={loading ? "..." : (stats?.active_missions ?? 0)}
          color="bg-brand-primary/10 text-brand-primary"
          href="/manager/missions"
        />
      </div>

      {/* Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Leaves */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-semibold">
                  {lang === "ar" ? "إجازات معلقة" : "Pending Leaves"}
                </h3>
              </div>
              {(pending.leaves?.length || 0) > 0 && (
                <Badge className="bg-amber-500/10 text-amber-700 border-0">
                  {pending.leaves?.length}
                </Badge>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (pending.leaves?.length || 0) === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-emerald-500/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {lang === "ar" ? "مفيش إجازات معلقة" : "No pending leaves"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {pending.leaves?.slice(0, 5).map(item => (
                  <div key={item.id} className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{item.employee_name}</p>
                      <p className="text-xs text-muted-foreground">{item.type}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Requests */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold">
                  {lang === "ar" ? "طلبات معلقة" : "Pending Requests"}
                </h3>
              </div>
              {(pending.requests?.length || 0) > 0 && (
                <Badge className="bg-purple-500/10 text-purple-700 border-0">
                  {pending.requests?.length}
                </Badge>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (pending.requests?.length || 0) === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-emerald-500/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {lang === "ar" ? "مفيش طلبات معلقة" : "No pending requests"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {pending.requests?.slice(0, 5).map(item => (
                  <div key={item.id} className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{item.employee_name}</p>
                      <p className="text-xs text-muted-foreground">{item.request_type}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">{d.quickActionsManager}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Users, label: d.viewTeam, href: "/manager/team", color: "text-blue-600 bg-blue-500/10" },
              { icon: FileText, label: d.reviewRequests, href: "/manager/requests", color: "text-purple-600 bg-purple-500/10" },
              { icon: MapPin, label: d.trackTeam, href: "/manager/locations", color: "text-emerald-600 bg-emerald-500/10" },
              { icon: Briefcase, label: d.createMissionMgr, href: "/manager/missions", color: "text-brand-primary bg-brand-primary/10" },
            ].map((action, i) => (
              <button
                key={i}
                onClick={() => router.push(action.href)}
                className="p-4 rounded-xl border border-border hover:shadow-md transition text-start"
              >
                <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center mb-2`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium">{action.label}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
