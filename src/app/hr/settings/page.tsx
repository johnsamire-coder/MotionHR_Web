"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  User, Shield, Palette, Loader2, Save, Eye, EyeOff,
  Lock, Mail, Bell, Globe, Sun, Moon, Monitor,
  Phone, Briefcase, MapPin, Calendar, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Profile {
  id: number;
  employee_code: string;
  full_name_ar: string;
  full_name_en: string;
  email?: string;
  phone?: string;
  department?: string;
  job_title?: string;
  branch?: string;
  hire_date?: string;
  status?: string;
}

export default function SettingsPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);

  const [activeTab, setActiveTab] = useState<"profile" | "security" | "prefs">("profile");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Password state
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [changing, setChanging] = useState(false);

  // Preferences state
  const [prefs, setPrefs] = useState({
    theme: "light",
    emailNotif: true,
    pushNotif: true,
    dailyReports: false,
    weeklyReports: true,
  });

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  useEffect(() => {
    if (!token) return;
    fetch("/api/profile", { headers: { Authorization: authHeader } })
      .then(r => r.json())
      .then(setProfile)
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, []);

  const displayName = lang === "en" && profile?.full_name_en
    ? profile.full_name_en
    : profile?.full_name_ar || "—";

  const handleChangePassword = async () => {
    if (passwords.new.length < 8) {
      toast.error(d.passwordTooShort);
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast.error(d.passwordMismatch);
      return;
    }

    setChanging(true);
    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          old_password: passwords.current,
          new_password: passwords.new,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || d.passwordChangeFailed);
        return;
      }

      toast.success(d.passwordChanged);
      setPasswords({ current: "", new: "", confirm: "" });
    } catch {
      toast.error(d.passwordChangeFailed);
    } finally {
      setChanging(false);
    }
  };

  const applyTheme = (theme: string) => {
    if (typeof document === "undefined") return;
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
  };
  const handleSavePrefs = () => {
    // نحفظ في localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("motionhr_prefs", JSON.stringify(prefs));
    }
    applyTheme(prefs.theme);
    toast.success(d.prefsSaved);
  };

  const tabs = [
    { key: "profile" as const, label: d.tabProfileSettings, icon: User },
    { key: "security" as const, label: d.tabSecurity, icon: Shield },
    { key: "prefs" as const, label: d.tabPreferences, icon: Palette },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{d.settingsTitle}</h1>
        <p className="text-muted-foreground mt-1">{d.settingsDesc}</p>
      </div>

      {/* Tabs */}
      <Card>
        <div className="border-b border-border bg-muted/30">
          <div className="flex gap-1 px-4">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.key
                    ? "border-brand-primary text-brand-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <CardContent className="p-6">
          {/* ================ PROFILE TAB ================ */}
          {activeTab === "profile" && profile && (
            <div className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6 pb-6 border-b border-border">
                <Avatar className="w-24 h-24 border-4 border-brand-primary/20">
                  <AvatarFallback className="bg-brand-primary text-white text-3xl font-bold">
                    {displayName?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold mb-1">{displayName}</h2>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-brand-primary/10 text-brand-primary border-0">
                      {profile.employee_code}
                    </Badge>
                    {profile.status && (
                      <Badge className="bg-emerald-500/10 text-emerald-700 border-0 gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {profile.status}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{profile.job_title || "—"}</p>
                </div>
              </div>

              {/* Info Grid */}
              <div>
                <h3 className="text-lg font-semibold mb-4">{d.profileInfo}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoField icon={Mail} label={d.email} value={profile.email} />
                  <InfoField icon={Phone} label={d.phone} value={profile.phone} dir="ltr" />
                  <InfoField icon={Briefcase} label={d.dept} value={profile.department} />
                  <InfoField icon={MapPin} label={d.branch} value={profile.branch} />
                  <InfoField icon={Calendar} label={d.hireDate} value={profile.hire_date} />
                </div>
              </div>
            </div>
          )}

          {/* ================ SECURITY TAB ================ */}
          {activeTab === "security" && (
            <div className="space-y-6 max-w-lg">
              <div>
                <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-brand-primary" />
                  {d.changePasswordTitle}
                </h3>
                <p className="text-sm text-muted-foreground">{d.changePasswordDesc}</p>
              </div>

              {/* Current */}
              <div className="space-y-2">
                <Label>{d.currentPassword}</Label>
                <div className="relative">
                  <Input
                    type={showPasswords.current ? "text" : "password"}
                    value={passwords.current}
                    onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New */}
              <div className="space-y-2">
                <Label>{d.newPassword}</Label>
                <div className="relative">
                  <Input
                    type={showPasswords.new ? "text" : "password"}
                    value={passwords.new}
                    onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">{d.passwordRequirements}</p>
              </div>

              {/* Confirm */}
              <div className="space-y-2">
                <Label>{d.confirmPassword}</Label>
                <div className="relative">
                  <Input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwords.confirm}
                    onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={changing || !passwords.current || !passwords.new || !passwords.confirm}
                className="bg-brand-primary hover:bg-brand-primary/90 gap-2 w-full"
              >
                {changing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />{d.saving}</>
                ) : (
                  <><Lock className="w-4 h-4" />{d.updatePassword}</>
                )}
              </Button>
            </div>
          )}

          {/* ================ PREFERENCES TAB ================ */}
          {activeTab === "prefs" && (
            <div className="space-y-6">
              {/* Language */}
              <div className="pb-6 border-b border-border">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-brand-primary" />
                  <h3 className="text-lg font-semibold">{d.languagePref}</h3>
                </div>

                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <button
                    onClick={() => setLang("ar")}
                    className={`p-4 rounded-xl border-2 transition ${
                      lang === "ar"
                        ? "border-brand-primary bg-brand-primary/5"
                        : "border-border hover:border-brand-primary/50"
                    }`}
                  >
                    <div className="text-2xl mb-1">🇸🇦</div>
                    <div className="font-semibold">{d.languageAr}</div>
                  </button>

                  <button
                    onClick={() => setLang("en")}
                    className={`p-4 rounded-xl border-2 transition ${
                      lang === "en"
                        ? "border-brand-primary bg-brand-primary/5"
                        : "border-border hover:border-brand-primary/50"
                    }`}
                  >
                    <div className="text-2xl mb-1">🇬🇧</div>
                    <div className="font-semibold">{d.languageEn}</div>
                  </button>
                </div>
              </div>

              {/* Theme */}
              <div className="pb-6 border-b border-border">
                <div className="flex items-center gap-2 mb-4">
                  <Palette className="w-5 h-5 text-brand-primary" />
                  <h3 className="text-lg font-semibold">{d.themePref}</h3>
                </div>

                <div className="grid grid-cols-3 gap-3 max-w-2xl">
                  {[
                    { key: "light", label: d.themeLight, icon: Sun },
                    { key: "dark", label: d.themeDark, icon: Moon },
                    { key: "system", label: d.themeSystem, icon: Monitor },
                  ].map(t => (
                    <button
                      key={t.key}
                      onClick={() => setPrefs({ ...prefs, theme: t.key })}
                      className={`p-4 rounded-xl border-2 transition flex flex-col items-center gap-2 ${
                        prefs.theme === t.key
                          ? "border-brand-primary bg-brand-primary/5"
                          : "border-border hover:border-brand-primary/50"
                      }`}
                    >
                      <t.icon className="w-6 h-6" />
                      <span className="text-sm font-semibold">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notifications */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="w-5 h-5 text-brand-primary" />
                  <h3 className="text-lg font-semibold">{d.notificationsPref}</h3>
                </div>

                <div className="space-y-3">
                  <NotifRow
                    icon={Mail}
                    label={d.emailNotifications}
                    desc={d.emailNotificationsDesc}
                    checked={prefs.emailNotif}
                    onChange={v => setPrefs({ ...prefs, emailNotif: v })}
                  />
                  <NotifRow
                    icon={Bell}
                    label={d.pushNotifications}
                    desc={d.pushNotificationsDesc}
                    checked={prefs.pushNotif}
                    onChange={v => setPrefs({ ...prefs, pushNotif: v })}
                  />
                  <NotifRow
                    icon={Calendar}
                    label={d.dailyReports}
                    desc={d.dailyReportsDesc}
                    checked={prefs.dailyReports}
                    onChange={v => setPrefs({ ...prefs, dailyReports: v })}
                  />
                  <NotifRow
                    icon={Calendar}
                    label={d.weeklyReports}
                    desc={d.weeklyReportsDesc}
                    checked={prefs.weeklyReports}
                    onChange={v => setPrefs({ ...prefs, weeklyReports: v })}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSavePrefs}
                  className="bg-brand-primary hover:bg-brand-primary/90 gap-2"
                >
                  <Save className="w-4 h-4" />
                  {d.saveChanges}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoField({
  icon: Icon, label, value, dir,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | null;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="p-4 rounded-lg bg-muted/30">
      <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div className="text-sm font-medium" dir={dir}>
        {value || "—"}
      </div>
    </div>
  );
}

function NotifRow({
  icon: Icon, label, desc, checked, onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-brand-primary" />
        </div>
        <div>
          <div className="font-medium text-sm">{label}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
