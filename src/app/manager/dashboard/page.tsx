"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users, UserCheck, UserX, Clock, Briefcase, FileText,
  Building2, MapPin, ChevronRight, Activity,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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

function StatCard({
  icon: Icon, label, value, color, trend,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
  trend?: string;
}) {
  return (
    <Card className="border-border/50 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
            {trend && <p className="text-xs text-muted-foreground">{trend}</p>}
          </div>
          <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
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

export default function ManagerDashboardPage() {
  const { user, company } = useAuthStore();
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEYS.token)
      : null;
    if (!token) return;
    const authHeader = token.startsWith("Token") ? token : `Token ${token}`;

    fetch("/api/manager/dashboard-stats", {
      headers: { Authorization: authHeader },
    })
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatDate = () => {
    return new Date().toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          icon={Users}
          label={d.teamSize}
          value={loading ? "..." : (stats?.team_size ?? 0)}
          color="bg-blue-500/10 text-blue-600"
          trend={d.teamMembers}
        />
        <StatCard
          icon={UserCheck}
          label={d.presentToday}
          value={loading ? "..." : (stats?.present_today ?? 0)}
          color="bg-emerald-500/10 text-emerald-600"
        />
        <StatCard
          icon={UserX}
          label={d.absent_today ? d.absent_today : (lang === "ar" ? "غائب اليوم" : "Absent Today")}
          value={loading ? "..." : (stats?.absent_today ?? 0)}
          color="bg-red-500/10 text-red-600"
        />
        <StatCard
          icon={Clock}
          label={lang === "ar" ? "متأخر اليوم" : "Late Today"}
          value={loading ? "..." : (stats?.late_today ?? 0)}
          color="bg-amber-500/10 text-amber-600"
        />
        <StatCard
          icon={FileText}
          label={d.pendingRequests}
          value={loading ? "..." : (stats?.pending_requests ?? 0)}
          color="bg-purple-500/10 text-purple-600"
        />
        <StatCard
          icon={Briefcase}
          label={lang === "ar" ? "مهمات نشطة" : "Active Missions"}
          value={loading ? "..." : (stats?.active_missions ?? 0)}
          color="bg-brand-primary/10 text-brand-primary"
        />
      </div>

      {/* Two Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Placeholder */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-brand-primary" />
              <h3 className="text-lg font-semibold">{d.recentActivity}</h3>
            </div>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Activity className="w-8 h-8 text-muted-foreground" />
              </div>
              <h4 className="font-semibold mb-1">{d.noActivity}</h4>
              <p className="text-sm text-muted-foreground">{d.noActivityDesc}</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">{d.quickActionsManager}</h3>
            <div className="space-y-2">
              <QuickAction
                title={d.viewTeam}
                description={d.myTeamDesc}
                href="/manager/team"
                icon={Users}
              />
              <QuickAction
                title={d.reviewRequests}
                description={d.pendingRequests}
                href="/manager/requests"
                icon={FileText}
              />
              <QuickAction
                title={d.trackTeam}
                description={d.locationsDesc}
                href="/manager/locations"
                icon={MapPin}
              />
              <QuickAction
                title={d.createMissionMgr}
                description={d.missionsDesc}
                href="/manager/missions"
                icon={Briefcase}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
