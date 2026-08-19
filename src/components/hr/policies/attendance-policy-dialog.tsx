"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Shield, Save, Loader2, Info, Clock, Plus, Trash2, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  policyId: number | null;
  ar: boolean;
}

interface LateRule {
  id?: number;
  from_minutes: number;
  to_minutes: number;
  deduction_type: string;
  deduction_value: number;
}

interface AbsenceRule {
  id?: number;
  absence_type: string;
  consecutive_days: number | null;
  occurrences_in_month: number | null;
  deduction_type: string;
  deduction_value: number;
}

interface OvertimeRule {
  id?: number;
  overtime_type: string;
  multiplier: number;
  min_minutes: number;
  max_hours_per_day: number | null;
  max_hours_per_month: number | null;
  requires_approval: boolean;
}

interface Policy {
  id?: number;
  name: string;
  effective_from: string;
  effective_to: string;
  status: string;
  notes: string;
  permission_enabled: boolean;
  permission_monthly_hours: number;
  permission_monthly_count: number;
  permission_max_hours_per_request: number;
  permission_fraction_as_full: boolean;
  permission_reset_cycle: string;
  late_warning_enabled: boolean;
  late_warning_threshold: number;
  late_warning_deduction_type: string;
  late_warning_deduction_value: number;
  late_warning_max_deduction: number;
  late_warning_step_rate: number;
  late_rules: LateRule[];
  absence_rules: AbsenceRule[];
  overtime_rules: OvertimeRule[];
}

const EMPTY: Policy = {
  name: "",
  effective_from: new Date().toISOString().split("T")[0],
  effective_to: "",
  status: "draft",
  notes: "",
  permission_enabled: false,
  permission_monthly_hours: 4,
  permission_monthly_count: 2,
  permission_max_hours_per_request: 2,
  permission_fraction_as_full: false,
  permission_reset_cycle: "monthly",
  late_warning_enabled: false,
  late_warning_threshold: 2,
  late_warning_deduction_type: "fixed",
  late_warning_deduction_value: 0.25,
  late_warning_max_deduction: 1.0,
  late_warning_step_rate: 1,
  late_rules: [],
  absence_rules: [],
  overtime_rules: [],
};

// ── choices من الباك ──────────────────────────────
const LATE_DEDUCTION_TYPES = [
  { value: "none",          label: "بدون خصم" },
  { value: "fixed",         label: "مبلغ ثابت (جنيه)" },
  { value: "hourly",        label: "خصم بالساعة" },
  { value: "quarter_day",   label: "ربع يوم" },
  { value: "half_day",      label: "نصف يوم" },
  { value: "full_day",      label: "يوم كامل" },
  { value: "percent",       label: "نسبة %" },
];

const ABSENCE_TYPES = [
  { value: "unexcused",      label: "غياب بدون إذن" },
  { value: "excused",        label: "غياب بعذر" },
  { value: "medical",        label: "إجازة مرضية" },
  { value: "any",            label: "أي نوع غياب" },
];

const ABSENCE_DEDUCTION_TYPES = [
  { value: "day_fraction",   label: "كسر يوم" },
  { value: "fixed",          label: "مبلغ ثابت (جنيه)" },
  { value: "percent",        label: "نسبة %" },
  { value: "full_day",       label: "يوم كامل" },
];

const OVERTIME_TYPES = [
  { value: "after_shift",    label: "بعد نهاية الشيفت" },
  { value: "before_shift",   label: "قبل بداية الشيفت" },
  { value: "weekend",        label: "يوم إجازة أسبوعية" },
  { value: "holiday",        label: "إجازة رسمية" },
];

const EMPTY_LATE_RULE: LateRule = {
  from_minutes: 0,
  to_minutes: 15,
  deduction_type: "none",
  deduction_value: 0,
};

const EMPTY_ABSENCE_RULE: AbsenceRule = {
  absence_type: "unexcused",
  consecutive_days: null,
  occurrences_in_month: null,
  deduction_type: "full_day",
  deduction_value: 1,
};

