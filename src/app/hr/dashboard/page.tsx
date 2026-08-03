"use client";

import { useEffect, useState } from "react";
import {
  Users, UserCheck, Calendar, Clock,
  TrendingUp, ArrowUpRight, Building2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/lib/stores/auth";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface DashboardStats {
  total_employees: number;
}

export default function HRDashboardPage() {
  const { user, company } = useAuthStore();
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem(STORAGE_KEYS.token)
        : null;
    if (!token) { setLoading(false); return; }

    fetch("/api/dashboard", {
      headers: {
        Authorization: token.startsWith("Token") ? token : `Token ${token}`,
      },
    })
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const statCards = [
    {
      title: d.totalEmployees,
      value: loading ? "..." : (stats?.total_employees ?? 0).toLocaleString(lang === "ar" ? "ar-EG" : "en-US"),
      change: d.activeEmployees,
      trend: "up" as const,
      icon: Users,
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      title: d.presentToday,
      value: "—",
      change: d.comingSoon,
      trend: "neutral" as const,
      icon: UserCheck,
      color: "bg-brand-accent/10 text-brand-accent",
    },
    {
      title: d.onLeave,
      value: "—",
      change: d.comingSoon,
      trend: "neutral" as const,
      icon: Calendar,
      color: "bg-brand-highlight/10 text-brand-highlight",
    },
    {
      title: d.pendingRequests,
      value: "—",
      change: d.comingSoon,
      trend: "neutral" as const,
      icon: Clock,
      color: "bg-brand-primary/10 text-brand-primary",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {d.welcome}، {user?.first_name} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            {d.overview} {company?.name}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          <Building2 className="w-4 h-4" />
          <span>
            {new Date().toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
              weekday: "long", year: "numeric",
              month: "long", day: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <div className="flex items-center gap-1 text-xs">
                    {stat.trend === "up" && (
                      <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                    )}
                    <span className={stat.trend === "up" ? "text-emerald-600" : "text-muted-foreground"}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">{d.recentActivity}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {d.noActivityDesc}
              </p>
            </div>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-muted-foreground" />
              </div>
              <h4 className="font-semibold mb-1">{d.noActivity}</h4>
              <p className="text-sm text-muted-foreground">{d.noActivityDesc}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">{d.quickActions}</h3>
            <div className="space-y-2">
              <QuickAction title={d.importEmployees} description="Excel" href="/hr/employees/import" icon={Users} />
              <QuickAction title={d.employees} description="" href="/hr/employees" icon={UserCheck} />
              <QuickAction title={d.company} description="" href="/hr/company" icon={Building2} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QuickAction({
  title, description, href,
  icon: Icon,
}: {
  title: string; description: string; href: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <a href={href} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition group">
      <div className="w-10 h-10 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{title}</div>
        {description && <div className="text-xs text-muted-foreground">{description}</div>}
      </div>
    </a>
  );
}
