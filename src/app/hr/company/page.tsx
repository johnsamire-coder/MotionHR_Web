"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Building2, Info, BarChart3, DollarSign, Loader2, Save,
  Users, Briefcase, MapPin, Phone, Mail, Globe,
  FileText, Calendar, Camera, Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface CompanyInfo {
  id: number;
  name_ar: string;
  name_en: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  commercial_register?: string;
  tax_number?: string;
  industry?: string;
  founded_date?: string;
  stats?: {
    branches: number;
    departments: number;
    employees: number;
  };
}

export default function CompanySettingsPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);

  const [activeTab, setActiveTab] = useState<"info" | "stats">("info");
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch("/api/company/info", { headers: { Authorization: authHeader } }).then(r => r.json()),
    ]).then(([infoData]) => {
      setCompany(infoData?.company);
    })
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveCompany = async () => {
    if (!company) return;
    setSaving(true);
    try {
      const res = await fetch("/api/company/info", {
        method: "PUT",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(company),
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        toast.success(d.settingsSaved || (lang === "ar" ? "تم الحفظ بنجاح" : "Saved successfully"));
        // إعادة تحميل البيانات المحدثة
        const refreshRes = await fetch("/api/company/info", { headers: { Authorization: authHeader } });
        const refreshData = await refreshRes.json();
        if (refreshData?.company) setCompany(refreshData.company);
      } else {
        toast.error(data.error || data.message || d.settingsSaveFailed || (lang === "ar" ? "فشل الحفظ" : "Save failed"));
      }
    } catch (err) {
      toast.error(lang === "ar" ? "خطأ في الاتصال" : "Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(lang === "ar" ? "حجم الملف أكبر من 5MB" : "File exceeds 5MB");
      return;
    }
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error(lang === "ar" ? "نوع الملف غير مدعوم" : "Unsupported file type");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      const res = await fetch("/api/company/upload-logo", {
        method: "POST",
        headers: { Authorization: authHeader! },
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        toast.success(lang === "ar" ? "تم رفع اللوجو بنجاح" : "Logo uploaded");
        if (company) setCompany({ ...company, logo_url: data.logo_url });
      } else {
        toast.error(data.error || (lang === "ar" ? "فشل رفع اللوجو" : "Upload failed"));
      }
    } catch {
      toast.error(lang === "ar" ? "خطأ في الاتصال" : "Network error");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: "info" as const, label: d.tabCompanyInfo, icon: Info },
    { key: "stats" as const, label: d.tabStats, icon: BarChart3 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{d.companyTitle}</h1>
        <p className="text-muted-foreground mt-1">{d.companyDesc}</p>
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
          {/* ================ INFO TAB ================ */}
          {activeTab === "info" && company && (
            <div className="space-y-6">
              {/* Logo Section */}
              <div className="flex items-center gap-6 pb-6 border-b border-border">
                <div className="w-24 h-24 rounded-2xl bg-brand-primary/10 flex items-center justify-center overflow-hidden">
                  {company.logo_url ? (
                    <Image
                      src={company.logo_url}
                      alt="Logo"
                      width={96}
                      height={96}
                      className="object-cover"
                    />
                  ) : (
                    <Building2 className="w-12 h-12 text-brand-primary" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">{d.companyLogo}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {lang === "ar" ? "PNG, JPG - حد أقصى 2 ميجا" : "PNG, JPG - max 2 MB"}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleUploadLogo}
                    style={{ display: 'none' }}
                  />
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={saving}
                  >
                    <Camera className="w-4 h-4" />
                    {saving ? (lang === "ar" ? "جاري الرفع..." : "Uploading...") : (company.logo_url ? d.changeLogo : d.uploadLogo)}
                  </Button>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name_ar">{d.companyNameAr}</Label>
                  <Input
                    id="name_ar"
                    value={company.name_ar || ""}
                    onChange={e => setCompany({ ...company, name_ar: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name_en">{d.companyNameEn}</Label>
                  <Input
                    id="name_en"
                    dir="ltr"
                    value={company.name_en || ""}
                    onChange={e => setCompany({ ...company, name_en: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {d.companyPhone}
                  </Label>
                  <Input
                    id="phone"
                    dir="ltr"
                    value={company.phone || ""}
                    onChange={e => setCompany({ ...company, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {d.companyEmail}
                  </Label>
                  <Input
                    id="email"
                    dir="ltr"
                    value={company.email || ""}
                    onChange={e => setCompany({ ...company, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {d.companyWebsite}
                  </Label>
                  <Input
                    id="website"
                    dir="ltr"
                    value={company.website || ""}
                    onChange={e => setCompany({ ...company, website: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry" className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    {d.industry}
                  </Label>
                  <Input
                    id="industry"
                    value={company.industry || ""}
                    onChange={e => setCompany({ ...company, industry: e.target.value })}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address" className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {d.companyAddress}
                  </Label>
                  <Input
                    id="address"
                    value={company.address || ""}
                    onChange={e => setCompany({ ...company, address: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cr" className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {d.commercialRegister}
                  </Label>
                  <Input
                    id="cr"
                    dir="ltr"
                    value={company.commercial_register || ""}
                    onChange={e => setCompany({ ...company, commercial_register: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax" className="flex items-center gap-1">
                    <Percent className="w-3 h-3" />
                    {d.taxNumber}
                  </Label>
                  <Input
                    id="tax"
                    dir="ltr"
                    value={company.tax_number || ""}
                    onChange={e => setCompany({ ...company, tax_number: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="founded" className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {d.foundedDate}
                  </Label>
                  <Input
                    id="founded"
                    type="date"
                    value={company.founded_date || ""}
                    onChange={e => setCompany({ ...company, founded_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSaveCompany}
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
            </div>
          )}

          {/* ================ STATS TAB ================ */}
          {activeTab === "stats" && company?.stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                      <MapPin className="w-7 h-7 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{d.branchesCount}</p>
                      <p className="text-3xl font-bold text-blue-700">{company.stats.branches}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-to-br from-purple-500/10 to-purple-500/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                      <Building2 className="w-7 h-7 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{d.departmentsCount}</p>
                      <p className="text-3xl font-bold text-purple-700">{company.stats.departments}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                      <Users className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{d.employeesTotal}</p>
                      <p className="text-3xl font-bold text-emerald-700">{company.stats.employees}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

