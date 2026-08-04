"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, Clock, Plus, Loader2,
  CheckCircle2, XCircle, AlertTriangle, TrendingUp,
  Moon, Users, Calendar, Settings, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface AttendancePolicy {
  id: number;
  name: string;
  effective_from: string;
  effective_to: string | null;
  status: string;
  notes?: string;
  permission_enabled: boolean;
  permission_monthly_hours: number;
  permission_monthly_count: number;
  permission_max_hours_per_request: number;
  permission_fraction_as_full: boolean;
  permission_reset_cycle: string;
  assignments: unknown[];
  late_rules: unknown[];
  absence_rules: unknown[];
  overtime_rules: unknown[];
  night_shift_rules: unknown[];
  weekend_work_rules: unknown[];
  late_repeat_penalties: unknown[];
}

export default function AttendancePolicyPage() {
  const router = useRouter();
  const d = useDict();
  const lang = useLangStore((s) => s.lang);

  const [policies, setPolicies] = useState<AttendancePolicy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEYS.token) : null;
    if (!token) return;
    const authHeader = token.startsWith("Token") ? token : `Token ${token}`;

    fetch("/api/hr/policies-attendance", { headers: { Authorization: authHeader } })
      .then(r => r.json())
      .then(data => setPolicies(data?.policies || []))
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      active: { label: lang === "ar" ? "نشطة" : "Active", color: "bg-emerald-500/10 text-emerald-700" },
      draft: { label: lang === "ar" ? "مسودة" : "Draft", color: "bg-amber-500/10 text-amber-700" },
      inactive: { label: lang === "ar" ? "غير نشطة" : "Inactive", color: "bg-gray-500/10 text-gray-700" },
    };
    const info = map[status] || map.draft;
    return <Badge className={`${info.color} border-0`}>{info.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/hr/policies")} className="gap-2">
            {lang === "ar" ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {lang === "ar" ? "العودة" : "Back"}
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{d.attendancePoliciesTitle}</h1>
            <p className="text-muted-foreground mt-1 text-sm">{d.attendancePoliciesDesc}</p>
          </div>
        </div>

        <Button className="bg-brand-primary hover:bg-brand-primary/90 gap-2">
          <Plus className="w-4 h-4" />
          {d.createPolicy}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : policies.length === 0 ? (
        <Card>
          <CardContent className="py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 mx-auto">
              <Clock className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="font-medium mb-4">{lang === "ar" ? "لا يوجد سياسات" : "No policies"}</p>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />{d.createPolicy}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {policies.map(policy => (
            <Card key={policy.id}>
              <CardContent className="p-6">
                {/* Policy Header */}
                <div className="flex items-start justify-between mb-6 pb-6 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-brand-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{policy.name}</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {d.effectiveFrom}: <span className="font-mono" dir="ltr">{policy.effective_from}</span>
                        {policy.effective_to && (
                          <> → <span className="font-mono" dir="ltr">{policy.effective_to}</span></>
                        )}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(policy.status)}
                </div>

                {/* Permissions Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-purple-600">
                    <Sparkles className="w-5 h-5" />
                    {lang === "ar" ? "إعدادات الأذونات" : "Permission Settings"}
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 mb-1">
                        {policy.permission_enabled ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <p className="text-xs text-muted-foreground">{d.permissionEnabled}</p>
                      </div>
                      <p className="font-bold">
                        {policy.permission_enabled
                          ? (lang === "ar" ? "مفعلة" : "Enabled")
                          : (lang === "ar" ? "معطلة" : "Disabled")}
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <p className="text-xs text-muted-foreground mb-1">{d.monthlyPermHours}</p>
                      <p className="text-xl font-bold text-blue-700">{policy.permission_monthly_hours}</p>
                    </div>

                    <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                      <p className="text-xs text-muted-foreground mb-1">{d.monthlyPermCount}</p>
                      <p className="text-xl font-bold text-purple-700">{policy.permission_monthly_count}</p>
                    </div>

                    <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <p className="text-xs text-muted-foreground mb-1">
                        {lang === "ar" ? "الحد الأقصى للطلب" : "Max per Request"}
                      </p>
                      <p className="text-xl font-bold text-emerald-700">{policy.permission_max_hours_per_request}h</p>
                    </div>
                  </div>
                </div>

                {/* Rules Grid */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-brand-primary" />
                    {lang === "ar" ? "القواعد المطبقة" : "Applied Rules"}
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <RuleCard
                      icon={AlertTriangle}
                      label={d.lateRules}
                      count={policy.late_rules?.length || 0}
                      color="bg-amber-500/10 text-amber-600"
                    />
                    <RuleCard
                      icon={XCircle}
                      label={d.absenceRules}
                      count={policy.absence_rules?.length || 0}
                      color="bg-red-500/10 text-red-600"
                    />
                    <RuleCard
                      icon={TrendingUp}
                      label={d.overtimeRules}
                      count={policy.overtime_rules?.length || 0}
                      color="bg-emerald-500/10 text-emerald-600"
                    />
                    <RuleCard
                      icon={Moon}
                      label={lang === "ar" ? "قواعد الشيفت الليلي" : "Night Shift Rules"}
                      count={policy.night_shift_rules?.length || 0}
                      color="bg-indigo-500/10 text-indigo-600"
                    />
                    <RuleCard
                      icon={Calendar}
                      label={lang === "ar" ? "قواعد نهاية الأسبوع" : "Weekend Rules"}
                      count={policy.weekend_work_rules?.length || 0}
                      color="bg-purple-500/10 text-purple-600"
                    />
                    <RuleCard
                      icon={Users}
                      label={lang === "ar" ? "الموظفون المطبقة عليهم" : "Assigned Employees"}
                      count={policy.assignments?.length || 0}
                      color="bg-blue-500/10 text-blue-600"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function RuleCard({
  icon: Icon, label, count, color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="p-4 rounded-lg border border-border/50 hover:shadow-md transition">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-2xl font-bold">{count}</p>
    </div>
  );
}
