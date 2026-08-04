"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BookOpen, Clock, Calendar, Briefcase, TrendingUp,
  TrendingDown, Award, Loader2, ChevronRight, ChevronLeft,
  Sparkles, Layers,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface PolicyGroup {
  key: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  count: number;
  href?: string;
  status?: string;
}

export default function PoliciesCenterPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const router = useRouter();

  const [counts, setCounts] = useState({
    attendance: 0,
    leave: 0,
    work: 1,
    allowance: 0,
    deduction: 0,
    bonus: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEYS.token) : null;
    if (!token) return;
    const authHeader = token.startsWith("Token") ? token : `Token ${token}`;

    Promise.all([
      fetch("/api/hr/policies-attendance", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/hr/policies-leave", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/hr/policies-allowance", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/hr/policies-deduction", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/hr/policies-bonus", { headers: { Authorization: authHeader } }).then(r => r.json()),
    ]).then(([att, leave, allow, deduct, bonus]) => {
      setCounts({
        attendance: att?.policies?.length || 0,
        leave: leave?.policies?.length || 0,
        work: 1,
        allowance: allow?.count || allow?.results?.length || 0,
        deduction: deduct?.count || deduct?.results?.length || 0,
        bonus: bonus?.count || bonus?.results?.length || 0,
      });
    })
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, []);

  const policyGroups: PolicyGroup[] = [
    {
      key: "attendance",
      title: d.attendancePoliciesTitle,
      description: d.attendancePoliciesDesc,
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
      count: counts.attendance,
      href: "/hr/policies/attendance",
    },
    {
      key: "leave",
      title: d.leavePoliciesTitle,
      description: d.leavePoliciesDesc,
      icon: Calendar,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
      count: counts.leave,
      href: "/hr/policies/leave",
    },
    {
      key: "work",
      title: d.workPolicyTitle,
      description: d.workPolicyDesc,
      icon: Briefcase,
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
      count: counts.work,
      href: "/hr/policies/work",
    },
    {
      key: "allowance",
      title: d.allowancePoliciesTitle,
      description: d.allowancePoliciesDesc,
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
      count: counts.allowance,
      href: "/hr/policies/allowance",
    },
    {
      key: "deduction",
      title: d.deductionPoliciesTitle,
      description: d.deductionPoliciesDesc,
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-500/10",
      count: counts.deduction,
      href: "/hr/policies/deduction",
    },
    {
      key: "bonus",
      title: d.bonusPoliciesTitle,
      description: d.bonusPoliciesDesc,
      icon: Award,
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
      count: counts.bonus,
      href: "/hr/policies/bonus",
    },
  ];

  const totalPolicies = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.policiesTitle}</h1>
          <p className="text-muted-foreground mt-1">{d.policiesDesc}</p>
        </div>

        <div className="flex items-center gap-2 bg-brand-primary/10 rounded-lg px-4 py-2">
          <Layers className="w-5 h-5 text-brand-primary" />
          <div>
            <div className="text-xs text-muted-foreground">{d.totalPolicies}</div>
            <div className="text-lg font-bold text-brand-primary">
              {loading ? "..." : totalPolicies}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {lang === "ar" ? "أنواع السياسات" : "Policy Types"}
                </p>
                <p className="text-2xl font-bold text-blue-700">6</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{d.activePolicies}</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {loading ? "..." : totalPolicies}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-brand-primary/10 to-brand-primary/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-brand-primary/20 flex items-center justify-center">
                <Layers className="w-6 h-6 text-brand-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {lang === "ar" ? "متاح الآن" : "Available"}
                </p>
                <p className="text-2xl font-bold text-brand-primary">1</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Policy Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {policyGroups.map(group => {
          const isReady = !group.status || group.status !== "coming_soon";
          const Icon = group.icon;
          return (
            <Card
              key={group.key}
              className={`group border-border/50 transition-all cursor-pointer ${
                isReady ? "hover:shadow-lg hover:-translate-y-0.5" : "opacity-70"
              }`}
              onClick={() => isReady && group.href && router.push(group.href)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${group.bgColor} ${group.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-base group-hover:text-brand-primary transition">
                        {group.title}
                      </h3>
                      {!isReady && (
                        <Badge className="bg-amber-500/10 text-amber-700 border-0 text-[10px]">
                          Soon
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px]">
                        {group.count} {d.activeCount}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {group.description}
                    </p>
                  </div>

                  {isReady && (
                    <div className="text-muted-foreground group-hover:text-brand-primary transition">
                      {lang === "ar" ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
