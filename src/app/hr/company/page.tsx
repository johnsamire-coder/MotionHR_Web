"use client";

import { useState, useEffect } from "react";
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

interface PayrollSettings {
  late_deduction_per_minute: number;
  absence_deduction_per_day: number;
  overtime_rate_per_hour: number;
  insurance_mode: string;
  insurance_fixed_amount: number;
  insurance_percent: number;
  field_allowance_type: string;
  fixed_field_allowance: number;
  per_visit_allowance: number;
  payroll_cycle_type: string;
  payroll_cutoff_day: number;
  payroll_pay_day: number;
}

export default function CompanySettingsPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);

  const [activeTab, setActiveTab] = useState<"info" | "stats" | "payroll">("info");
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [payroll, setPayroll] = useState<PayrollSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch("/api/company/info", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/company/payroll-settings", { headers: { Authorization: authHeader } }).then(r => r.json()),
    ]).then(([infoData, payrollData]) => {
      setCompany(infoData?.company);
      setPayroll(payrollData);
    })
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveCompany = async () => {
    if (!company) return;
    setSaving(true);
    try {
      const res = await fetch("/api/company/info", {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(company),
      });
      if (!res.ok) throw new Error();
      toast.success(d.settingsSaved);
    } catch {
      toast.error(d.settingsSaveFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePayroll = async () => {
    if (!payroll) return;
    setSaving(true);
    try {
      const res = await fetch("/api/company/payroll-settings", {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payroll),
      });
      if (!res.ok) throw new Error();
      toast.success(d.settingsSaved);
    } catch {
      toast.error(d.settingsSaveFailed);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: "info" as const, label: d.tabCompanyInfo, icon: Info },
    { key: "stats" as const, label: d.tabStats, icon: BarChart3 },
    { key: "payroll" as const, label: d.tabPayrollSettings, icon: DollarSign },
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
                  <Button variant="outline" className="gap-2">
                    <Camera className="w-4 h-4" />
                    {company.logo_url ? d.changeLogo : d.uploadLogo}
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

          {/* ================ PAYROLL SETTINGS TAB ================ */}
          {activeTab === "payroll" && payroll && (
            <div className="space-y-6">
              {/* Deductions */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-600">
                  <DollarSign className="w-5 h-5" />
                  {lang === "ar" ? "الخصومات" : "Deductions"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{d.lateDeductionRate}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.1"
                        value={payroll.late_deduction_per_minute}
                        onChange={e => setPayroll({ ...payroll, late_deduction_per_minute: parseFloat(e.target.value) || 0 })}
                      />
                      <span className="text-sm text-muted-foreground">{d.egpUnit}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{d.absenceDeductionDay}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={payroll.absence_deduction_per_day}
                        onChange={e => setPayroll({ ...payroll, absence_deduction_per_day: parseFloat(e.target.value) || 0 })}
                      />
                      <span className="text-sm text-muted-foreground">{d.egpUnit}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{d.overtimeRate}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={payroll.overtime_rate_per_hour}
                        onChange={e => setPayroll({ ...payroll, overtime_rate_per_hour: parseFloat(e.target.value) || 0 })}
                      />
                      <span className="text-sm text-muted-foreground">{d.egpUnit}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Insurance */}
              <div className="pt-4 border-t border-border">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-600">
                  <Percent className="w-5 h-5" />
                  {lang === "ar" ? "التأمين" : "Insurance"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{d.insuranceMode}</Label>
                    <Select
                      value={payroll.insurance_mode}
                      onValueChange={v => setPayroll({ ...payroll, insurance_mode: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{d.insuranceModeNone}</SelectItem>
                        <SelectItem value="fixed">{d.insuranceModeFixed}</SelectItem>
                        <SelectItem value="percent">{d.insuranceModePercent}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {payroll.insurance_mode === "fixed" && (
                    <div className="space-y-2">
                      <Label>{d.insuranceFixedAmount}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={payroll.insurance_fixed_amount}
                          onChange={e => setPayroll({ ...payroll, insurance_fixed_amount: parseFloat(e.target.value) || 0 })}
                        />
                        <span className="text-sm text-muted-foreground">{d.egpUnit}</span>
                      </div>
                    </div>
                  )}

                  {payroll.insurance_mode === "percent" && (
                    <div className="space-y-2">
                      <Label>{d.insurancePercent}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.1"
                          value={payroll.insurance_percent}
                          onChange={e => setPayroll({ ...payroll, insurance_percent: parseFloat(e.target.value) || 0 })}
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Field Allowance */}
              <div className="pt-4 border-t border-border">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-emerald-600">
                  <MapPin className="w-5 h-5" />
                  {d.fieldAllowanceType}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{d.fieldAllowanceType}</Label>
                    <Select
                      value={payroll.field_allowance_type}
                      onValueChange={v => setPayroll({ ...payroll, field_allowance_type: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{d.fieldAllowanceNone}</SelectItem>
                        <SelectItem value="fixed">{d.fieldAllowanceFixed}</SelectItem>
                        <SelectItem value="per_visit">{d.fieldAllowancePerVisit}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {payroll.field_allowance_type === "fixed" && (
                    <div className="space-y-2">
                      <Label>{d.fixedFieldAllowance}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={payroll.fixed_field_allowance}
                          onChange={e => setPayroll({ ...payroll, fixed_field_allowance: parseFloat(e.target.value) || 0 })}
                        />
                        <span className="text-sm text-muted-foreground">{d.egpUnit}</span>
                      </div>
                    </div>
                  )}

                  {payroll.field_allowance_type === "per_visit" && (
                    <div className="space-y-2">
                      <Label>{d.perVisitAllowance}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={payroll.per_visit_allowance}
                          onChange={e => setPayroll({ ...payroll, per_visit_allowance: parseFloat(e.target.value) || 0 })}
                        />
                        <span className="text-sm text-muted-foreground">{d.egpUnit}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payroll Cycle */}
              <div className="pt-4 border-t border-border">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-brand-primary">
                  <Calendar className="w-5 h-5" />
                  {d.payrollCycle}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{d.payrollCycle}</Label>
                    <Select
                      value={payroll.payroll_cycle_type}
                      onValueChange={v => setPayroll({ ...payroll, payroll_cycle_type: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="calendar_month">{d.cycleCalendarMonth}</SelectItem>
                        <SelectItem value="custom">{d.cycleCustom}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{d.payrollCutoffDay}</Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={payroll.payroll_cutoff_day}
                      onChange={e => setPayroll({ ...payroll, payroll_cutoff_day: parseInt(e.target.value) || 1 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{d.payrollPayDay}</Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={payroll.payroll_pay_day}
                      onChange={e => setPayroll({ ...payroll, payroll_pay_day: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSavePayroll}
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
        </CardContent>
      </Card>
    </div>
  );
}
