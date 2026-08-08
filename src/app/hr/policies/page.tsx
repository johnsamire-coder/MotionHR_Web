"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Shield, Calendar, Clock, DollarSign, TrendingDown, Award,
  Loader2, Plus, Edit2, CheckCircle2, Info, Copy, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AttendancePolicyDialog from "@/components/hr/policies/attendance-policy-dialog";
import LeavePolicyDialog from "@/components/hr/policies/leave-policy-dialog";
import PayrollPolicyDialog from "@/components/hr/policies/payroll-policy-dialog";
import InsurancePolicyDialog from "@/components/hr/policies/insurance-policy-dialog";
import PayrollCyclePolicyDialog from "@/components/hr/policies/payroll-cycle-policy-dialog";
import PenaltyRuleDialog from "@/components/hr/policies/penalty-rule-dialog";
import BonusRuleDialog from "@/components/hr/policies/bonus-rule-dialog";
import AllowanceRuleDialog from "@/components/hr/policies/allowance-rule-dialog";
import LeaveRuleDialog from "@/components/hr/policies/leave-rule-dialog";
import TaxPolicyDialog from "@/components/hr/policies/tax-policy-dialog";
import EosPolicyDialog from "@/components/hr/policies/eos-policy-dialog";
import OfficialHolidayDialog from "@/components/hr/policies/official-holiday-dialog";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface PolicyItem {
  id: number;
  name?: string;
  status?: string;
  effective_from?: string;
  effective_to?: string | null;
  amount?: number;
  amount_type?: string;
}




interface RuleTier {
  from: number;
  to: number | null;
  deduction_type?: string;
  value_type?: string;
  value?: number;
}

interface LeaveRuleItem {
  id: number;
  name: string;
  annual_leave_days: number;
  sick_leave_max_days: number;
  emergency_max_days: number;
  maternity_days: number;
  paternity_days: number;
  scope: string;
  scope_display: string;
  branch_name?: string | null;
  department_name?: string | null;
  specific_employees: number[];
  is_active: boolean;
  is_superseded: boolean;
  version_number: number;
  start_date: string;
  end_date?: string | null;
}

interface PenaltyRuleItem {
  id: number;
  name: string;
  penalty_type: string;
  penalty_type_display: string;
  grace_amount: number;
  tiers: RuleTier[];
  scope: string;
  scope_display: string;
  branch_name?: string | null;
  department_name?: string | null;
  specific_employees: number[];
  is_active: boolean;
  is_superseded: boolean;
  version_number: number;
  start_date: string;
  end_date?: string | null;
}

interface BonusRuleItem {
  id: number;
  name: string;
  bonus_type: string;
  bonus_type_display: string;
  tiers: RuleTier[];
  max_per_day: number;
  max_per_month: number;
  scope: string;
  scope_display: string;
  branch_name?: string | null;
  department_name?: string | null;
  specific_employees: number[];
  is_active: boolean;
  is_superseded: boolean;
  version_number: number;
  start_date: string;
  end_date?: string | null;
}

interface AllowanceRuleItem {
  id: number;
  name: string;
  allowance_type: string;
  allowance_type_display: string;
  calculation_type: string;
  fixed_amount: number;
  tiers: RuleTier[];
  scope: string;
  scope_display: string;
  branch_name?: string | null;
  department_name?: string | null;
  specific_employees: number[];
  is_active: boolean;
  is_superseded: boolean;
  version_number: number;
  start_date: string;
  end_date?: string | null;
}

interface PayrollCyclePolicyItem {
  id: number;
  cycle_type: string;
  cycle_type_display: string;
  cutoff_day: number;
  pay_day: number;
  weekly_pay_day: string;
  holiday_handling_display: string;
  default_currency: string;
  proration_method_display: string;
  is_active: boolean;
  is_superseded: boolean;
  version_number: number;
  start_date: string;
  end_date?: string | null;
  approval_level_display?: string;
  change_reason?: string;
}

interface InsurancePolicyItem {
  id: number;
  insurance_type: "social" | "medical";
  name_ar: string;
  name_en?: string;
  company_share_type: "percent" | "fixed";
  company_share_value: number;
  employee_share_type: "percent" | "fixed";
  employee_share_value: number;
  calculation_base: "basic" | "gross" | "employee_custom";
  scope: string;
  scope_display?: string;
  is_active: boolean;
  is_superseded: boolean;
  version_number: number;
  start_date: string;
  end_date?: string | null;
  branch_name?: string | null;
  department_name?: string | null;
}

interface WorkPolicy {
  work_sunday: boolean;
  work_monday: boolean;
  work_tuesday: boolean;
  work_wednesday: boolean;
  work_thursday: boolean;
  work_friday: boolean;
  work_saturday: boolean;
  is_24_7: boolean;
}

type TabKey = "attendance" | "work" | "leave" | "allowance" | "deduction" | "bonus" | "insurance" | "payroll_cycle" | "penalty_rule" | "bonus_rule" | "allowance_rule" | "leave_rule" | "tax" | "eos" | "holidays";

const TABS = [
  { key: "attendance",  icon: Shield,       label_ar: "سياسة الحضور",   label_en: "Attendance",  color: "text-blue-600 bg-blue-500/10" },
  { key: "work",        icon: Calendar,     label_ar: "أيام العمل",     label_en: "Work Days",   color: "text-emerald-600 bg-emerald-500/10" },
  { key: "leave",       icon: Clock,        label_ar: "سياسة الإجازات", label_en: "Leaves",      color: "text-purple-600 bg-purple-500/10" },
  { key: "allowance",   icon: DollarSign,   label_ar: "البدلات",        label_en: "Allowances",  color: "text-amber-600 bg-amber-500/10" },
  { key: "deduction",   icon: TrendingDown, label_ar: "الخصومات",       label_en: "Deductions",  color: "text-red-600 bg-red-500/10" },
  { key: "bonus",       icon: Award,        label_ar: "المكافآت",       label_en: "Bonuses",     color: "text-brand-primary bg-brand-primary/10" },
  { key: "insurance",   icon: Shield,       label_ar: "التأمينات",      label_en: "Insurance",   color: "text-teal-600 bg-teal-500/10" },
  { key: "payroll_cycle", icon: Calendar,     label_ar: "دورة الرواتب",   label_en: "Payroll Cycle", color: "text-indigo-600 bg-indigo-500/10" },
  { key: "penalty_rule",  icon: TrendingDown, label_ar: "قواعد الجزاءات", label_en: "Penalty Rules", color: "text-red-700 bg-red-500/10" },
  { key: "bonus_rule",    icon: Award,        label_ar: "قواعد المكافآت والأوفرتايم", label_en: "Bonus & Overtime", color: "text-emerald-700 bg-emerald-500/10" },
  { key: "allowance_rule", icon: DollarSign,  label_ar: "قواعد البدلات الشهرية", label_en: "Monthly Allowances", color: "text-amber-700 bg-amber-500/10" },
  { key: "leave_rule",    icon: Calendar,     label_ar: "قواعد الإجازات",       label_en: "Leave Rules",       color: "text-purple-700 bg-purple-500/10" },
  { key: "tax",           icon: TrendingDown, label_ar: "سياسة الضرائب",        label_en: "Tax Policy",        color: "text-orange-600 bg-orange-500/10" },
  { key: "eos",           icon: Award,        label_ar: "مكافأة نهاية الخدمة",  label_en: "End of Service",    color: "text-amber-600 bg-amber-500/10" },
  { key: "holidays",      icon: Calendar,     label_ar: "الأعياد الرسمية",       label_en: "Official Holidays", color: "text-purple-600 bg-purple-500/10" },
] as const;

