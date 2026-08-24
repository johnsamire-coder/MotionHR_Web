"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Clock, Calendar, FileText, Banknote, ShieldAlert, Award, FileSignature,
  Receipt, Landmark, RefreshCw, Plus, Edit2, Trash2, Loader2, CheckCircle2,
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

  const [insuranceOpen, setInsuranceOpen] = useState(false);
  const [insuranceId, setInsuranceId]     = useState<number | null>(null);

  const [taxOpen, setTaxOpen]               = useState(false);
  const [taxId, setTaxId]                   = useState<number | null>(null);

  const [eosOpen, setEosOpen]               = useState(false);
  const [eosId, setEosId]                   = useState<number | null>(null);

  const [payrollCycleOpen, setPayrollCycleOpen] = useState(false);
  const [payrollCycleId, setPayrollCycleId]     = useState<number | null>(null);

  const [holidayOpen, setHolidayOpen]       = useState(false);

  // Policies Data States
  const [attendancePolicies, setAttendancePolicies] = useState<any[]>([]);
  const [leavePolicies, setLeavePolicies]           = useState<any[]>([]);
  const [allowancePolicies, setAllowancePolicies]   = useState<any[]>([]);
  const [bonusPolicies, setBonusPolicies]           = useState<any[]>([]);
  const [penaltyPolicies, setPenaltyPolicies]       = useState<any[]>([]);
  const [insurancePolicies, setInsurancePolicies]   = useState<any[]>([]);
  const [taxPolicies, setTaxPolicies]               = useState<any[]>([]);
  const [eosPolicies, setEosPolicies]               = useState<any[]>([]);
  const [payrollCyclePolicies, setPayrollCyclePolicies] = useState<any[]>([]);

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") || token?.startsWith("Bearer ") ? token : `Token ${token}`;

  const loadAll = useCallback(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      fetch("/api/hr/policies/attendance-policy", { headers: { Authorization: authH } }).then(r => r.json()).catch(() => ({})),
      fetch("/api/hr/policies/leave-policy", { headers: { Authorization: authH } }).then(r => r.json()).catch(() => ({})),
      fetch("/api/hr/policies/allowance-policy", { headers: { Authorization: authH } }).then(r => r.json()).catch(() => ({})),
      fetch("/api/hr/policies/bonus-policy", { headers: { Authorization: authH } }).then(r => r.json()).catch(() => ({})),
      fetch("/api/hr/policies/penalty-rule", { headers: { Authorization: authH } }).then(r => r.json()).catch(() => ({})),
      fetch("/api/hr/policies/insurance-policy", { headers: { Authorization: authH } }).then(r => r.json()).catch(() => ({})),
      fetch("/api/hr/policies/tax-policy", { headers: { Authorization: authH } }).then(r => r.json()).catch(() => ({})),
      fetch("/api/hr/policies/eos-policy", { headers: { Authorization: authH } }).then(r => r.json()).catch(() => ({})),
      fetch("/api/hr/policies/payroll-cycle-policy", { headers: { Authorization: authH } }).then(r => r.json()).catch(() => ({})),
    ])
      .then(([att, lv, all, bon, pen, ins, tax, eos, cyc]) => {
        setAttendancePolicies(att.policies || (Array.isArray(att) ? att : []));
        setLeavePolicies(lv.policies || (Array.isArray(lv) ? lv : []));
        setAllowancePolicies(all.policies || (Array.isArray(all) ? all : []));
        setBonusPolicies(bon.policies || (Array.isArray(bon) ? bon : []));
        setPenaltyPolicies(pen.rules || pen.policies || (Array.isArray(pen) ? pen : []));
        setInsurancePolicies(ins.policies || (Array.isArray(ins) ? ins : []));
        setTaxPolicies(tax.policies || (Array.isArray(tax) ? tax : []));
        setEosPolicies(eos.policies || (Array.isArray(eos) ? eos : []));
        setPayrollCyclePolicies(cyc.policies || (Array.isArray(cyc) ? cyc : []));
      })
      .finally(() => setLoading(false));
  }, [token, authH]);

  useEffect(() => { loadAll(); }, [loadAll]);

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
          {/* Section 1: Attendance & Time */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-brand-primary border-b pb-2 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>{ar ? "سياسات الحضور والانصراف ودورة الرواتب" : "Attendance & Payroll Cycle Group"}</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Attendance Policy Card */}
              <Card className="border-border/60 hover:shadow-md transition">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={(e) => { e.preventDefault(); setAttendanceId(null); setAttendanceOpen(true); }}>
                      <Plus className="w-3.5 h-3.5" />{ar ? "إضافة سياسة" : "New"}
                    </Button>
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{ar ? "سياسات الحضور والغياب" : "Attendance Policy"}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{ar ? "إعدادات التأخيرات والغياب المتدرج والـ Overtime" : "Late rules, progressive absence, overtime"}</p>
                  </div>
                  <div className="pt-2 border-t text-xs text-muted-foreground flex justify-between items-center">
                    <span>{ar ? "السياسات المتاحة:" : "Active:"}</span>
                    <Badge variant="secondary" className="font-bold">{attendancePolicies.length}</Badge>
                  </div>
                  {attendancePolicies.length > 0 && (
                    <div className="space-y-1 pt-1">
                      {attendancePolicies.slice(0, 2).map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                          <span className="font-semibold truncate max-w-[150px]">{p.name}</span>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setAttendanceId(p.id); setAttendanceOpen(true); }}>
                            <Edit2 className="w-3 h-3 text-amber-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payroll Cycle Card */}
              <Card className="border-border/60 hover:shadow-md transition">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={(e) => { e.preventDefault(); setPayrollCycleId(null); setPayrollCycleOpen(true); }}>
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
                    <div className="space-y-1 pt-1">
                      {payrollCyclePolicies.slice(0, 1).map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                          <span className="font-semibold truncate">{p.name}</span>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setPayrollCycleId(p.id); setPayrollCycleOpen(true); }}>
                            <Edit2 className="w-3 h-3 text-amber-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Official Holidays Card */}
              <Card className="border-border/60 hover:shadow-md transition">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-pink-500/10 text-pink-600 flex items-center justify-center">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => setHolidayOpen(true)}>
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

          {/* Section 2: Leaves */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-brand-primary border-b pb-2 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <span>{ar ? "سياسات وتدرج الإجازات" : "Leaves Group"}</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-border/60 hover:shadow-md transition">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={(e) => { e.preventDefault(); setLeaveId(null); setLeaveOpen(true); }}>
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
                    <div className="space-y-1 pt-1">
                      {leavePolicies.slice(0, 2).map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                          <span className="font-semibold truncate max-w-[150px]">{p.name}</span>
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

          {/* Section 3: Allowances & Bonuses */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-brand-primary border-b pb-2 flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              <span>{ar ? "سياسات البدلات والمكافآت" : "Allowances & Bonuses Group"}</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Allowances */}
              <Card className="border-border/60 hover:shadow-md transition">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={(e) => { e.preventDefault(); setAllowanceId(null); setAllowanceOpen(true); }}>
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
                    <div className="space-y-1 pt-1">
                      {allowancePolicies.slice(0, 2).map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                          <span className="font-semibold truncate max-w-[150px]">{p.name}</span>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.preventDefault(); setAllowanceId(p.id); setAllowanceOpen(true); }}>
                            <Edit2 className="w-3 h-3 text-amber-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bonuses */}
              <Card className="border-border/60 hover:shadow-md transition">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/10 text-yellow-600 flex items-center justify-center">
                      <Award className="w-5 h-5" />
                    </div>
                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={(e) => { e.preventDefault(); setBonusId(null); setBonusOpen(true); }}>
                      <Plus className="w-3.5 h-3.5" />{ar ? "إضافة مكافأة" : "New"}
                    </Button>
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{ar ? "سياسات المكافآت والحوافز" : "Bonuses Policy"}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{ar ? "المكافآت والمنح الدورية والانتاجية" : "Periodic and production bonuses"}</p>
                  </div>
                  <div className="pt-2 border-t text-xs text-muted-foreground flex justify-between items-center">
                    <span>{ar ? "السياسات المتاحة:" : "Active:"}</span>
                    <Badge variant="secondary" className="font-bold">{bonusPolicies.length}</Badge>
                  </div>
                  {bonusPolicies.length > 0 && (
                    <div className="space-y-1 pt-1">
                      {bonusPolicies.slice(0, 2).map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                          <span className="font-semibold truncate max-w-[150px]">{p.name}</span>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.preventDefault(); setBonusId(p.id); setBonusOpen(true); }}>
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

          {/* Section 4: Insurance, Tax, Penalties, EOS */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-brand-primary border-b pb-2 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              <span>{ar ? "التأمينات والضرائب والجزاءات ونهاية الخدمة" : "Insurance, Tax, Penalties & EOS Group"}</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Insurance */}
              <Card className="border-border/60 hover:shadow-md transition">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={(e) => { e.preventDefault(); setInsuranceId(null); setInsuranceOpen(true); }}>
                      <Plus className="w-3.5 h-3.5" />{ar ? "تأمينات" : "New"}
                    </Button>
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{ar ? "التأمينات الاجتماعية" : "Social Insurance"}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{ar ? "الحد الأدنى والأقصى وحصص الموظف والشركة" : "Social insurance limits and shares"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Tax */}
              <Card className="border-border/60 hover:shadow-md transition">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-slate-500/10 text-slate-600 flex items-center justify-center">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={(e) => { e.preventDefault(); setTaxId(null); setTaxOpen(true); }}>
                      <Plus className="w-3.5 h-3.5" />{ar ? "ضرائب" : "New"}
                    </Button>
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{ar ? "شرائح الضرائب والإعفاء" : "Tax Brackets"}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{ar ? "شرائح ضريبة الدخل والحد الشخصي للإعفاء" : "Tax brackets and personal exemption"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Penalties */}
              <Card className="border-border/60 hover:shadow-md transition">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center">
                      <FileSignature className="w-5 h-5" />
                    </div>
                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={(e) => { e.preventDefault(); setPenaltyId(null); setPenaltyOpen(true); }}>
                      <Plus className="w-3.5 h-3.5" />{ar ? "إدارية" : "New"}
                    </Button>
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{ar ? "لائحة الجزاءات الإدارية" : "Disciplinary Penalties"}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{ar ? "المخالفات التأديبية والتلفيات (بدون غياب)" : "Administrative & behavioral penalties"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* EOS */}
              <Card className="border-border/60 hover:shadow-md transition">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={(e) => { e.preventDefault(); setEosId(null); setEosOpen(true); }}>
                      <Plus className="w-3.5 h-3.5" />{ar ? "مكافأة" : "New"}
                    </Button>
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{ar ? "مكافأة نهاية الخدمة (EOS)" : "End of Service"}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{ar ? "حساب قيمة مكافأة نهاية الخدمة والاستقالة" : "End of service calculation"}</p>
                  </div>
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
      <BonusRuleDialog open={bonusOpen} onClose={() => setBonusOpen(false)} onSaved={loadAll} ruleId={bonusId} ar={ar} />
      <PenaltyRuleDialog open={penaltyOpen} onClose={() => setPenaltyOpen(false)} onSaved={loadAll} ruleId={penaltyId} ar={ar} />
      <InsurancePolicyDialog open={insuranceOpen} onClose={() => setInsuranceOpen(false)} onSaved={loadAll} policyId={insuranceId} ar={ar} />
      <TaxPolicyDialog open={taxOpen} onClose={() => setTaxOpen(false)} onSaved={loadAll} policyId={taxId} ar={ar} />
      <EosPolicyDialog open={eosOpen} onClose={() => setEosOpen(false)} onSaved={loadAll} policyId={eosId} ar={ar} />
      <PayrollCyclePolicyDialog open={payrollCycleOpen} onClose={() => setPayrollCycleOpen(false)} onSaved={loadAll} policyId={payrollCycleId} ar={ar} />
      <OfficialHolidayDialog open={holidayOpen} onClose={() => setHolidayOpen(false)} onSaved={loadAll} ar={ar} />
    </div>
  );
}