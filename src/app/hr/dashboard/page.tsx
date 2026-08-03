"use client";

import {
  Users,
  UserCheck,
  Calendar,
  Clock,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/lib/stores/auth";

export default function HRDashboardPage() {
  const { user, company } = useAuthStore();

  const stats = [
    {
      title: "إجمالي الموظفين",
      value: "0",
      change: "+0%",
      trend: "up",
      icon: Users,
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      title: "الحاضرون اليوم",
      value: "0",
      change: "0%",
      trend: "up",
      icon: UserCheck,
      color: "bg-brand-accent/10 text-brand-accent",
    },
    {
      title: "في إجازة",
      value: "0",
      change: "0",
      trend: "neutral",
      icon: Calendar,
      color: "bg-brand-highlight/10 text-brand-highlight",
    },
    {
      title: "طلبات معلقة",
      value: "0",
      change: "0 جديد",
      trend: "neutral",
      icon: Clock,
      color: "bg-brand-primary/10 text-brand-primary",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            مرحباً، {user?.first_name} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            نظرة عامة على {company?.name}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          <Building2 className="w-4 h-4" />
          <span>{new Date().toLocaleDateString("ar-EG", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
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
                    {stat.trend === "down" && (
                      <ArrowDownRight className="w-3 h-3 text-red-500" />
                    )}
                    <span
                      className={
                        stat.trend === "up"
                          ? "text-emerald-600"
                          : stat.trend === "down"
                          ? "text-red-600"
                          : "text-muted-foreground"
                      }
                    >
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
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">النشاطات الأخيرة</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  آخر التحديثات في الشركة
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-muted-foreground" />
              </div>
              <h4 className="font-semibold mb-1">لا يوجد نشاط بعد</h4>
              <p className="text-sm text-muted-foreground">
                ابدأ بإضافة موظفين لرؤية النشاطات هنا
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">إجراءات سريعة</h3>
            <div className="space-y-2">
              <QuickAction
                title="استيراد موظفين"
                description="من ملف Excel"
                href="/hr/employees/import"
                icon={Users}
              />
              <QuickAction
                title="إضافة موظف"
                description="موظف واحد"
                href="/hr/employees/new"
                icon={UserCheck}
              />
              <QuickAction
                title="إعدادات الشركة"
                description="عام"
                href="/hr/company"
                icon={Building2}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QuickAction({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition group"
    >
      <div className="w-10 h-10 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </a>
  );
}