const EMPTY_OVERTIME_RULE: OvertimeRule = {
  overtime_type: "after_shift",
  multiplier: 1.5,
  min_minutes: 30,
  max_hours_per_day: null,
  max_hours_per_month: null,
  requires_approval: false,
};

type Section = "basic" | "permissions" | "late" | "warnings" | "absence" | "overtime";

export default function AttendancePolicyDialog({ open, onClose, onSaved, policyId, ar }: Props) {
  const [form, setForm]           = useState<Policy>({ ...EMPTY });
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [activeSection, setActiveSection] = useState<Section>("basic");

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;

  useEffect(() => {
    if (!open) return;
    if (policyId) loadPolicy(policyId);
    else { setForm({ ...EMPTY }); setActiveSection("basic"); }
  }, [open, policyId]);

  const loadPolicy = async (id: number) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/hr/policies/attendance-policy/${id}`, {
        headers: { Authorization: authH },
      });
      const data = await res.json();
      const p    = data.policy || data;
      if (p?.id) {
        setForm({
          ...EMPTY,
          ...p,
          effective_to:  p.effective_to  || "",
          notes:         p.notes         || "",
          late_rules:    p.late_rules    || [],
          absence_rules: p.absence_rules || [],
          overtime_rules:p.overtime_rules|| [],
        });
      }
    } catch { toast.error("فشل تحميل السياسة"); }
    finally  { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.name.trim())        { toast.error("اسم السياسة مطلوب");  return; }
    if (!form.effective_from)     { toast.error("تاريخ البداية مطلوب"); return; }

    setSaving(true);
    try {
      const url    = policyId ? `/api/hr/policies/attendance-policy/${policyId}` : "/api/hr/policies/attendance-policy";
      const method = policyId ? "PUT" : "POST";

      const payload = {
        name:                          form.name,
        effective_from:                form.effective_from,
        effective_to:                  form.effective_to  || null,
        status:                        form.status,
        notes:                         form.notes,
        permission_enabled:            form.permission_enabled,
        permission_monthly_hours:      Number(form.permission_monthly_hours),
        permission_monthly_count:      Number(form.permission_monthly_count),
        permission_max_hours_per_request: Number(form.permission_max_hours_per_request),
        permission_fraction_as_full:   form.permission_fraction_as_full,
        permission_reset_cycle:        form.permission_reset_cycle,
        late_warning_enabled:          form.late_warning_enabled,
        late_warning_threshold:        form.late_warning_threshold,
        late_warning_deduction_type:   form.late_warning_deduction_type,
        late_warning_deduction_value:  form.late_warning_deduction_value,
        late_warning_max_deduction:    form.late_warning_max_deduction,
        late_warning_step_rate:        form.late_warning_step_rate,
        late_rules:    form.late_rules.map(r => ({
          from_minutes:    Number(r.from_minutes),
          to_minutes:      Number(r.to_minutes),
          deduction_type:  r.deduction_type,
          deduction_value: Number(r.deduction_value),
        })),
        absence_rules: form.absence_rules.map(r => ({
          absence_type:         r.absence_type,
          consecutive_days:     r.consecutive_days ? Number(r.consecutive_days) : null,
          occurrences_in_month: r.occurrences_in_month ? Number(r.occurrences_in_month) : null,
          deduction_type:       r.deduction_type,
          deduction_value:      Number(r.deduction_value),
        })),
        overtime_rules: form.overtime_rules.map(r => ({
          overtime_type:      r.overtime_type,
          multiplier:         Number(r.multiplier),
          min_minutes:        Number(r.min_minutes),
          max_hours_per_day:  r.max_hours_per_day   ? Number(r.max_hours_per_day)   : null,
          max_hours_per_month:r.max_hours_per_month ? Number(r.max_hours_per_month) : null,
          requires_approval:  r.requires_approval,
        })),
      };

      const res  = await fetch(url, {
        method,
        headers: { Authorization: authH, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success !== false) {
        toast.success(policyId ? "تم التحديث ✅" : "تم الإنشاء ✅");
        onSaved();
        onClose();
      } else {
        toast.error(data.error || data.message || "فشل الحفظ");
      }
    } catch { toast.error("خطأ في الاتصال"); }
    finally  { setSaving(false); }
  };

  // ── Late Rules helpers ──────────────────────────
  const addLateRule    = () => setForm(p => ({ ...p, late_rules: [...p.late_rules, { ...EMPTY_LATE_RULE }] }));
  const removeLateRule = (i: number) => setForm(p => ({ ...p, late_rules: p.late_rules.filter((_, idx) => idx !== i) }));
  const updateLateRule = (i: number, key: keyof LateRule, val: unknown) =>
    setForm(p => ({ ...p, late_rules: p.late_rules.map((r, idx) => idx === i ? { ...r, [key]: val } : r) }));

  // ── Absence Rules helpers ───────────────────────
  const addAbsenceRule    = () => setForm(p => ({ ...p, absence_rules: [...p.absence_rules, { ...EMPTY_ABSENCE_RULE }] }));
  const removeAbsenceRule = (i: number) => setForm(p => ({ ...p, absence_rules: p.absence_rules.filter((_, idx) => idx !== i) }));
  const updateAbsenceRule = (i: number, key: keyof AbsenceRule, val: unknown) =>
    setForm(p => ({ ...p, absence_rules: p.absence_rules.map((r, idx) => idx === i ? { ...r, [key]: val } : r) }));

  // ── Overtime Rules helpers ──────────────────────
  const addOvertimeRule    = () => setForm(p => ({ ...p, overtime_rules: [...p.overtime_rules, { ...EMPTY_OVERTIME_RULE }] }));
  const removeOvertimeRule = (i: number) => setForm(p => ({ ...p, overtime_rules: p.overtime_rules.filter((_, idx) => idx !== i) }));
  const updateOvertimeRule = (i: number, key: keyof OvertimeRule, val: unknown) =>
    setForm(p => ({ ...p, overtime_rules: p.overtime_rules.map((r, idx) => idx === i ? { ...r, [key]: val } : r) }));

  const sections = [
    { key: "basic",       label: "البيانات الأساسية", count: null },
    { key: "permissions", label: "الأذونات",           count: null },
    { key: "late",        label: "قوانين التأخير",     count: form.late_rules.length },
    { key: "warnings",    label: "الإنذارات والخصم",   count: form.late_warning_enabled ? 1 : null },
    { key: "absence",     label: "قوانين الغياب",      count: form.absence_rules.length },
    { key: "overtime",    label: "الأوفرتايم",          count: form.overtime_rules.length },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-primary" />
            {policyId ? "تعديل سياسة الحضور" : "سياسة حضور جديدة"}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-1 border-b overflow-x-auto shrink-0">
              {sections.map(s => (
                <button
                  key={s.key}
                  onClick={() => setActiveSection(s.key)}
                  className={`pb-2 px-3 text-xs font-medium border-b-2 whitespace-nowrap transition flex items-center gap-1 ${
                    activeSection === s.key
                      ? "border-brand-primary text-brand-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s.label}
                  {s.count !== null && s.count > 0 && (
                    <span className="bg-brand-primary text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                      {s.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 px-1">

              {/* ── BASIC ── */}
              {activeSection === "basic" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">اسم السياسة *</label>
                    <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="مثال: السياسة الرئيسية 2026" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">تاريخ البداية *</label>
                      <Input type="date" value={form.effective_from}
                        onChange={e => setForm(p => ({ ...p, effective_from: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">تاريخ النهاية</label>
                      <Input type="date" value={form.effective_to}
                        onChange={e => setForm(p => ({ ...p, effective_to: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">الحالة</label>
                    <div className="flex gap-2">
                      {["draft", "active", "archived"].map(s => (
                        <button key={s} onClick={() => setForm(p => ({ ...p, status: s }))}
                          className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${
                            form.status === s
                              ? s === "active" ? "border-emerald-500 bg-emerald-500/10 text-emerald-700"
                              : s === "draft"  ? "border-amber-500 bg-amber-500/10 text-amber-700"
                              :                  "border-slate-400 bg-slate-100 text-slate-700"
                              : "border-border text-muted-foreground"
                          }`}>
                          {s === "draft" ? "مسودة" : s === "active" ? "نشط" : "مؤرشف"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">ملاحظات</label>
                    <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                      rows={3} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background resize-none" />
                  </div>
                </div>
              )}

              {/* ── PERMISSIONS ── */}
              {activeSection === "permissions" && (
                <div className="space-y-4">
                  <div className="p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-sm">تفعيل نظام الأذونات</p>
                        <p className="text-xs text-muted-foreground mt-1">السماح للموظفين بطلب أذونات تأخير/انصراف مبكر</p>
                      </div>
                      <button onClick={() => setForm(p => ({ ...p, permission_enabled: !p.permission_enabled }))}
                        className={`relative w-12 h-7 rounded-full transition ${form.permission_enabled ? "bg-brand-primary" : "bg-slate-300"}`}>
                        <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition ${form.permission_enabled ? "left-6" : "left-1"}`} />
                      </button>
                    </div>
                  </div>
                  {form.permission_enabled && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm mb-1 block">ساعات شهرياً</label>
                          <Input type="number" step="0.5" value={form.permission_monthly_hours}
                            onChange={e => setForm(p => ({ ...p, permission_monthly_hours: Number(e.target.value) }))} />
                        </div>
                        <div>
                          <label className="text-sm mb-1 block">عدد الأذونات شهرياً</label>
                          <Input type="number" value={form.permission_monthly_count}
                            onChange={e => setForm(p => ({ ...p, permission_monthly_count: Number(e.target.value) }))} />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm mb-1 block">أقصى ساعات لكل إذن</label>
                        <Input type="number" step="0.5" value={form.permission_max_hours_per_request}
                          onChange={e => setForm(p => ({ ...p, permission_max_hours_per_request: Number(e.target.value) }))} />
                      </div>
                      <div>
                        <label className="text-sm mb-1 block">دورة إعادة التصفير</label>
                        <select value={form.permission_reset_cycle}
                          onChange={e => setForm(p => ({ ...p, permission_reset_cycle: e.target.value }))}
                          className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background">
                          <option value="monthly">شهرياً</option>
                          <option value="yearly">سنوياً</option>
                          <option value="calendar">شهر ميلادي</option>
                          <option value="payroll">دورة المرتب</option>
                        </select>
                      </div>
                      <label className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg cursor-pointer">
                        <input type="checkbox" checked={form.permission_fraction_as_full}
                          onChange={e => setForm(p => ({ ...p, permission_fraction_as_full: e.target.checked }))} className="w-4 h-4" />
                        <span className="text-sm">احتساب الكسور كإذن كامل</span>
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* ── LATE RULES ── */}
              {activeSection === "late" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-amber-700 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      قوانين التأخير ({form.late_rules.length})
                    </p>
                    <Button size="sm" onClick={addLateRule} className="gap-1 bg-amber-500 hover:bg-amber-600 text-white">
                      <Plus className="w-3 h-3" /> إضافة شريحة
                    </Button>
                  </div>

                  {form.late_rules.length === 0 && (
                    <div className="p-6 text-center border-2 border-dashed border-amber-200 rounded-xl">
                      <Clock className="w-8 h-8 text-amber-300 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">لا يوجد قواعد تأخير — اضغط "إضافة شريحة"</p>
                    </div>
                  )}

                  {form.late_rules.map((rule, i) => (
                    <div key={i} className="p-4 border border-amber-200 bg-amber-500/5 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                          شريحة {i + 1}
                        </span>
                        <button onClick={() => removeLateRule(i)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs mb-1 block text-muted-foreground">من (دقيقة)</label>
                          <Input type="number" value={rule.from_minutes}
                            onChange={e => updateLateRule(i, "from_minutes", Number(e.target.value))} />
                        </div>
                        <div>
                          <label className="text-xs mb-1 block text-muted-foreground">إلى (دقيقة)</label>
                          <Input type="number" value={rule.to_minutes}
                            onChange={e => updateLateRule(i, "to_minutes", Number(e.target.value))} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs mb-1 block text-muted-foreground">نوع الخصم</label>
                          <select value={rule.deduction_type}
                            onChange={e => updateLateRule(i, "deduction_type", e.target.value)}
                            className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background">
                            {LATE_DEDUCTION_TYPES.map(t => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs mb-1 block text-muted-foreground">
                            {rule.deduction_type === "none" ? "القيمة (لا يلزم)" : "القيمة"}
                          </label>
                          <Input type="number" step="0.01" value={rule.deduction_value}
                            disabled={rule.deduction_type === "none"}
                            onChange={e => updateLateRule(i, "deduction_value", Number(e.target.value))} />
                        </div>
                      </div>
                      {/* Preview */}
                      <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                        📌 التأخير من {rule.from_minutes} إلى {rule.to_minutes} دقيقة →{" "}
                        {rule.deduction_type === "none"    ? "بدون خصم" :
                         rule.deduction_type === "fixed"   ? `خصم ${rule.deduction_value} جنيه` :
                         rule.deduction_type === "hourly"  ? `خصم ${rule.deduction_value} ساعة` :
                         rule.deduction_type === "quarter_day" ? "خصم ربع يوم" :
                         rule.deduction_type === "half_day"    ? "خصم نصف يوم" :
                         rule.deduction_type === "full_day"    ? "خصم يوم كامل" :
                         `خصم ${rule.deduction_value}%`}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* ── ABSENCE RULES ── */}
              {activeSection === "warnings" && (
                <div className="space-y-4">
                  <label className="flex items-center gap-2 p-3 bg-brand-primary/5 rounded-lg cursor-pointer border border-brand-primary/20">
                    <input type="checkbox" checked={form.late_warning_enabled}
                      onChange={e => setForm(p => ({ ...p, late_warning_enabled: e.target.checked }))} className="w-4 h-4" />
                    <span className="text-sm font-semibold">تفعيل نظام الإنذارات والخصم التلقائي</span>
                  </label>

                  {form.late_warning_enabled && (
                    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 leading-relaxed">
                        <p className="font-semibold mb-1">📌 كيف يعمل النظام؟</p>
                        <p>• يُحسب التأخير فقط <strong>بعد انتهاء فترة السماحية</strong> في الشيفت</p>
                        <p>• أول <strong>{form.late_warning_threshold}</strong> مرات في الشهر = إنذار فقط (بدون خصم)</p>
                        <p>• بعد ذلك يبدأ الخصم من راتب الموظف حسب النوع المحدد</p>
                        <p>• إعادة العد تحدث تلقائياً في بداية كل شهر (حسب دورة المرتب)</p>
                      </div>

                      <div>
                        <label className="text-sm mb-1 block font-medium">عدد الإنذارات المسموحة قبل الخصم</label>
                        <Input type="number" min={1} max={10} value={form.late_warning_threshold}
                          onChange={e => setForm(p => ({ ...p, late_warning_threshold: Number(e.target.value) }))} />
                        <p className="text-xs text-muted-foreground mt-1">
                          مثال: {form.late_warning_threshold} = أول {form.late_warning_threshold} مرات في الشهر إنذار فقط
                        </p>
                      </div>

                      <div>
                        <label className="text-sm mb-1 block font-medium">نوع الخصم</label>
                        <select value={form.late_warning_deduction_type}
                          onChange={e => setForm(p => ({ ...p, late_warning_deduction_type: e.target.value }))}
                          className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background">
                          <option value="fixed">🟢 ثابت — نفس القيمة كل مرة</option>
                          <option value="progressive">🟡 تصاعدي بحد أقصى — يزيد كل مرة لحد قيمة معينة</option>
                          <option value="progressive_step">🔵 تصاعدي كل عدد مرات — يزيد بعد N مرات</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm mb-1 block font-medium">قيمة الخصم الأساسية (جزء من يوم)</label>
                        <Input type="number" step="0.05" min={0.05} max={1} value={form.late_warning_deduction_value}
                          onChange={e => setForm(p => ({ ...p, late_warning_deduction_value: Number(e.target.value) }))} />
                        <p className="text-xs text-muted-foreground mt-1">
                          مثال: 0.25 = ربع يوم | 0.5 = نص يوم | 1.0 = يوم كامل
                        </p>
                      </div>

                      {(form.late_warning_deduction_type === "progressive" || form.late_warning_deduction_type === "progressive_step") && (
                        <div>
                          <label className="text-sm mb-1 block font-medium">الحد الأقصى للخصم (جزء من يوم)</label>
                          <Input type="number" step="0.25" min={0.25} max={1} value={form.late_warning_max_deduction}
                            onChange={e => setForm(p => ({ ...p, late_warning_max_deduction: Number(e.target.value) }))} />
                          <p className="text-xs text-muted-foreground mt-1">
                            الخصم لن يتجاوز هذه القيمة حتى لو تكرر التأخير
                          </p>
                        </div>
                      )}

                      {form.late_warning_deduction_type === "progressive_step" && (
                        <div>
                          <label className="text-sm mb-1 block font-medium">معدل الزيادة (كل كام مرة يزيد)</label>
                          <Input type="number" min={1} max={5} value={form.late_warning_step_rate}
                            onChange={e => setForm(p => ({ ...p, late_warning_step_rate: Number(e.target.value) }))} />
                          <p className="text-xs text-muted-foreground mt-1">
                            مثال: 2 = يزيد كل مرتين
                          </p>
                        </div>
                      )}

                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                        <p className="font-semibold mb-1">📊 مثال توضيحي:</p>
                        {form.late_warning_deduction_type === "fixed" && (
                          <div>
                            <p>• المرات 1 و {form.late_warning_threshold} → إنذار فقط</p>
                            <p>• من المرة {form.late_warning_threshold + 1} فما فوق → خصم <strong>{form.late_warning_deduction_value}</strong> يوم كل مرة</p>
                          </div>
                        )}
                        {form.late_warning_deduction_type === "progressive" && (
                          <div>
                            <p>• أول {form.late_warning_threshold} مرات → إنذار</p>
                            <p>• المرة {form.late_warning_threshold + 1} → خصم {form.late_warning_deduction_value} يوم</p>
                            <p>• المرة {form.late_warning_threshold + 2} → خصم {Math.min(form.late_warning_deduction_value * 2, form.late_warning_max_deduction)} يوم</p>
                            <p>• المرة {form.late_warning_threshold + 3} → خصم {Math.min(form.late_warning_deduction_value * 3, form.late_warning_max_deduction)} يوم (حد أقصى: {form.late_warning_max_deduction})</p>
                          </div>
                        )}
                        {form.late_warning_deduction_type === "progressive_step" && (
                          <div>
                            <p>• أول {form.late_warning_threshold} مرات → إنذار</p>
                            <p>• أول {form.late_warning_step_rate} مرة خصم → {form.late_warning_deduction_value} يوم</p>
                            <p>• بعد {form.late_warning_step_rate} مرات → يزيد إلى {Math.min(form.late_warning_deduction_value * 2, form.late_warning_max_deduction)} يوم</p>
                            <p>• الحد الأقصى: {form.late_warning_max_deduction} يوم</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSection === "absence" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-red-700 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      قوانين الغياب ({form.absence_rules.length})
                    </p>
                    <Button size="sm" onClick={addAbsenceRule} className="gap-1 bg-red-500 hover:bg-red-600 text-white">
                      <Plus className="w-3 h-3" /> إضافة قانون
                    </Button>
                  </div>

                  {form.absence_rules.length === 0 && (
                    <div className="p-6 text-center border-2 border-dashed border-red-200 rounded-xl">
                      <Info className="w-8 h-8 text-red-300 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">لا يوجد قواعد غياب</p>
                    </div>
                  )}

                  {form.absence_rules.map((rule, i) => (
                    <div key={i} className="p-4 border border-red-200 bg-red-500/5 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded">قانون {i + 1}</span>
                        <button onClick={() => removeAbsenceRule(i)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs mb-1 block text-muted-foreground">نوع الغياب</label>
                          <select value={rule.absence_type}
                            onChange={e => updateAbsenceRule(i, "absence_type", e.target.value)}
                            className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background">
                            {ABSENCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs mb-1 block text-muted-foreground">نوع الخصم</label>
                          <select value={rule.deduction_type}
                            onChange={e => updateAbsenceRule(i, "deduction_type", e.target.value)}
                            className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background">
                            {ABSENCE_DEDUCTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs mb-1 block text-muted-foreground">أيام متتالية</label>
                          <Input type="number" placeholder="اختياري"
                            value={rule.consecutive_days ?? ""}
                            onChange={e => updateAbsenceRule(i, "consecutive_days", e.target.value ? Number(e.target.value) : null)} />
                        </div>
                        <div>
                          <label className="text-xs mb-1 block text-muted-foreground">مرات في الشهر</label>
                          <Input type="number" placeholder="اختياري"
                            value={rule.occurrences_in_month ?? ""}
                            onChange={e => updateAbsenceRule(i, "occurrences_in_month", e.target.value ? Number(e.target.value) : null)} />
                        </div>
                        <div>
                          <label className="text-xs mb-1 block text-muted-foreground">القيمة</label>
                          <Input type="number" step="0.01" value={rule.deduction_value}
                            onChange={e => updateAbsenceRule(i, "deduction_value", Number(e.target.value))} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── OVERTIME RULES ── */}
              {activeSection === "overtime" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      قواعد الأوفرتايم ({form.overtime_rules.length})
                    </p>
                    <Button size="sm" onClick={addOvertimeRule} className="gap-1 bg-emerald-500 hover:bg-emerald-600 text-white">
                      <Plus className="w-3 h-3" /> إضافة قاعدة
                    </Button>
                  </div>

                  {form.overtime_rules.length === 0 && (
                    <div className="p-6 text-center border-2 border-dashed border-emerald-200 rounded-xl">
                      <Clock className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">لا يوجد قواعد أوفرتايم</p>
                    </div>
                  )}

                  {form.overtime_rules.map((rule, i) => (
                    <div key={i} className="p-4 border border-emerald-200 bg-emerald-500/5 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">قاعدة {i + 1}</span>
                        <button onClick={() => removeOvertimeRule(i)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs mb-1 block text-muted-foreground">نوع الأوفرتايم</label>
                          <select value={rule.overtime_type}
                            onChange={e => updateOvertimeRule(i, "overtime_type", e.target.value)}
                            className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background">
                            {OVERTIME_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs mb-1 block text-muted-foreground">المضاعف (1.5 = 50% زيادة)</label>
                          <Input type="number" step="0.1" value={rule.multiplier}
                            onChange={e => updateOvertimeRule(i, "multiplier", Number(e.target.value))} />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs mb-1 block text-muted-foreground">أدنى دقائق</label>
                          <Input type="number" value={rule.min_minutes}
                            onChange={e => updateOvertimeRule(i, "min_minutes", Number(e.target.value))} />
                        </div>
                        <div>
                          <label className="text-xs mb-1 block text-muted-foreground">أقصى ساعات/يوم</label>
                          <Input type="number" placeholder="اختياري" value={rule.max_hours_per_day ?? ""}
                            onChange={e => updateOvertimeRule(i, "max_hours_per_day", e.target.value ? Number(e.target.value) : null)} />
                        </div>
                        <div>
                          <label className="text-xs mb-1 block text-muted-foreground">أقصى ساعات/شهر</label>
                          <Input type="number" placeholder="اختياري" value={rule.max_hours_per_month ?? ""}
                            onChange={e => updateOvertimeRule(i, "max_hours_per_month", e.target.value ? Number(e.target.value) : null)} />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={rule.requires_approval}
                          onChange={e => updateOvertimeRule(i, "requires_approval", e.target.checked)} className="w-4 h-4" />
                        <span className="text-xs">يحتاج موافقة المدير</span>
                      </label>
                      <p className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                        📌 بعد {rule.min_minutes} دقيقة → مضاعف {rule.multiplier}x
                      </p>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t shrink-0">
              <Button onClick={handleSave} disabled={saving}
                className="flex-1 bg-brand-primary hover:bg-brand-secondary gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "جاري الحفظ..." : "حفظ"}
              </Button>
              <Button variant="outline" onClick={onClose} className="flex-1">إلغاء</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