const DAYS = [
  { key: "work_sunday",    label_ar: "الأحد",    label_en: "Sunday" },
  { key: "work_monday",    label_ar: "الاثنين",  label_en: "Monday" },
  { key: "work_tuesday",   label_ar: "الثلاثاء", label_en: "Tuesday" },
  { key: "work_wednesday", label_ar: "الأربعاء", label_en: "Wednesday" },
  { key: "work_thursday",  label_ar: "الخميس",   label_en: "Thursday" },
  { key: "work_friday",    label_ar: "الجمعة",   label_en: "Friday" },
  { key: "work_saturday",  label_ar: "السبت",    label_en: "Saturday" },
];

export default function PoliciesHubPage() {
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";

  const [activeTab, setActiveTab] = useState<TabKey>("attendance");
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const [attendance, setAttendance]   = useState<PolicyItem[]>([]);
  const [leaves, setLeaves]           = useState<PolicyItem[]>([]);
  const [allowances, setAllowances]   = useState<PolicyItem[]>([]);
  const [deductions, setDeductions]   = useState<PolicyItem[]>([]);
  const [bonuses, setBonuses]         = useState<PolicyItem[]>([]);
  const [insurances, setInsurances]   = useState<InsurancePolicyItem[]>([]);
  const [payrollCycles, setPayrollCycles] = useState<PayrollCyclePolicyItem[]>([]);
  const [penaltyRules, setPenaltyRules] = useState<PenaltyRuleItem[]>([]);
  const [bonusRules, setBonusRules] = useState<BonusRuleItem[]>([]);
  const [allowanceRules, setAllowanceRules] = useState<AllowanceRuleItem[]>([]);
  const [leaveRules, setLeaveRules] = useState<LeaveRuleItem[]>([]);
  const [taxPolicies, setTaxPolicies] = useState<any[]>([]);
  const [eosPolicies, setEosPolicies] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [showHolidayDialog, setShowHolidayDialog] = useState(false);
  const [editingHolidayId, setEditingHolidayId] = useState<number | null>(null);
  const [showTaxDialog, setShowTaxDialog] = useState(false);
  const [showEosDialog, setShowEosDialog] = useState(false);
  const [editingTax, setEditingTax] = useState<any>(null);
  const [editingEos, setEditingEos] = useState<any>(null);
  const [showInsuranceDialog, setShowInsuranceDialog] = useState(false);
  const [showPayrollCycleDialog, setShowPayrollCycleDialog] = useState(false);
  const [showPenaltyRuleDialog, setShowPenaltyRuleDialog] = useState(false);
  const [showBonusRuleDialog, setShowBonusRuleDialog] = useState(false);
  const [showAllowanceRuleDialog, setShowAllowanceRuleDialog] = useState(false);
  const [showLeaveRuleDialog, setShowLeaveRuleDialog] = useState(false);
  const [insuranceSubTab, setInsuranceSubTab] = useState<"all" | "social" | "medical">("all");
  const [workPolicy, setWorkPolicy]   = useState<WorkPolicy | null>(null);

  // Dialogs
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog]           = useState(false);
  const [showPayrollDialog, setShowPayrollDialog]       = useState(false);
  const [editingPolicyId, setEditingPolicyId]           = useState<number | null>(null);
  const [payrollKind, setPayrollKind]                   = useState<"allowance" | "deduction" | "bonus">("allowance");

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;
  const langH = ar ? "ar" : "en";

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: authH, "Accept-Language": langH };
      const [aRes, lRes, wRes, alRes, dRes, bRes, iRes, pcRes, prRes, brRes, arRes, lrRes, taxRes, eosRes, holidaysRes] = await Promise.all([
        fetch("/api/hr/policies/attendance-policy", { headers }),
        fetch("/api/hr/policies/leave-policy", { headers }),
        fetch("/api/hr/policies/work-policy", { headers }),
        fetch("/api/hr/policies/allowance-policies", { headers }),
        fetch("/api/hr/policies/deduction-policies", { headers }),
        fetch("/api/hr/policies/bonus-policies", { headers }),
        fetch("/api/hr/policies/insurance-policies", { headers }),
        fetch("/api/hr/policies/payroll-cycle-policies", { headers }),
        fetch("/api/hr/policies/rules-penalty", { headers }),
        fetch("/api/hr/policies/rules-bonus", { headers }),
        fetch("/api/hr/policies/rules-allowance", { headers }),
        fetch("/api/hr/policies/rules-leave", { headers }),
        fetch("/api/hr/policies/tax", { headers }),
        fetch("/api/hr/policies/eos", { headers }),
        fetch("/api/hr/policies/official-holidays", { headers }),
      ]);
      const [a, l, w, al, d, b, i, pc, pr, br, arRule, lr, taxData, eosData, holidaysData] = await Promise.all([
        aRes.json(), lRes.json(), wRes.json(), alRes.json(), dRes.json(), bRes.json(), iRes.json(), pcRes.json(), prRes.json(), brRes.json(), arRes.json(), lrRes.json(), taxRes.json(), eosRes.json(), holidaysRes.json(),
      ]);
      setAttendance(a?.policies || a?.results || []);
      setLeaves(l?.policies || l?.results || []);
      setWorkPolicy(w);
      setAllowances(al?.results || al?.policies || []);
      setDeductions(d?.results || d?.policies || []);
      setBonuses(b?.results || b?.policies || []);
      setInsurances(i?.results || []);
      setPayrollCycles(pc?.results || []);
      setPenaltyRules(pr?.results || []);
      setBonusRules(br?.results || []);
      setAllowanceRules(arRule?.results || []);
      setLeaveRules(lr?.results || []);
      setTaxPolicies(Array.isArray(taxData) ? taxData : (taxData?.results || []));
      setEosPolicies(Array.isArray(eosData) ? eosData : (eosData?.results || []));
      setHolidays(holidaysData?.holidays || holidaysData?.results || []);
    } catch {
      toast.error(ar ? "فشل تحميل البيانات" : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token, ar, authH, langH]);

  useEffect(() => { load(); }, [load]);

  // â”€â”€ Work Policy â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const toggleDay = (day: keyof WorkPolicy) => {
    if (!workPolicy) return;
    setWorkPolicy({ ...workPolicy, [day]: !workPolicy[day] });
  };

  const saveWorkPolicy = async () => {
    if (!workPolicy) return;
    setSaving(true);
    try {
      const res = await fetch("/api/hr/policies/work-policy/save", {
        method: "POST",
        headers: { Authorization: authH, "Content-Type": "application/json", "Accept-Language": langH },
        body: JSON.stringify(workPolicy),
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        toast.success(ar ? "تم الحفظ ✅" : "Saved âœ…");
      } else {
        toast.error(data.message || (ar ? "فشل" : "Failed"));
      }
    } catch { toast.error(ar ? "خطأ" : "Error"); }
    finally { setSaving(false); }
  };

  // â”€â”€ Common Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const getEndpoint = (): string => {
    switch (activeTab) {
      case "attendance": return "attendance-policy";
      case "leave":      return "leave-policy";
      case "allowance":  return "allowance-policies";
      case "deduction":  return "deduction-policies";
      case "bonus":      return "bonus-policies";
      case "insurance":  return "insurance-policies";
      case "payroll_cycle":  return "payroll-cycle-policies";
      case "penalty_rule":   return "rules-penalty";
      case "bonus_rule":     return "rules-bonus";
      case "allowance_rule": return "rules-allowance";
      case "leave_rule":     return "rules-leave";
      case "tax":            return "tax";
      case "eos":            return "eos";
      case "holidays":       return "official-holidays";
      default: return "";
    }
  };

  const handleClone = async (id: number) => {
    const endpoint = getEndpoint();
    if (!endpoint || activeTab !== "attendance") {
      // clone فقط للـ attendance policies حالياً
      toast.info(ar ? "النسخ متاح لسياسات الحضور فقط حالياً" : "Clone only for attendance policies");
      return;
    }
    setActionLoading(id);
    try {
      const res = await fetch(`/api/hr/policies/${endpoint}/${id}/clone`, {
        method: "POST",
        headers: { Authorization: authH, "Accept-Language": langH },
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        toast.success(ar ? "تم إنشاء نسخة ✅" : "Cloned âœ…");
        await load();
      } else {
        toast.error(data.error || (ar ? "فشل" : "Failed"));
      }
    } catch { toast.error(ar ? "خطأ" : "Error"); }
    finally { setActionLoading(null); }
  };

  const handleApprove = async (id: number) => {
    const endpoint = getEndpoint();
    if (!endpoint) return;
    if (!confirm(ar ? "اعتماد السياسة؟ لن يمكن تعديلها بعد الاعتماد" : "Approve? Cannot edit after.")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/hr/policies/${endpoint}/${id}/approve`, {
        method: "POST",
        headers: { Authorization: authH },
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        toast.success(ar ? "تم الاعتماد ✅" : "Approved âœ…");
        await load();
      } else {
        toast.error(data.error || (ar ? "فشل" : "Failed"));
      }
    } catch { toast.error(ar ? "خطأ" : "Error"); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async (id: number) => {
    const endpoint = getEndpoint();
    if (!endpoint) return;
    if (!confirm(ar ? "حذف السياسة؟" : "Delete?")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/hr/policies/${endpoint}/${id}`, {
        method: "DELETE",
        headers: { Authorization: authH },
      });
      if (res.ok) {
        toast.success(ar ? "تم الحذف ✅" : "Deleted âœ…");
        await load();
      } else {
        const data = await res.json();
        toast.error(data.error || (ar ? "فشل" : "Failed"));
      }
    } catch { toast.error(ar ? "خطأ" : "Error"); }
    finally { setActionLoading(null); }
  };

  const openEditDialog = (id: number) => {
    setEditingPolicyId(id);
    if (activeTab === "attendance") setShowAttendanceDialog(true);
    else if (activeTab === "leave") setShowLeaveDialog(true);
    else if (activeTab === "insurance") setShowInsuranceDialog(true);
    else if (activeTab === "payroll_cycle") setShowPayrollCycleDialog(true);
    else if (activeTab === "penalty_rule") setShowPenaltyRuleDialog(true);
    else if (activeTab === "bonus_rule") setShowBonusRuleDialog(true);
    else if (activeTab === "allowance_rule") setShowAllowanceRuleDialog(true);
    else if (activeTab === "leave_rule") setShowLeaveRuleDialog(true);
    else if (activeTab === "tax") { setEditingTax(taxPolicies.find(p => p.id === id) || null); setShowTaxDialog(true); }
    else if (activeTab === "eos") { setEditingEos(eosPolicies.find(p => p.id === id) || null); setShowEosDialog(true); }
    else if (activeTab === "holidays") { setEditingHolidayId(id); setShowHolidayDialog(true); }
    else {
      setPayrollKind(activeTab as "allowance" | "deduction" | "bonus");
      setShowPayrollDialog(true);
    }
  };

  const openCreateDialog = () => {
    setEditingPolicyId(null);
    if (activeTab === "attendance") setShowAttendanceDialog(true);
    else if (activeTab === "leave") setShowLeaveDialog(true);
    else if (activeTab === "insurance") setShowInsuranceDialog(true);
    else if (activeTab === "payroll_cycle") setShowPayrollCycleDialog(true);
    else if (activeTab === "penalty_rule") setShowPenaltyRuleDialog(true);
    else if (activeTab === "bonus_rule") setShowBonusRuleDialog(true);
    else if (activeTab === "allowance_rule") setShowAllowanceRuleDialog(true);
    else if (activeTab === "leave_rule") setShowLeaveRuleDialog(true);
    else if (activeTab === "tax") { setEditingTax(null); setShowTaxDialog(true); }
    else if (activeTab === "eos") { setEditingEos(null); setShowEosDialog(true); }
    else {
      setPayrollKind(activeTab as "allowance" | "deduction" | "bonus");
      setShowPayrollDialog(true);
    }
  };

  const getCurrentList = (): PolicyItem[] => {
    switch (activeTab) {
      case "attendance": return attendance;
      case "leave":      return leaves;
      case "allowance":  return allowances;
      case "deduction":  return deductions;
      case "bonus":      return bonuses;
      default: return [];
    }
  };

  // â”€â”€ Render Policy List â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const renderPolicyList = () => {
    const list = getCurrentList();

    if (list.length === 0) {
      return (
        <Card>
          <CardContent className="py-16 text-center">
            <Info className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">{ar ? "لا توجد سياسات" : "No policies"}</p>
            <Button onClick={openCreateDialog} className="gap-2 bg-brand-primary hover:bg-brand-secondary">
              <Plus className="w-4 h-4" />
              {ar ? "إضافة" : "Add"}
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        {list.map(item => {
          const isActive = item.status === "active";
          const isDraft  = item.status === "draft";
          const isLoading = actionLoading === item.id;
          const isPayroll = ["allowance", "deduction", "bonus"].includes(activeTab);
          return (
            <Card key={item.id} className="hover:shadow-md transition">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold">{item.name}</p>
                      {item.status && (
                        <Badge className={`border-0 text-[10px] ${
                          isActive ? "bg-emerald-500/10 text-emerald-700" :
                          isDraft  ? "bg-amber-500/10 text-amber-700" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {isActive ? (ar ? "نشط" : "Active") :
                           isDraft  ? (ar ? "مسودة" : "Draft") :
                           (ar ? "مؤرشف" : "Archived")}
                        </Badge>
                      )}
                    </div>
                    {item.effective_from && (
                      <p className="text-xs text-muted-foreground">
                        {ar ? "من" : "From"}: {item.effective_from}
                        {item.effective_to && ` → ${item.effective_to}`}
                      </p>
                    )}
                    {isPayroll && item.amount !== undefined && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {ar ? "القيمة" : "Value"}: <span className="font-semibold">{item.amount}</span>
                        {item.amount_type === "percent" ? " %" :
                         item.amount_type === "hourly"  ? " EGP/hr" : " EGP"}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Payroll policies: تعديل مباشر */}
                    {isPayroll ? (
                      <>
                        <Button size="sm" variant="ghost" className="gap-1" disabled={isLoading}
                          onClick={() => openEditDialog(item.id)}>
                          <Edit2 className="w-3 h-3" />
                          {ar ? "تعديل" : "Edit"}
                        </Button>
                        <Button size="sm" variant="ghost" className="gap-1 text-red-700 hover:bg-red-50"
                          disabled={isLoading} onClick={() => handleDelete(item.id)}>
                          <Trash2 className="w-3 h-3" />
                          {ar ? "حذف" : "Delete"}
                        </Button>
                      <OfficialHolidayDialog
        open={showHolidayDialog}
        onClose={() => { setShowHolidayDialog(false); setEditingHolidayId(null); }}
        onSaved={load}
        holidayId={editingHolidayId}
        ar={ar}
      />
      </>
                    ) : (
                      <>
                        {isDraft && (
                          <>
                            <Button size="sm" variant="ghost" className="gap-1" disabled={isLoading}
                              onClick={() => openEditDialog(item.id)}>
                              <Edit2 className="w-3 h-3" />
                              {ar ? "تعديل" : "Edit"}
                            </Button>
                            <Button size="sm" variant="ghost" className="gap-1 text-emerald-700 hover:bg-emerald-50"
                              disabled={isLoading} onClick={() => handleApprove(item.id)}>
                              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                              {ar ? "اعتماد" : "Approve"}
                            </Button>
                            <Button size="sm" variant="ghost" className="gap-1 text-red-700 hover:bg-red-50"
                              disabled={isLoading} onClick={() => handleDelete(item.id)}>
                              <Trash2 className="w-3 h-3" />
                              {ar ? "حذف" : "Delete"}
                            </Button>
                          </>
                        )}
                        {isActive && activeTab === "attendance" && (
                          <Button size="sm" variant="ghost" className="gap-1" disabled={isLoading}
                            onClick={() => handleClone(item.id)}>
                            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Copy className="w-3 h-3" />}
                            {ar ? "نسخ" : "Clone"}
                          </Button>
                        )}
                        {isActive && activeTab !== "attendance" && (
                          <Button size="sm" variant="ghost" className="gap-1"
                            onClick={() => openEditDialog(item.id)}>
                            <Info className="w-3 h-3" />
                            {ar ? "عرض" : "View"}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };


  // ─── Render Insurance Section ───────────────────────────
  const renderInsuranceList = () => {
    const filtered = insurances.filter(p => {
      if (insuranceSubTab === "all") return true;
      return p.insurance_type === insuranceSubTab;
    });

    const socialCount = insurances.filter(p => p.insurance_type === "social" && !p.is_superseded).length;
    const medicalCount = insurances.filter(p => p.insurance_type === "medical" && !p.is_superseded).length;

    return (
      <div className="space-y-4">
        <div className="flex gap-2 border-b">
          {[
            { key: "all",     label_ar: `الكل (${insurances.length})`,      label_en: `All (${insurances.length})`,      color: "text-slate-600" },
            { key: "social",  label_ar: `اجتماعي (${socialCount})`,        label_en: `Social (${socialCount})`,         color: "text-blue-600" },
            { key: "medical", label_ar: `طبي (${medicalCount})`,           label_en: `Medical (${medicalCount})`,       color: "text-emerald-600" },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setInsuranceSubTab(t.key as "all" | "social" | "medical")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                insuranceSubTab === t.key
                  ? `${t.color} border-current`
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              {ar ? t.label_ar : t.label_en}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Shield className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground mb-4">
                {ar ? "لا توجد سياسات تأمين" : "No insurance policies"}
              </p>
              <Button onClick={openCreateDialog} className="gap-2 bg-teal-600 hover:bg-teal-700">
                <Plus className="w-4 h-4" />
                {ar ? "إضافة سياسة تأمين" : "Add Insurance Policy"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(policy => {
              const isSocial = policy.insurance_type === "social";
              const colorBg = isSocial ? "bg-blue-500/10" : "bg-emerald-500/10";
              const colorText = isSocial ? "text-blue-700" : "text-emerald-700";
              const colorBorder = isSocial ? "border-blue-200" : "border-emerald-200";
              const isLoading = actionLoading === policy.id;

              return (
                <Card
                  key={policy.id}
                  className={`border-2 ${colorBorder} ${policy.is_superseded ? "opacity-60" : ""}`}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <div className={`w-8 h-8 rounded-lg ${colorBg} flex items-center justify-center shrink-0`}>
                          <Shield className={`w-4 h-4 ${colorText}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate">{policy.name_ar}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {isSocial ? (ar ? "تأمين اجتماعي" : "Social") : (ar ? "تأمين طبي" : "Medical")}
                            {" · "}
                            {ar ? "نسخة" : "v"}{policy.version_number}
                          </p>
                        </div>
                      </div>
                      {policy.is_superseded && (
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {ar ? "مقفلة" : "Superseded"}
                        </Badge>
                      )}
                      {!policy.is_active && !policy.is_superseded && (
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {ar ? "معطلة" : "Inactive"}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded bg-slate-50">
                        <p className="text-muted-foreground">{ar ? "حصة الشركة" : "Company"}</p>
                        <p className="font-semibold">
                          {policy.company_share_value}{policy.company_share_type === "percent" ? "%" : " EGP"}
                        </p>
                      </div>
                      <div className="p-2 rounded bg-slate-50">
                        <p className="text-muted-foreground">{ar ? "حصة الموظف" : "Employee"}</p>
                        <p className="font-semibold">
                          {policy.employee_share_value}{policy.employee_share_type === "percent" ? "%" : " EGP"}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <p>{policy.scope_display} {policy.branch_name ? `· ${policy.branch_name}` : ""}{policy.department_name ? `· ${policy.department_name}` : ""}</p>
                      <p className="mt-1">
                        {ar ? "من" : "From"} {policy.start_date}
                        {policy.end_date && (
                          <> · {ar ? "إلى" : "To"} {policy.end_date}</>
                        )}
                      </p>
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline" size="sm"
                        className="flex-1 gap-1.5"
                        onClick={() => openEditDialog(policy.id)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        {ar ? "تعديل" : "Edit"}
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        className="text-red-600 hover:text-red-700"
                        disabled={isLoading}
                        onClick={() => handleDelete(policy.id)}
                      >
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };


  // Render Payroll Cycle Section
  const renderPayrollCycleList = () => {
    return (
      <div className="space-y-4">
        {payrollCycles.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground mb-4">
                {ar ? "لا توجد سياسة دورة رواتب" : "No payroll cycle policy"}
              </p>
              <Button onClick={openCreateDialog} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4" />
                {ar ? "إنشاء سياسة دورة رواتب" : "Create Payroll Cycle"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {payrollCycles.map(policy => {
              const isLoading = actionLoading === policy.id;
              return (
                <Card key={policy.id} className={`border-2 border-indigo-200 ${policy.is_superseded ? "opacity-60" : ""}`}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                          <Calendar className="w-4 h-4 text-indigo-700" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm">{policy.cycle_type_display}</p>
                          <p className="text-xs text-muted-foreground">
                            {ar ? "نسخة" : "v"}{policy.version_number} · {policy.default_currency}
                          </p>
                        </div>
                      </div>
                      {policy.is_superseded && (
                        <Badge variant="secondary" className="text-[10px] shrink-0">{ar ? "مقفلة" : "Superseded"}</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded bg-slate-50">
                        <p className="text-muted-foreground">{ar ? "يوم الصرف" : "Pay Day"}</p>
                        <p className="font-semibold">{policy.pay_day}</p>
                      </div>
                      <div className="p-2 rounded bg-slate-50">
                        <p className="text-muted-foreground">{ar ? "الحساب" : "Calculation"}</p>
                        <p className="font-semibold text-xs">{policy.proration_method_display}</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p>{ar ? "لو عطلة:" : "If Holiday:"} {policy.holiday_handling_display}</p>
                      <p className="mt-1">{ar ? "الموافقة:" : "Approval:"} {policy.approval_level_display}</p>
                      <p className="mt-1">
                        {ar ? "من" : "From"} {policy.start_date}
                        {policy.end_date && (<> · {ar ? "إلى" : "To"} {policy.end_date}</>)}
                      </p>
                    </div>
                    <div className="flex gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => openEditDialog(policy.id)}>
                        <Edit2 className="w-3.5 h-3.5" />
                        {ar ? "تعديل" : "Edit"}
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" disabled={isLoading} onClick={() => handleDelete(policy.id)}>
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };


  // ═══ Render Penalty Rules ═══
  const renderPenaltyRuleList = () => {
    return (
      <div className="space-y-4">
        {penaltyRules.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <TrendingDown className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground mb-4">{ar ? "لا توجد قواعد جزاءات" : "No penalty rules"}</p>
              <Button onClick={openCreateDialog} className="gap-2 bg-red-600 hover:bg-red-700">
                <Plus className="w-4 h-4" />
                {ar ? "إنشاء قاعدة جزاء" : "Create Penalty Rule"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {penaltyRules.map(rule => {
              const isLoading = actionLoading === rule.id;
              return (
                <Card key={rule.id} className={`border-2 border-red-200 ${rule.is_superseded ? "opacity-60" : ""}`}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                          <TrendingDown className="w-4 h-4 text-red-700" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm">{rule.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {rule.penalty_type_display} · {ar ? "نسخة" : "v"}{rule.version_number}
                          </p>
                        </div>
                      </div>
                      {rule.is_superseded && <Badge variant="secondary" className="text-[10px] shrink-0">{ar ? "مقفلة" : "Superseded"}</Badge>}
                    </div>
                    <div className="text-xs bg-slate-50 p-2 rounded">
                      <p className="font-semibold mb-1">{ar ? `الشرائح (${rule.tiers.length}):` : `Tiers (${rule.tiers.length}):`}</p>
                      {rule.tiers.slice(0, 3).map((t, i) => (
                        <p key={i} className="text-muted-foreground">
                          • {ar ? `من ${t.from} ${t.to !== null ? `إلى ${t.to}` : "فأكثر"}` : `${t.from}-${t.to ?? '∞'}`}
                        </p>
                      ))}
                      {rule.tiers.length > 3 && <p className="text-muted-foreground">... +{rule.tiers.length - 3}</p>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p>{rule.scope_display}
                        {rule.branch_name && ` · ${rule.branch_name}`}
                        {rule.department_name && ` · ${rule.department_name}`}
                        {rule.specific_employees.length > 0 && ` · ${rule.specific_employees.length} ${ar ? "موظف" : "employees"}`}
                      </p>
                      <p className="mt-1">{ar ? "من" : "From"} {rule.start_date}{rule.end_date && (<> · {ar ? "إلى" : "To"} {rule.end_date}</>)}</p>
                    </div>
                    <div className="flex gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => openEditDialog(rule.id)}>
                        <Edit2 className="w-3.5 h-3.5" />{ar ? "تعديل" : "Edit"}
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" disabled={isLoading} onClick={() => handleDelete(rule.id)}>
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ═══ Render Bonus Rules ═══
  const renderBonusRuleList = () => {
    return (
      <div className="space-y-4">
        {bonusRules.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Award className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground mb-4">{ar ? "لا توجد قواعد مكافآت" : "No bonus rules"}</p>
              <Button onClick={openCreateDialog} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4" />
                {ar ? "إنشاء قاعدة مكافأة" : "Create Bonus Rule"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bonusRules.map(rule => {
              const isLoading = actionLoading === rule.id;
              return (
                <Card key={rule.id} className={`border-2 border-emerald-200 ${rule.is_superseded ? "opacity-60" : ""}`}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <Award className="w-4 h-4 text-emerald-700" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm">{rule.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {rule.bonus_type_display} · {ar ? "نسخة" : "v"}{rule.version_number}
                          </p>
                        </div>
                      </div>
                      {rule.is_superseded && <Badge variant="secondary" className="text-[10px] shrink-0">{ar ? "مقفلة" : "Superseded"}</Badge>}
                    </div>
                    <div className="text-xs bg-slate-50 p-2 rounded">
                      <p className="font-semibold mb-1">{ar ? `الشرائح (${rule.tiers.length}):` : `Tiers (${rule.tiers.length}):`}</p>
                      {rule.tiers.slice(0, 3).map((t, i) => (
                        <p key={i} className="text-muted-foreground">
                          • {t.from}-{t.to ?? '∞'}: ×{t.value}
                        </p>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p>{rule.scope_display}
                        {rule.branch_name && ` · ${rule.branch_name}`}
                        {rule.department_name && ` · ${rule.department_name}`}
                        {rule.specific_employees.length > 0 && ` · ${rule.specific_employees.length} ${ar ? "موظف" : "emp"}`}
                      </p>
                      <p className="mt-1">{ar ? "من" : "From"} {rule.start_date}{rule.end_date && (<> · {rule.end_date}</>)}</p>
                    </div>
                    <div className="flex gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => openEditDialog(rule.id)}>
                        <Edit2 className="w-3.5 h-3.5" />{ar ? "تعديل" : "Edit"}
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" disabled={isLoading} onClick={() => handleDelete(rule.id)}>
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ═══ Render Allowance Rules ═══
  const renderAllowanceRuleList = () => {
    return (
      <div className="space-y-4">
        {allowanceRules.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <DollarSign className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground mb-4">{ar ? "لا توجد قواعد بدلات" : "No allowance rules"}</p>
              <Button onClick={openCreateDialog} className="gap-2 bg-amber-600 hover:bg-amber-700">
                <Plus className="w-4 h-4" />
                {ar ? "إنشاء قاعدة بدل" : "Create Allowance Rule"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allowanceRules.map(rule => {
              const isLoading = actionLoading === rule.id;
              return (
                <Card key={rule.id} className={`border-2 border-amber-200 ${rule.is_superseded ? "opacity-60" : ""}`}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                          <DollarSign className="w-4 h-4 text-amber-700" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm">{rule.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {rule.allowance_type_display} · {ar ? "نسخة" : "v"}{rule.version_number}
                          </p>
                        </div>
                      </div>
                      {rule.is_superseded && <Badge variant="secondary" className="text-[10px] shrink-0">{ar ? "مقفلة" : "Superseded"}</Badge>}
                    </div>
                    <div className="text-xs bg-slate-50 p-2 rounded">
                      {rule.calculation_type !== "tiered" ? (
                        <p>{ar ? "المبلغ" : "Amount"}: <span className="font-semibold">{rule.fixed_amount} EGP</span></p>
                      ) : (
                        <p className="font-semibold">{ar ? `الشرائح: ${rule.tiers.length}` : `Tiers: ${rule.tiers.length}`}</p>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p>{rule.scope_display}
                        {rule.branch_name && ` · ${rule.branch_name}`}
                        {rule.department_name && ` · ${rule.department_name}`}
                        {rule.specific_employees.length > 0 && ` · ${rule.specific_employees.length} ${ar ? "موظف" : "emp"}`}
                      </p>
                      <p className="mt-1">{ar ? "من" : "From"} {rule.start_date}{rule.end_date && (<> · {rule.end_date}</>)}</p>
                    </div>
                    <div className="flex gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => openEditDialog(rule.id)}>
                        <Edit2 className="w-3.5 h-3.5" />{ar ? "تعديل" : "Edit"}
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" disabled={isLoading} onClick={() => handleDelete(rule.id)}>
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };


  // ═══ Render Leave Rules ═══

  // ─── Render Official Holidays ───────────────────────────
  const renderHolidaysList = () => {
    return (
      <div className="space-y-4">
        {holidays.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">{ar ? "لا توجد أعياد رسمية" : "No official holidays"}</p>
            <button
              onClick={openCreateDialog}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <span>+</span>
              {ar ? "إضافة عيد رسمي" : "Add Official Holiday"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {holidays.map((h) => {
              const isLoading = actionLoading === h.id;
              return (
                <div key={h.id} className="border-2 border-purple-200 rounded-xl p-4 space-y-3 bg-white hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-base">{h.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {h.start_date} → {h.end_date}
                        {h.days_count && <span className="mr-2">({h.days_count} {ar ? "أيام" : "days"})</span>}
                      </p>
                    </div>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">
                      {ar ? `${h.rules?.length || 0} قواعد` : `${h.rules?.length || 0} rules`}
                    </span>
                  </div>
                  {h.notes && (
                    <p className="text-xs text-muted-foreground">{h.notes}</p>
                  )}
                  {h.rules?.slice(0, 2).map((r: any, i: number) => (
                    <div key={i} className="text-xs bg-purple-50 rounded px-2 py-1">
                      {r.scope_display} → {r.treatment_display}
                    </div>
                  ))}
                  <div className="flex gap-2 pt-2 border-t">
                    <button
                      onClick={() => openEditDialog(h.id)}
                      className="flex-1 flex items-center justify-center gap-1 border rounded-lg py-1.5 text-sm hover:bg-slate-50"
                    >
                      ✏️ {ar ? "تعديل" : "Edit"}
                    </button>
                    <button
                      onClick={() => handleDelete(h.id)}
                      disabled={isLoading}
                      className="border rounded-lg py-1.5 px-3 text-red-600 hover:bg-red-50 text-sm"
                    >
                      {isLoading ? "..." : "🗑"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderTaxList = () => {
    const active = taxPolicies.filter(p => !p.is_superseded);
    return (
      <div className="space-y-4">
        {active.length === 0 ? (
          <Card className="border-dashed"><CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-3">{ar ? "لا توجد سياسة ضرائب" : "No tax policy"}</p>
            <Button onClick={openCreateDialog} className="gap-2 bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4" />{ar ? "إنشاء سياسة ضرائب" : "Create Tax Policy"}
            </Button>
          </CardContent></Card>
        ) : active.map(policy => (
          <Card key={policy.id} className="border-orange-200 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg">{policy.name}</h3>
                  <p className="text-sm text-gray-500">
                    {ar ? "إعفاء شخصي:" : "Personal exemption:"} {policy.personal_exemption?.toLocaleString()} EGP
                  </p>
                </div>
                <Badge className="bg-orange-100 text-orange-700">
                  {ar ? `${policy.brackets?.length || 0} شرائح` : `${policy.brackets?.length || 0} brackets`}
                </Badge>
              </div>
              {policy.brackets && (
                <div className="space-y-1 mb-3">
                  {policy.brackets.map((b: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm bg-orange-50 rounded px-3 py-1.5">
                      <span>{b.from_amount?.toLocaleString()} - {b.to_amount ? b.to_amount.toLocaleString() : "\u221E"} EGP</span>
                      <span className="font-bold text-orange-700">{b.rate}%</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => openEditDialog(policy.id)}>
                  <Edit2 className="w-3.5 h-3.5" />{ar ? "تعديل" : "Edit"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderEosList = () => {
    const active = eosPolicies.filter(p => !p.is_superseded);
    return (
      <div className="space-y-4">
        {active.length === 0 ? (
          <Card className="border-dashed"><CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-3">{ar ? "لا توجد سياسة مكافأة نهاية الخدمة" : "No end of service policy"}</p>
            <Button onClick={openCreateDialog} className="gap-2 bg-amber-600 hover:bg-amber-700">
              <Plus className="w-4 h-4" />{ar ? "إنشاء سياسة مكافأة" : "Create EOS Policy"}
            </Button>
          </CardContent></Card>
        ) : active.map(policy => (
          <Card key={policy.id} className="border-amber-200 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg">{policy.name}</h3>
                  <p className="text-sm text-gray-500">
                    {ar ? "أساس الحساب:" : "Salary base:"} {policy.salary_base === "last" ? (ar ? "آخر مرتب" : "Last salary") : policy.salary_base === "avg3" ? (ar ? "متوسط 3 شهور" : "Avg 3 months") : (ar ? "متوسط 12 شهر" : "Avg 12 months")}
                  </p>
                </div>
                <Badge className="bg-amber-100 text-amber-700">
                  {ar ? `${policy.tiers?.length || 0} شرائح` : `${policy.tiers?.length || 0} tiers`}
                </Badge>
              </div>
              {policy.tiers && (
                <div className="space-y-1 mb-3">
                  {policy.tiers.map((t: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm bg-amber-50 rounded px-3 py-1.5">
                      <span>{t.from_year} - {t.to_year ?? "\u221E"} {ar ? "سنة" : "years"}</span>
                      <span className="font-bold text-amber-700">{t.months_per_year} {ar ? "شهر/سنة" : "mo/yr"}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => openEditDialog(policy.id)}>
                  <Edit2 className="w-3.5 h-3.5" />{ar ? "تعديل" : "Edit"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderLeaveRuleList = () => {
    return (
      <div className="space-y-4">
        {leaveRules.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground mb-4">{ar ? "لا توجد قواعد إجازات" : "No leave rules"}</p>
              <Button onClick={openCreateDialog} className="gap-2 bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4" />
                {ar ? "إنشاء قواعد إجازات" : "Create Leave Rules"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leaveRules.map(rule => {
              const isLoading = actionLoading === rule.id;
              return (
                <Card key={rule.id} className={`border-2 border-purple-200 ${rule.is_superseded ? "opacity-60" : ""}`}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                          <Calendar className="w-4 h-4 text-purple-700" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm">{rule.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {ar ? "نسخة" : "v"}{rule.version_number} · {rule.scope_display}
                          </p>
                        </div>
                      </div>
                      {rule.is_superseded && <Badge variant="secondary" className="text-[10px] shrink-0">{ar ? "مقفلة" : "Superseded"}</Badge>}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded bg-blue-50">
                        <p className="text-muted-foreground">{ar ? "سنوية" : "Annual"}</p>
                        <p className="font-semibold text-blue-700">{rule.annual_leave_days} {ar ? "يوم" : "days"}</p>
                      </div>
                      <div className="p-2 rounded bg-red-50">
                        <p className="text-muted-foreground">{ar ? "مرضية" : "Sick"}</p>
                        <p className="font-semibold text-red-700">{rule.sick_leave_max_days} {ar ? "يوم" : "days"}</p>
                      </div>
                      <div className="p-2 rounded bg-yellow-50">
                        <p className="text-muted-foreground">{ar ? "طارئة" : "Emergency"}</p>
                        <p className="font-semibold text-yellow-700">{rule.emergency_max_days} {ar ? "يوم" : "days"}</p>
                      </div>
                      <div className="p-2 rounded bg-pink-50">
                        <p className="text-muted-foreground">{ar ? "أمومة" : "Maternity"}</p>
                        <p className="font-semibold text-pink-700">{rule.maternity_days} {ar ? "يوم" : "days"}</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {rule.branch_name && <p>{ar ? "الفرع:" : "Branch:"} {rule.branch_name}</p>}
                      {rule.department_name && <p>{ar ? "الإدارة:" : "Dept:"} {rule.department_name}</p>}
                      {rule.specific_employees.length > 0 && <p>{rule.specific_employees.length} {ar ? "موظف" : "emp"}</p>}
                      <p className="mt-1">{ar ? "من" : "From"} {rule.start_date}{rule.end_date && (<> · {rule.end_date}</>)}</p>
                    </div>
                    <div className="flex gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => openEditDialog(rule.id)}>
                        <Edit2 className="w-3.5 h-3.5" />{ar ? "تعديل" : "Edit"}
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" disabled={isLoading} onClick={() => handleDelete(rule.id)}>
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{ar ? "السياسات" : "Policies"}</h1>
        <p className="text-muted-foreground mt-1">
          {ar ? "إدارة كل سياسات الشركة" : "Manage all company policies"}
        </p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`p-4 rounded-xl border-2 text-center transition ${
                active
                  ? "border-brand-primary bg-brand-primary/5"
                  : "border-border hover:border-brand-primary/30"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl ${tab.color} flex items-center justify-center mx-auto mb-2`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium">{ar ? tab.label_ar : tab.label_en}</p>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              {(() => {
                const tab = TABS.find(t => t.key === activeTab);
                if (!tab) return null;
                const Icon = tab.icon;
                return (
                  <>
                    <div className={`w-8 h-8 rounded-lg ${tab.color} flex items-center justify-center`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {ar ? tab.label_ar : tab.label_en}
                  </>
                );
              })()}
            </h2>
            {activeTab !== "work" && (
              <Button onClick={openCreateDialog} className="gap-2 bg-brand-primary hover:bg-brand-secondary">
                <Plus className="w-4 h-4" />
                {ar ? "إضافة" : "Add"}
              </Button>
            )}
          </div>

          {activeTab === "work" && workPolicy ? (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b">
                  <div>
                    <p className="font-semibold">{ar ? "أيام العمل الأسبوعية" : "Weekly Work Days"}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {ar ? "اختر أيام العمل الرسمية" : "Select official work days"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">24/7</span>
                    <button
                      onClick={() => setWorkPolicy({ ...workPolicy, is_24_7: !workPolicy.is_24_7 })}
                      className={`relative w-10 h-6 rounded-full transition ${
                        workPolicy.is_24_7 ? "bg-brand-primary" : "bg-slate-300"
                      }`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${
                        workPolicy.is_24_7 ? (ar ? "right-1" : "left-1") : (ar ? "right-5" : "left-5")
                      }`} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {DAYS.map(day => {
                    const isActive = workPolicy[day.key as keyof WorkPolicy];
                    return (
                      <button
                        key={day.key}
                        onClick={() => toggleDay(day.key as keyof WorkPolicy)}
                        disabled={workPolicy.is_24_7}
                        className={`p-4 rounded-xl border-2 transition ${
                          isActive
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-700"
                            : "border-slate-200 bg-slate-50 text-slate-500"
                        } ${workPolicy.is_24_7 ? "opacity-50 cursor-not-allowed" : "hover:border-brand-primary/50"}`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {isActive && <CheckCircle2 className="w-4 h-4" />}
                          <span className="font-medium text-sm">{ar ? day.label_ar : day.label_en}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="pt-4 border-t flex justify-end">
                  <Button onClick={saveWorkPolicy} disabled={saving}
                    className="gap-2 bg-brand-primary hover:bg-brand-secondary">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {ar ? "حفظ السياسة" : "Save Policy"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            activeTab === "insurance" ? renderInsuranceList() : activeTab === "payroll_cycle" ? renderPayrollCycleList() : activeTab === "penalty_rule" ? renderPenaltyRuleList() : activeTab === "bonus_rule" ? renderBonusRuleList() : activeTab === "allowance_rule" ? renderAllowanceRuleList() : activeTab === "leave_rule" ? renderLeaveRuleList() : activeTab === "tax" ? renderTaxList() : activeTab === "eos" ? renderEosList() : activeTab === "holidays" ? renderHolidaysList() : renderPolicyList()
          )}
        </>
      )}

      {/* Dialogs */}
      <AttendancePolicyDialog
        open={showAttendanceDialog}
        onClose={() => { setShowAttendanceDialog(false); setEditingPolicyId(null); }}
        onSaved={load}
        policyId={editingPolicyId}
        ar={ar}
      />

      <LeavePolicyDialog
        open={showLeaveDialog}
        onClose={() => { setShowLeaveDialog(false); setEditingPolicyId(null); }}
        onSaved={load}
        policyId={editingPolicyId}
        ar={ar}
      />

      <PayrollPolicyDialog
        open={showPayrollDialog}
        onClose={() => { setShowPayrollDialog(false); setEditingPolicyId(null); }}
        onSaved={load}
        policyId={editingPolicyId}
        kind={payrollKind}
        ar={ar}
      />

      <PayrollCyclePolicyDialog
        open={showPayrollCycleDialog}
        onClose={() => { setShowPayrollCycleDialog(false); setEditingPolicyId(null); }}
        onSaved={load}
        policyId={editingPolicyId}
        ar={ar}
      />

      <PenaltyRuleDialog
        open={showPenaltyRuleDialog}
        onClose={() => { setShowPenaltyRuleDialog(false); setEditingPolicyId(null); }}
        onSaved={load}
        ruleId={editingPolicyId}
        ar={ar}
      />

      <BonusRuleDialog
        open={showBonusRuleDialog}
        onClose={() => { setShowBonusRuleDialog(false); setEditingPolicyId(null); }}
        onSaved={load}
        ruleId={editingPolicyId}
        ar={ar}
      />

      <LeaveRuleDialog
        open={showLeaveRuleDialog}
        onClose={() => { setShowLeaveRuleDialog(false); setEditingPolicyId(null); }}
        onSaved={load}
        ruleId={editingPolicyId}
        ar={ar}
      />

      <AllowanceRuleDialog
        open={showAllowanceRuleDialog}
        onClose={() => { setShowAllowanceRuleDialog(false); setEditingPolicyId(null); }}
        onSaved={load}
        ruleId={editingPolicyId}
        ar={ar}
      />

      <TaxPolicyDialog
        open={showTaxDialog}
        onClose={() => { setShowTaxDialog(false); setEditingTax(null); }}
        onSaved={load}
        policyId={editingTax?.id ?? null}
        ar={ar}
      />

      <EosPolicyDialog
        open={showEosDialog}
        onClose={() => { setShowEosDialog(false); setEditingEos(null); }}
        onSaved={load}
        existing={editingEos}
      />

      <InsurancePolicyDialog
        open={showInsuranceDialog}
        onClose={() => { setShowInsuranceDialog(false); setEditingPolicyId(null); }}
        onSaved={load}
        policyId={editingPolicyId}
        ar={ar}
      />
    </div>
  );
}







