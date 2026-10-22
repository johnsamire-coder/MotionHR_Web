"use client";

import { useState, useEffect, useCallback, type ComponentType } from "react";
import { toast } from "sonner";
import {
  Clock, Calendar, FileText, Banknote, ShieldAlert,
  Receipt, Landmark, RefreshCw, Plus, Edit2, Loader2, CheckCircle2,
  CalendarX, LogOut, Timer, Moon, Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

// Dialog Components
import AttendancePolicyDialog from "@/components/hr/policies/attendance-policy-dialog";
import LeavePolicyDialog from "@/components/hr/policies/leave-policy-dialog";
import AllowanceRuleDialog from "@/components/hr/policies/allowance-rule-dialog";
import BonusRuleDialog from "@/components/hr/policies/bonus-rule-dialog";
import PenaltyRuleDialog from "@/components/hr/policies/penalty-rule-dialog";
import InsurancePolicyDialog from "@/components/hr/policies/insurance-policy-dialog";
import TaxPolicyDialog from "@/components/hr/policies/tax-policy-dialog";
import EosPolicyDialog from "@/components/hr/policies/eos-policy-dialog";
import PayrollCyclePolicyDialog from "@/components/hr/policies/payroll-cycle-policy-dialog";
import OfficialHolidayDialog from "@/components/hr/policies/official-holiday-dialog";

// كروت غير مربوطة بمحرك الرواتب حالياً — مخفية من الـ hub (الملفات موجودة)
const SHOW_PAYROLL_CYCLE = false;

const ATTENDANCE_STATUS: Record<string, { ar: string; en: string; cls: string }> = {
  draft:    { ar: "مسودة",   en: "Draft",    cls: "bg-amber-100 text-amber-800 border-amber-200" },
  active:   { ar: "معتمدة",  en: "Approved", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  archived: { ar: "مؤرشفة",  en: "Archived", cls: "bg-slate-100 text-slate-700 border-slate-200" },
};

// ── كروت قواعد الحضور والمرتبات: كل بند ليه كارت واحد بس ──
type RuleKind = "penalty" | "bonus";
interface RuleCardDef {
  key: string;
  kind: RuleKind;
  types: string[];
  title_ar: string;
  title_en: string;
  desc_ar: string;
  desc_en: string;
  icon: ComponentType<{ className?: string }>;
  iconCls: string;
}

const RULE_CARDS: RuleCardDef[] = [
  {
    key: "late", kind: "penalty", types: ["late_arrival"],
    title_ar: "التأخير", title_en: "Late Arrival",
    desc_ar: "فترة السماح وشرائح الخصم لكل يوم تأخير", desc_en: "Grace period and deduction tiers per late day",
    icon: Clock, iconCls: "bg-red-500/10 text-red-600",
  },
  {
    key: "absence", kind: "penalty", types: ["absence"],
    title_ar: "الغياب", title_en: "Absence",
    desc_ar: "شرائح تصاعدية لكل يوم غياب في الشهر", desc_en: "Progressive tiers per absence day in the month",
    icon: CalendarX, iconCls: "bg-rose-500/10 text-rose-600",
  },
  {
    key: "early", kind: "penalty", types: ["early_leave", "missing_checkout"],
    title_ar: "الانصراف المبكر ونسيان البصمة", title_en: "Early Leave & Missing Checkout",
    desc_ar: "خصم الخروج قبل الميعاد أو عدم تسجيل الانصراف", desc_en: "Deductions for leaving early or not checking out",
    icon: LogOut, iconCls: "bg-orange-500/10 text-orange-600",
  },
  {
    key: "overtime", kind: "bonus", types: ["overtime"],
    title_ar: "الأوفر تايم", title_en: "Overtime",
    desc_ar: "أقل مدة في اليوم والمعامل والحدود", desc_en: "Minimum per day, multiplier and limits",
    icon: Timer, iconCls: "bg-emerald-500/10 text-emerald-600",
  },
  {
    key: "night", kind: "bonus", types: ["night_shift", "weekend_work", "holiday_work"],
    title_ar: "الشيفت الليلي والعمل في يوم الراحة", title_en: "Night Shift & Rest-day Work",
    desc_ar: "أجر الشيفت الليلي والعمل في الويكند والإجازات الرسمية", desc_en: "Night shift, weekend and holiday work pay",
    icon: Moon, iconCls: "bg-indigo-500/10 text-indigo-600",
  },
];

const isActiveRule = (r: any) => r && r.is_active !== false && !r.is_superseded;

export default function PoliciesPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";

  const [loading, setLoading] = useState(true);

  // Dialog States
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [attendanceId, setAttendanceId]     = useState<number | null>(null);

  const [leaveOpen, setLeaveOpen]           = useState(false);
  const [leaveId, setLeaveId]               = useState<number | null>(null);

  const [allowanceOpen, setAllowanceOpen]   = useState(false);
  const [allowanceId, setAllowanceId]       = useState<number | null>(null);

  const [bonusOpen, setBonusOpen]           = useState(false);
  const [bonusId, setBonusId]               = useState<number | null>(null);

  const [penaltyOpen, setPenaltyOpen]       = useState(false);
  const [penaltyId, setPenaltyId]           = useState<number | null>(null);

  // الأنواع المسموحة في الديالوج حسب الكارت اللي اتفتح منه
  const [penaltyAllowed, setPenaltyAllowed] = useState<string[] | undefined>(undefined);
  const [bonusAllowed, setBonusAllowed]     = useState<string[] | undefined>(undefined);

  const [insuranceOpen, setInsuranceOpen] = useState(false);
  const [insuranceId, setInsuranceId]     = useState<number | null>(null);

  const [taxOpen, setTaxOpen]               = useState(false);
  const [taxId, setTaxId]                   = useState<number | null>(null);

  const [eosOpen, setEosOpen]               = useState(false);
  const [eosId, setEosId]                   = useState<number | null>(null);

  const [payrollCycleOpen, setPayrollCycleOpen] = useState(false);
  const [payrollCycleId, setPayrollCycleId]     = useState<number | null>(null);

  const [holidayOpen, setHolidayOpen]       = useState(false);
  const [approvingId, setApprovingId]       = useState<number | null>(null);

  // Policies Data States
  const [attendancePolicies, setAttendancePolicies]     = useState<any[]>([]);
  const [leavePolicies, setLeavePolicies]               = useState<any[]>([]);
  const [allowancePolicies, setAllowancePolicies]       = useState<any[]>([]);
  const [bonusPolicies, setBonusPolicies]               = useState<any[]>([]);
  const [penaltyPolicies, setPenaltyPolicies]           = useState<any[]>([]);
  const [insurancePolicies, setInsurancePolicies]       = useState<any[]>([]);
  const [taxPolicies, setTaxPolicies]                   = useState<any[]>([]);
  const [eosPolicies, setEosPolicies]                   = useState<any[]>([]);
  const [payrollCyclePolicies, setPayrollCyclePolicies] = useState<any[]>([]);

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") || token?.startsWith("Bearer ") ? token : `Token ${token}`;

  const loadAll = useCallback(() => {
    if (!token) return;
    setLoading(true);

    const extractArray = (res: any) => {
      if (!res) return [];
      if (Array.isArray(res)) return res;
      return res.rules || res.policies || res.allowance_rules || res.bonus_rules || res.penalty_rules || res.insurance_policies || res.tax_policies || res.data || res.results || [];
    };

    Promise.all([
      fetch("/api/hr/policies/attendance-policy", { headers: { Authorization: authH } }).then(r => r.json()).catch(() => ({})),
      fetch("/api/hr/policies/leave-policy", { headers: { Authorization: authH } }).then(r => r.json()).catch(() => ({})),
      fetch("/api/hr/policies/rules-allowance", { headers: { Authorization: authH } }).then(r => r.json()).catch(() => ({})),
      fetch("/api/hr/policies/rules-bonus", { headers: { Authorization: authH } }).then(r => r.json()).catch(() => ({})),
      fetch("/api/hr/policies/rules-penalty", { headers: { Authorization: authH } }).then(r => r.json()).catch(() => ({})),
      fetch("/api/hr/policies/insurance-policies", { headers: { Authorization: authH } }).then(r => r.json()).catch(() => ({})),
      fetch("/api/hr/policies/tax", { headers: { Authorization: authH } }).then(r => r.json()).catch(() => ({})),
      fetch("/api/hr/policies/eos", { headers: { Authorization: authH } }).then(r => r.json()).catch(() => ({})),
      SHOW_PAYROLL_CYCLE
        ? fetch("/api/hr/policies/payroll-cycle-policies", { headers: { Authorization: authH } }).then(r => r.json()).catch(() => ({}))
        : Promise.resolve([]),
    ])
      .then(([att, lv, all, bon, pen, ins, tax, eos, cyc]) => {
        setAttendancePolicies(extractArray(att));
        setLeavePolicies(extractArray(lv));
        setAllowancePolicies(extractArray(all));
        setBonusPolicies(extractArray(bon));
        setPenaltyPolicies(extractArray(pen));
        setInsurancePolicies(extractArray(ins));
        setTaxPolicies(extractArray(tax));
        setEosPolicies(extractArray(eos));
        setPayrollCyclePolicies(extractArray(cyc));
      })
      .finally(() => setLoading(false));
  }, [token, authH]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const approveAttendancePolicy = async (id: number) => {
    setApprovingId(id);
    try {
      const res = await fetch(`/api/hr/policies/attendance-policy/${id}/approve`, {
        method: "POST",
        headers: { Authorization: authH },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success !== false) {
        toast.success(data.message || (ar ? "تم اعتماد السياسة" : "Policy approved"));
        loadAll();
      } else {
        toast.error(data.error || data.message || (ar ? "فشل الاعتماد" : "Approval failed"));
      }
    } catch {
      toast.error(ar ? "خطأ في الاتصال" : "Network error");
    } finally {
      setApprovingId(null);
    }
  };

  const openRuleDialog = (card: RuleCardDef, id: number | null) => {
    if (card.kind === "penalty") {
      setPenaltyAllowed(card.types);
      setPenaltyId(id);
      setPenaltyOpen(true);
    } else {
      setBonusAllowed(card.types);
      setBonusId(id);
      setBonusOpen(true);
    }
  };

  const rulesFor = (card: RuleCardDef) => {
    const src = card.kind === "penalty" ? penaltyPolicies : bonusPolicies;
    const field = card.kind === "penalty" ? "penalty_type" : "bonus_type";
    return src.filter((r: any) => isActiveRule(r) && card.types.includes(r[field]));
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{ar ? "السياسات واللوائح العامة" : "Company Policies & Regulations"}</h1>
          <p className="text-muted-foreground mt-1">
            {ar ? "إدارة وتكوين محرك الرواتب والغياب والإجازات والمكافآت والتأمينات" : "Configure attendance, leaves, bonuses, and insurance policies"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-8">

          {/* Group 1: Attendance & Time */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-brand-primary border-b pb-2 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>{ar ? "سياسات الحضور والانصراف" : "Attendance Group"}</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Attendance Policy Card */}
              <Card 
                className="border-border/60 hover:border-brand-primary/50 hover:shadow-md transition cursor-pointer"
                onClick={() => { setAttendanceId(null); setAttendanceOpen(true); }}
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={(e) => { e.stopPropagation(); setAttendanceId(null); setAttendanceOpen(true); }}>
                      <Plus className="w-3.5 h-3.5" />{ar ? "إضافة سياسة" : "New"}
                    </Button>
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{ar ? "سياسة الحضور والأذونات" : "Attendance & Permissions Policy"}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{ar ? "فترة السريان والنطاق والأذونات الشهرية — قواعد التأخير والغياب والأوفر تايم ليها كروت لوحدها" : "Effective period, scope and monthly permissions — late, absence and overtime rules have their own cards"}</p>
                  </div>
                  <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                    {ar ? "السياسة لا تُطبَّق على الرواتب إلا بعد الاعتماد" : "A policy only applies to payroll after it is approved"}
                  </p>
                  <div className="pt-2 border-t text-xs text-muted-foreground flex justify-between items-center">
                    <span>{ar ? "السياسات المتاحة:" : "Active:"}</span>
                    <Badge variant="secondary" className="font-bold">{attendancePolicies.length}</Badge>
                  </div>
                  {attendancePolicies.length > 0 && (
                    <div className="space-y-1 pt-1 max-h-56 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                      {attendancePolicies.map((p: any) => {
                        const st = ATTENDANCE_STATUS[p.status] || ATTENDANCE_STATUS.draft;
                        return (
                          <div key={p.id} className="flex items-center justify-between gap-2 p-2 bg-muted/30 rounded text-xs hover:bg-muted/60 transition">
                            <span className="font-semibold truncate max-w-[120px]">{p.name || p.rule_name || p.title || (ar ? "سياسة" : "Policy")}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${st.cls}`}>{ar ? st.ar : st.en}</span>
                              {p.status === "draft" && (
                                <Button
                                  variant="outline" size="sm"
                                  className="h-6 px-2 text-[10px] gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                  disabled={approvingId === p.id}
                                  onClick={() => approveAttendancePolicy(p.id)}
                                >
                                  {approvingId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                  {ar ? "اعتماد" : "Approve"}
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setAttendanceId(p.id); setAttendanceOpen(true); }}>
                                <Edit2 className="w-3 h-3 text-amber-600" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payroll Cycle Card */}
              {SHOW_PAYROLL_CYCLE && (
              <Card 
                className="border-border/60 hover:border-brand-primary/50 hover:shadow-md transition cursor-pointer"
                onClick={() => { setPayrollCycleId(null); setPayrollCycleOpen(true); }}
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={(e) => { e.stopPropagation(); setPayrollCycleId(null); setPayrollCycleOpen(true); }}>
                      <Plus className="w-3.5 h-3.5" />{ar ? "تحديد الدورة" : "New"}
                    </Button>
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{ar ? "دورة حساب المرتبات (Cut-off)" : "Payroll Cycle"}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{ar ? "تحديد أيام إغلاق الحضور وصرف الرواتب" : "Payroll start/end cut-off days"}</p>
                  </div>
                  <div className="pt-2 border-t text-xs text-muted-foreground flex justify-between items-center">
                    <span>{ar ? "السياسات المسجلة:" : "Configured:"}</span>
                    <Badge variant="secondary" className="font-bold">{payrollCyclePolicies.length}</Badge>
                  </div>
                  {payrollCyclePolicies.length > 0 && (
                    <div className="space-y-1 pt-1" onClick={(e) => e.stopPropagation()}>
                      {payrollCyclePolicies.slice(0, 3).map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs hover:bg-muted/60 transition">
                          <span className="font-semibold truncate max-w-[170px]">{p.name || `دورة رقم ${p.id}`}</span>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setPayrollCycleId(p.id); setPayrollCycleOpen(true); }}>
                            <Edit2 className="w-3 h-3 text-amber-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              )}

              {/* Official Holidays Card */}
              <Card 
                className="border-border/60 hover:border-brand-primary/50 hover:shadow-md transition cursor-pointer"
                onClick={() => setHolidayOpen(true)}
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-pink-500/10 text-pink-600 flex items-center justify-center">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={(e) => { e.stopPropagation(); setHolidayOpen(true); }}>
                      <Plus className="w-3.5 h-3.5" />{ar ? "إضافة عطلة" : "New"}
                    </Button>
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{ar ? "العطلات والإجازات الرسمية" : "Official Holidays"}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{ar ? "الإجازات العطلات القومية وأيام العمل البديلة" : "National holidays and working days"}</p>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>

          {/* Group 1b: Attendance & Payroll Rules — كل بند ليه مكان واحد بس */}
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h2 className="text-lg font-bold text-brand-primary flex items-center gap-2">
                <Scale className="w-5 h-5" />
                <span>{ar ? "قواعد الحضور والمرتبات" : "Attendance & Payroll Rules"}</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {ar ? "كل بند ليه مكان واحد بس — القاعدة هنا هي اللي بتتطبق على المرتب" : "Each item is defined in one place only — the rule here is what applies to payroll"}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {RULE_CARDS.map((card) => {
                const Icon = card.icon;
                const rules = rulesFor(card);
                return (
                  <Card
                    key={card.key}
                    className="border-border/60 hover:border-brand-primary/50 hover:shadow-md transition cursor-pointer"
                    onClick={() => openRuleDialog(card, null)}
                  >
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.iconCls}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <Button size="sm" variant="outline" className="text-xs gap-1" onClick={(e) => { e.stopPropagation(); openRuleDialog(card, null); }}>
                          <Plus className="w-3.5 h-3.5" />{ar ? "إضافة قاعدة" : "Add Rule"}
                        </Button>
                      </div>
                      <div>
                        <h3 className="font-bold text-base">{ar ? card.title_ar : card.title_en}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{ar ? card.desc_ar : card.desc_en}</p>
                      </div>
                      <div className="pt-2 border-t text-xs text-muted-foreground flex justify-between items-center">
                        <span>{ar ? "القواعد النشطة:" : "Active:"}</span>
                        <Badge variant="secondary" className="font-bold">{rules.length}</Badge>
                      </div>
                      {rules.length > 0 && (
                        <div className="space-y-1 pt-1 max-h-56 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                          {rules.map((p: any) => (
                            <div key={p.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs hover:bg-muted/60 transition">
                              <span className="font-semibold truncate max-w-[170px]">{p.name || p.rule_name || p.title || (ar ? "قاعدة" : "Rule")}</span>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => openRuleDialog(card, p.id)}>
                                <Edit2 className="w-3 h-3 text-amber-600" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Group 2: Leaves */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-brand-primary border-b pb-2 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <span>{ar ? "سياسات وتدرج الإجازات" : "Leaves Group"}</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card 
                className="border-border/60 hover:border-brand-primary/50 hover:shadow-md transition cursor-pointer"
                onClick={() => { setLeaveId(null); setLeaveOpen(true); }}
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={(e) => { e.stopPropagation(); setLeaveId(null); setLeaveOpen(true); }}>
                      <Plus className="w-3.5 h-3.5" />{ar ? "إضافة سياسة" : "New"}
                    </Button>
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{ar ? "سياسات وتدرج الإجازات" : "Leave Policies"}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{ar ? "شرائح الخدمة (0-3 / 4-6 / 7+ شهور) والأرصدة" : "Tenure tiers and entitlement balances"}</p>
                  </div>
                  <div className="pt-2 border-t text-xs text-muted-foreground flex justify-between items-center">
                    <span>{ar ? "السياسات المتاحة:" : "Active:"}</span>
                    <Badge variant="secondary" className="font-bold">{leavePolicies.length}</Badge>
                  </div>
                  {leavePolicies.length > 0 && (
                    <div className="space-y-1 pt-1" onClick={(e) => e.stopPropagation()}>
                      {leavePolicies.slice(0, 3).map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs hover:bg-muted/60 transition">
                          <span className="font-semibold truncate max-w-[170px]">{p.name || p.rule_name || p.allowance_name || p.title || (ar ? "بدل مسجل" : "Policy")}</span>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setLeaveId(p.id); setLeaveOpen(true); }}>
                            <Edit2 className="w-3 h-3 text-amber-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Group 3: Allowances & Bonuses */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-brand-primary border-b pb-2 flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              <span>{ar ? "سياسات البدلات" : "Allowances Group"}</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Allowances */}
              <Card 
                className="border-border/60 hover:border-brand-primary/50 hover:shadow-md transition cursor-pointer"
                onClick={() => { setAllowanceId(null); setAllowanceOpen(true); }}
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={(e) => { e.stopPropagation(); setAllowanceId(null); setAllowanceOpen(true); }}>
                      <Plus className="w-3.5 h-3.5" />{ar ? "إضافة بدل" : "New"}
                    </Button>
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{ar ? "سياسات البدلات الثابتة والمواقع" : "Fixed Allowances"}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{ar ? "بدلات الانتقال والمواقع والمأموريات اليومية" : "Site transport and daily mission allowances"}</p>
                  </div>
                  <div className="pt-2 border-t text-xs text-muted-foreground flex justify-between items-center">
                    <span>{ar ? "السياسات المتاحة:" : "Active:"}</span>
                    <Badge variant="secondary" className="font-bold">{allowancePolicies.length}</Badge>
                  </div>
                  {allowancePolicies.length > 0 && (
                    <div className="space-y-1 pt-1" onClick={(e) => e.stopPropagation()}>
                      {allowancePolicies.slice(0, 3).map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs hover:bg-muted/60 transition">
                          <span className="font-semibold truncate max-w-[170px]">{p.name || p.rule_name || p.allowance_name || p.title || (ar ? "بدل مسجل" : "Policy")}</span>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setAllowanceId(p.id); setAllowanceOpen(true); }}>
                            <Edit2 className="w-3 h-3 text-amber-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          </div>

          {/* Group 4: Insurance, Tax, Penalties, EOS */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-brand-primary border-b pb-2 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              <span>{ar ? "التأمينات والضرائب ونهاية الخدمة" : "Insurance, Tax & EOS Group"}</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Insurance */}
              <Card 
                className="border-border/60 hover:border-brand-primary/50 hover:shadow-md transition cursor-pointer"
                onClick={() => { setInsuranceId(null); setInsuranceOpen(true); }}
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={(e) => { e.stopPropagation(); setInsuranceId(null); setInsuranceOpen(true); }}>
                      <Plus className="w-3.5 h-3.5" />{ar ? "تأمينات" : "New"}
                    </Button>
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{ar ? "التأمينات الاجتماعية" : "Social Insurance"}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{ar ? "الحد الأدنى والأقصى وحصص الموظف والشركة" : "Social insurance limits and shares"}</p>
                  </div>
                  <div className="pt-2 border-t text-xs text-muted-foreground flex justify-between items-center">
                    <span>{ar ? "السياسات المتاحة:" : "Active:"}</span>
                    <Badge variant="secondary" className="font-bold">{insurancePolicies.length}</Badge>
                  </div>
                  {insurancePolicies.length > 0 && (
                    <div className="space-y-1 pt-1" onClick={(e) => e.stopPropagation()}>
                      {insurancePolicies.slice(0, 3).map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs hover:bg-muted/60 transition">
                          <span className="font-semibold truncate max-w-[170px]">{p.name || p.rule_name || p.allowance_name || p.title || (ar ? "بدل مسجل" : "Policy")}</span>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setInsuranceId(p.id); setInsuranceOpen(true); }}>
                            <Edit2 className="w-3 h-3 text-amber-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tax */}
              <Card 
                className="border-border/60 hover:border-brand-primary/50 hover:shadow-md transition cursor-pointer"
                onClick={() => { setTaxId(null); setTaxOpen(true); }}
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-slate-500/10 text-slate-600 flex items-center justify-center">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={(e) => { e.stopPropagation(); setTaxId(null); setTaxOpen(true); }}>
                      <Plus className="w-3.5 h-3.5" />{ar ? "ضرائب" : "New"}
                    </Button>
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{ar ? "شرائح الضرائب والإعفاء" : "Tax Brackets"}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{ar ? "شرائح ضريبة الدخل والحد الشخصي للإعفاء" : "Tax brackets and personal exemption"}</p>
                  </div>
                  <div className="pt-2 border-t text-xs text-muted-foreground flex justify-between items-center">
                    <span>{ar ? "السياسات المتاحة:" : "Active:"}</span>
                    <Badge variant="secondary" className="font-bold">{taxPolicies.length}</Badge>
                  </div>
                  {taxPolicies.length > 0 && (
                    <div className="space-y-1 pt-1" onClick={(e) => e.stopPropagation()}>
                      {taxPolicies.slice(0, 3).map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs hover:bg-muted/60 transition">
                          <span className="font-semibold truncate max-w-[170px]">{p.name || p.rule_name || p.allowance_name || p.title || (ar ? "بدل مسجل" : "Policy")}</span>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setTaxId(p.id); setTaxOpen(true); }}>
                            <Edit2 className="w-3 h-3 text-amber-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* EOS */}
              <Card 
                className="border-border/60 hover:border-brand-primary/50 hover:shadow-md transition cursor-pointer"
                onClick={() => { setEosId(null); setEosOpen(true); }}
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={(e) => { e.stopPropagation(); setEosId(null); setEosOpen(true); }}>
                      <Plus className="w-3.5 h-3.5" />{ar ? "مكافأة" : "New"}
                    </Button>
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{ar ? "مكافأة نهاية الخدمة (EOS)" : "End of Service"}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{ar ? "حساب قيمة مكافأة نهاية الخدمة والاستقالة" : "End of service calculation"}</p>
                  </div>
                  <div className="pt-2 border-t text-xs text-muted-foreground flex justify-between items-center">
                    <span>{ar ? "السياسات المتاحة:" : "Active:"}</span>
                    <Badge variant="secondary" className="font-bold">{eosPolicies.length}</Badge>
                  </div>
                  {eosPolicies.length > 0 && (
                    <div className="space-y-1 pt-1" onClick={(e) => e.stopPropagation()}>
                      {eosPolicies.slice(0, 3).map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs hover:bg-muted/60 transition">
                          <span className="font-semibold truncate max-w-[170px]">{p.name || p.rule_name || p.allowance_name || p.title || (ar ? "بدل مسجل" : "Policy")}</span>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setEosId(p.id); setEosOpen(true); }}>
                            <Edit2 className="w-3 h-3 text-amber-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      )}

      {/* Render All Dialog Modals directly on page */}
      <AttendancePolicyDialog open={attendanceOpen} onClose={() => setAttendanceOpen(false)} onSaved={loadAll} policyId={attendanceId} ar={ar} />
      <LeavePolicyDialog open={leaveOpen} onClose={() => setLeaveOpen(false)} onSaved={loadAll} policyId={leaveId} ar={ar} />
      <AllowanceRuleDialog open={allowanceOpen} onClose={() => setAllowanceOpen(false)} onSaved={loadAll} ruleId={allowanceId} ar={ar} />
      <BonusRuleDialog open={bonusOpen} onClose={() => setBonusOpen(false)} onSaved={loadAll} ruleId={bonusId} ar={ar} allowedTypes={bonusAllowed} />
      <PenaltyRuleDialog open={penaltyOpen} onClose={() => setPenaltyOpen(false)} onSaved={loadAll} ruleId={penaltyId} ar={ar} allowedTypes={penaltyAllowed} />
      <InsurancePolicyDialog open={insuranceOpen} onClose={() => setInsuranceOpen(false)} onSaved={loadAll} policyId={insuranceId} ar={ar} />
      <TaxPolicyDialog open={taxOpen} onClose={() => setTaxOpen(false)} onSaved={loadAll} policyId={taxId} ar={ar} />
      <EosPolicyDialog open={eosOpen} onClose={() => setEosOpen(false)} onSaved={loadAll} policyId={eosId} ar={ar} />
      {SHOW_PAYROLL_CYCLE && <PayrollCyclePolicyDialog open={payrollCycleOpen} onClose={() => setPayrollCycleOpen(false)} onSaved={loadAll} policyId={payrollCycleId} ar={ar} />}
      <OfficialHolidayDialog open={holidayOpen} onClose={() => setHolidayOpen(false)} onSaved={loadAll} ar={ar} />
    </div>
  );
}