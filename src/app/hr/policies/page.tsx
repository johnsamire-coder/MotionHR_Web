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

type TabKey = "attendance" | "work" | "leave" | "allowance" | "deduction" | "bonus";

const TABS = [
  { key: "attendance",  icon: Shield,       label_ar: "سياسة الحضور",   label_en: "Attendance",  color: "text-blue-600 bg-blue-500/10" },
  { key: "work",        icon: Calendar,     label_ar: "أيام العمل",     label_en: "Work Days",   color: "text-emerald-600 bg-emerald-500/10" },
  { key: "leave",       icon: Clock,        label_ar: "سياسة الإجازات", label_en: "Leaves",      color: "text-purple-600 bg-purple-500/10" },
  { key: "allowance",   icon: DollarSign,   label_ar: "البدلات",        label_en: "Allowances",  color: "text-amber-600 bg-amber-500/10" },
  { key: "deduction",   icon: TrendingDown, label_ar: "الخصومات",       label_en: "Deductions",  color: "text-red-600 bg-red-500/10" },
  { key: "bonus",       icon: Award,        label_ar: "المكافآت",       label_en: "Bonuses",     color: "text-brand-primary bg-brand-primary/10" },
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
      const [aRes, lRes, wRes, alRes, dRes, bRes] = await Promise.all([
        fetch("/api/hr/policies/attendance-policy", { headers }),
        fetch("/api/hr/policies/leave-policy", { headers }),
        fetch("/api/hr/policies/work-policy", { headers }),
        fetch("/api/hr/policies/allowance-policies", { headers }),
        fetch("/api/hr/policies/deduction-policies", { headers }),
        fetch("/api/hr/policies/bonus-policies", { headers }),
      ]);
      const [a, l, w, al, d, b] = await Promise.all([
        aRes.json(), lRes.json(), wRes.json(), alRes.json(), dRes.json(), bRes.json(),
      ]);
      setAttendance(a?.policies || a?.results || []);
      setLeaves(l?.policies || l?.results || []);
      setWorkPolicy(w);
      setAllowances(al?.results || al?.policies || []);
      setDeductions(d?.results || d?.policies || []);
      setBonuses(b?.results || b?.policies || []);
    } catch {
      toast.error(ar ? "فشل تحميل البيانات" : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token, ar, authH, langH]);

  useEffect(() => { load(); }, [load]);

  // ── Work Policy ─────────────────────────────────
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
        toast.success(ar ? "تم الحفظ ✅" : "Saved ✅");
      } else {
        toast.error(data.message || (ar ? "فشل" : "Failed"));
      }
    } catch { toast.error(ar ? "خطأ" : "Error"); }
    finally { setSaving(false); }
  };

  // ── Common Actions ──────────────────────────────
  const getEndpoint = (): string => {
    switch (activeTab) {
      case "attendance": return "attendance-policy";
      case "leave":      return "leave-policy";
      case "allowance":  return "allowance-policies";
      case "deduction":  return "deduction-policies";
      case "bonus":      return "bonus-policies";
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
        toast.success(ar ? "تم إنشاء نسخة ✅" : "Cloned ✅");
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
        toast.success(ar ? "تم الاعتماد ✅" : "Approved ✅");
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
    if (!confirm(ar ? "حذف السياسة؟" : "Delete?")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/hr/policies/${endpoint}/${id}`, {
        method: "DELETE",
        headers: { Authorization: authH },
      });
      if (res.ok) {
        toast.success(ar ? "تم الحذف ✅" : "Deleted ✅");
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
    else {
      setPayrollKind(activeTab as "allowance" | "deduction" | "bonus");
      setShowPayrollDialog(true);
    }
  };

  const openCreateDialog = () => {
    setEditingPolicyId(null);
    if (activeTab === "attendance") setShowAttendanceDialog(true);
    else if (activeTab === "leave") setShowLeaveDialog(true);
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

  // ── Render Policy List ─────────────────────────
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
                           (ar ? "مؤرشف" : "Archived")}
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
                          {ar ? "حذف" : "Delete"}
                        </Button>
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
                              {ar ? "حذف" : "Delete"}
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
            renderPolicyList()
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
    </div>
  );
}
