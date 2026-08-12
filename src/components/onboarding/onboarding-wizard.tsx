"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, X, Sparkles, ArrowLeft, Building2, Users, Briefcase, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface OnboardingStep {
  key: string;
  title_ar: string;
  title_en: string;
  desc_ar: string;
  desc_en: string;
  icon: any;
  href: string;
  checkEndpoint: string;
  checkKey: string;
  minRequired: number;
}

const STEPS: OnboardingStep[] = [
  {
    key: "branches",
    title_ar: "أضف فروع شركتك",
    title_en: "Add company branches",
    desc_ar: "حدد الفروع اللي شركتك بتشتغل فيها",
    desc_en: "Define your company branches",
    icon: MapPin,
    href: "/hr/branches",
    checkEndpoint: "/api/branches",
    checkKey: "branches",
    minRequired: 2,
  },
  {
    key: "departments",
    title_ar: "أضف الأقسام",
    title_en: "Add departments",
    desc_ar: "قسم شركتك لإدارات ذكية",
    desc_en: "Organize your company into departments",
    icon: Building2,
    href: "/hr/departments",
    checkEndpoint: "/api/departments",
    checkKey: "departments",
    minRequired: 2,
  },
  {
    key: "jobTitles",
    title_ar: "أضف المسميات الوظيفية",
    title_en: "Add job titles",
    desc_ar: "حدد المسميات المتاحة في شركتك",
    desc_en: "Define job titles in your company",
    icon: Briefcase,
    href: "/hr/job-titles",
    checkEndpoint: "/api/job-titles",
    checkKey: "job_titles",
    minRequired: 2,
  },
  {
    key: "shifts",
    title_ar: "أعد الشيفتات",
    title_en: "Setup shifts",
    desc_ar: "حدد أوقات العمل والشيفتات",
    desc_en: "Configure work shifts and schedules",
    icon: Clock,
    href: "/hr/shifts",
    checkEndpoint: "/api/shifts",
    checkKey: "shifts",
    minRequired: 2,
  },
  {
    key: "employees",
    title_ar: "أضف أول موظف",
    title_en: "Add first employee",
    desc_ar: "ابدأ بإضافة موظفينك",
    desc_en: "Start adding your employees",
    icon: Users,
    href: "/hr/employees",
    checkEndpoint: "/api/employees/list?page_size=2",
    checkKey: "results",
    minRequired: 1,
  },
];

export function OnboardingWizard() {
  const router = useRouter();
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const dismissedFlag = typeof window !== "undefined"
      ? localStorage.getItem("onboarding_dismissed")
      : null;
    if (dismissedFlag === "true") {
      setDismissed(true);
      return;
    }
    checkProgress();
  }, []);

  const checkProgress = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
    if (!token) { setLoading(false); return; }
    const authH = token.startsWith("Token") ? token : `Token ${token}`;

    setLoading(true);
    const results: Record<string, boolean> = {};

    for (const step of STEPS) {
      try {
        const res = await fetch(step.checkEndpoint, {
          headers: { Authorization: authH },
          cache: "no-store",
        });
        const data = await res.json();
        let arr: any[] = [];
        if (Array.isArray(data)) arr = data;
        else if (Array.isArray(data[step.checkKey])) arr = data[step.checkKey];
        else if (Array.isArray(data.results)) arr = data.results;
        else if (Array.isArray(data.items)) arr = data.items;
        results[step.key] = arr.length >= step.minRequired;
      } catch {
        results[step.key] = false;
      }
    }

    setProgress(results);
    setLoading(false);
  };

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("onboarding_dismissed", "true");
    }
    setDismissed(true);
  };

  const handleStepClick = (href: string) => {
    router.push(href);
  };

  if (dismissed || loading) return null;

  const completedCount = Object.values(progress).filter(Boolean).length;
  const totalCount = STEPS.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  // لو كل الخطوات تمت، نخفي الـ wizard تلقائياً
  if (completedCount === totalCount) return null;

  return (
    <Card className="border-2 border-brand-primary/20 bg-gradient-to-br from-brand-primary/5 to-blue-50 mb-6 relative overflow-hidden">
      <button
        onClick={handleDismiss}
        className="absolute top-3 left-3 z-10 p-1 rounded-md hover:bg-black/5 transition"
        title={ar ? "إخفاء" : "Dismiss"}
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>

      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-brand-primary flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 mb-1">
              {ar ? "أهلاً بيك في MotionHR! 🎉" : "Welcome to MotionHR! 🎉"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {ar
                ? "خلينا نساعدك تجهز شركتك في دقائق. اتبع الخطوات دي:"
                : "Let's help you set up your company in minutes. Follow these steps:"}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">
              {ar ? "التقدم" : "Progress"}: {completedCount}/{totalCount}
            </span>
            <span className="text-xs font-bold text-brand-primary">{percentage}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-primary transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {STEPS.map((step, idx) => {
            const isDone = progress[step.key];
            const Icon = step.icon;
            return (
              <button
                key={step.key}
                onClick={() => handleStepClick(step.href)}
                className={`w-full text-start p-3 rounded-lg border transition-all flex items-center gap-3 ${
                  isDone
                    ? "bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                    : "bg-white border-slate-200 hover:border-brand-primary hover:shadow-sm"
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isDone ? "bg-emerald-500" : "bg-brand-primary/10"
                }`}>
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : (
                    <Icon className="w-4 h-4 text-brand-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">
                      {idx + 1}.
                    </span>
                    <p className={`font-semibold text-sm ${isDone ? "text-emerald-700 line-through" : ""}`}>
                      {ar ? step.title_ar : step.title_en}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {ar ? step.desc_ar : step.desc_en}
                  </p>
                </div>
                {!isDone && (
                  <ArrowLeft className={`w-4 h-4 text-muted-foreground ${ar ? "" : "rotate-180"}`} />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-brand-primary/10 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {ar ? "💡 تقدر تخفي الرسالة دي وترجعلها من الإعدادات" : "💡 You can dismiss this and return from settings"}
          </p>
          <Button variant="outline" size="sm" onClick={checkProgress}>
            {ar ? "تحديث" : "Refresh"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
