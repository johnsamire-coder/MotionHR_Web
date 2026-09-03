"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, Briefcase, Loader2, Save,
  Calendar, Coffee, Zap, MousePointerClick, Bell, Radar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

type TriggerMode = "manual" | "notification" | "auto";

interface WorkPolicy {
  work_saturday: boolean;
  work_sunday: boolean;
  work_monday: boolean;
  work_tuesday: boolean;
  work_wednesday: boolean;
  work_thursday: boolean;
  work_friday: boolean;
  is_24_7: boolean;
  attendance_trigger_mode: TriggerMode;
  source?: string;
}

export default function WorkPolicyPage() {
  const router = useRouter();
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";

  const [policy, setPolicy] = useState<WorkPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const getToken = () => {
    const token = typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEYS.token) : null;
    if (!token) return null;
    return token.startsWith("Token") ? token : `Token ${token}`;
  };

  useEffect(() => {
    const authHeader = getToken();
    if (!authHeader) return;

    fetch("/api/hr/policies-work", { headers: { Authorization: authHeader } })
      .then(r => r.json())
      .then((data) => setPolicy({ attendance_trigger_mode: "notification", ...data }))
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, []);

  const days = [
    { key: "work_saturday", labelAr: "السبت", labelEn: "Saturday" },
    { key: "work_sunday", labelAr: "الأحد", labelEn: "Sunday" },
    { key: "work_monday", labelAr: "الاثنين", labelEn: "Monday" },
    { key: "work_tuesday", labelAr: "الثلاثاء", labelEn: "Tuesday" },
    { key: "work_wednesday", labelAr: "الأربعاء", labelEn: "Wednesday" },
    { key: "work_thursday", labelAr: "الخميس", labelEn: "Thursday" },
    { key: "work_friday", labelAr: "الجمعة", labelEn: "Friday" },
  ] as const;

  const triggerModes: { key: TriggerMode; icon: any; labelAr: string; labelEn: string; descAr: string; descEn: string }[] = [
    {
      key: "manual", icon: MousePointerClick,
      labelAr: "يدوي فقط", labelEn: "Manual Only",
      descAr: "الموظف يفتح التطبيق ويسجل حضوره بنفسه", descEn: "Employee opens the app and checks in manually",
    },
    {
      key: "notification", icon: Bell,
      labelAr: "إشعار ذكي", labelEn: "Smart Notification",
      descAr: "يوصل إشعار للموظف عند وصوله للموقع يذكّره بالتسجيل", descEn: "Employee gets a reminder notification on arrival",
    },
    {
      key: "auto", icon: Radar,
      labelAr: "تسجيل تلقائي", labelEn: "Fully Automatic",
      descAr: "يتم تسجيل الحضور تلقائيًا فور وصول الموظف للموقع", descEn: "Check-in happens automatically on arrival",
    },
  ];

  const activeDaysCount = days.filter(d => policy?.[d.key as keyof WorkPolicy]).length;

  const handleToggleDay = (key: string) => {
    if (!policy) return;
    setPolicy({ ...policy, [key]: !policy[key as keyof WorkPolicy] });
  };

  const handleSave = async () => {
    if (!policy) return;
    const authHeader = getToken();
    if (!authHeader) {
      toast.error(ar ? "يرجى تسجيل الدخول من جديد" : "Please log in again");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/hr/policies-work", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify(policy),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        toast.error(data.error || (ar ? "حدث خطأ أثناء الحفظ" : "Failed to save"));
        return;
      }
      toast.success(d.settingsSaved);
    } catch {
      toast.error(ar ? "خطأ في الاتصال بالسيرفر" : "Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/hr/policies")} className="gap-2">
          {lang === "ar" ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {lang === "ar" ? "العودة" : "Back"}
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.workPolicyTitle}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{d.workPolicyDesc}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {lang === "ar" ? "أيام العمل" : "Work Days"}
                </p>
                <p className="text-2xl font-bold text-emerald-700">{activeDaysCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Coffee className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {lang === "ar" ? "أيام الراحة" : "Off Days"}
                </p>
                <p className="text-2xl font-bold text-amber-700">{7 - activeDaysCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-0 ${policy?.is_24_7 ? "bg-gradient-to-br from-purple-500/10 to-purple-500/5" : "bg-gradient-to-br from-gray-500/10 to-gray-500/5"}`}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${policy?.is_24_7 ? "bg-purple-500/20" : "bg-gray-500/20"}`}>
                <Zap className={`w-6 h-6 ${policy?.is_24_7 ? "text-purple-600" : "text-gray-600"}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">24/7</p>
                <p className={`text-2xl font-bold ${policy?.is_24_7 ? "text-purple-700" : "text-gray-700"}`}>
                  {policy?.is_24_7 ? (lang === "ar" ? "مفعل" : "Yes") : (lang === "ar" ? "معطل" : "No")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Trigger Mode */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="w-5 h-5 text-brand-primary" />
            <h3 className="text-lg font-semibold">
              {ar ? "طريقة تسجيل الحضور" : "Attendance Trigger Method"}
            </h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {ar
              ? "حدد إزاي التطبيق يتصرف لما الموظف يوصل موقع العمل"
              : "Choose how the app behaves when an employee arrives at a work location"}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {triggerModes.map((mode) => {
              const isActive = policy?.attendance_trigger_mode === mode.key;
              const Icon = mode.icon;
              return (
                <button
                  key={mode.key}
                  type="button"
                  onClick={() => setPolicy(policy ? { ...policy, attendance_trigger_mode: mode.key } : null)}
                  className={`text-right p-4 rounded-lg border-2 transition ${
                    isActive
                      ? "border-brand-primary bg-brand-primary/5"
                      : "border-border bg-muted/20 hover:bg-muted/40"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                    isActive ? "bg-brand-primary/20 text-brand-primary" : "bg-gray-500/20 text-gray-600"
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="font-semibold mb-1">{ar ? mode.labelAr : mode.labelEn}</p>
                  <p className="text-xs text-muted-foreground">{ar ? mode.descAr : mode.descEn}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Days Config */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-brand-primary" />
            <h3 className="text-lg font-semibold">
              {lang === "ar" ? "أيام العمل الأسبوعية" : "Weekly Work Days"}
            </h3>
          </div>

          <div className="space-y-3">
            {days.map(day => {
              const isActive = policy?.[day.key as keyof WorkPolicy] as boolean;
              return (
                <div
                  key={day.key}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 transition ${
                    isActive
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-border bg-muted/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isActive ? "bg-emerald-500/20 text-emerald-600" : "bg-gray-500/20 text-gray-600"
                    }`}>
                      <Calendar className="w-5 h-5" />
                    </div>
                    <span className="font-semibold">
                      {lang === "ar" ? day.labelAr : day.labelEn}
                    </span>
                    {isActive ? (
                      <Badge className="bg-emerald-500/10 text-emerald-700 border-0">
                        {lang === "ar" ? "يوم عمل" : "Work Day"}
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/10 text-amber-700 border-0">
                        {lang === "ar" ? "عطلة" : "Off"}
                      </Badge>
                    )}
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={() => handleToggleDay(day.key)}
                  />
                </div>
              );
            })}
          </div>

          {/* 24/7 Toggle */}
          <div className="mt-6 p-4 rounded-lg border-2 border-purple-500/20 bg-purple-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold">
                    {lang === "ar" ? "عمل 24 ساعة / 7 أيام" : "24/7 Work"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {lang === "ar" ? "الشركة تعمل باستمرار" : "Company works continuously"}
                  </p>
                </div>
              </div>
              <Switch
                checked={policy?.is_24_7 || false}
                onCheckedChange={(v) => setPolicy(policy ? { ...policy, is_24_7: v } : null)}
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end mt-6">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-brand-primary hover:bg-brand-primary/90 gap-2"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" />{d.saving}</>
              ) : (
                <><Save className="w-4 h-4" />{d.saveChanges}</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
