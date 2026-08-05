"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  DollarSign, Save, Loader2, TrendingDown, Award,
  Users, Building2, User, Layers, Info, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { STORAGE_KEYS } from "@/lib/constants/config";

type PolicyKind = "allowance" | "deduction" | "bonus";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  policyId: number | null;
  kind: PolicyKind;
  ar: boolean;
}

interface Employee {
  id: number;
  full_name?: string;
  first_name_ar?: string;
  last_name_ar?: string;
  employee_code?: string;
}
interface Branch     { id: number; name_ar?: string; name_en?: string; name?: string; }
interface Department { id: number; name_ar?: string; name_en?: string; name?: string; }

// ── Types من الباك بالظبط ──────────────────────────────
const ALLOWANCE_TYPES = [
  { value: "transport",      label: "بدل مواصلات" },
  { value: "housing",        label: "بدل سكن" },
  { value: "phone",          label: "بدل هاتف" },
  { value: "meal",           label: "بدل وجبة" },
  { value: "performance",    label: "علاوة أداء" },
  { value: "clothing",       label: "بدل ملابس" },
  { value: "risk",           label: "بدل مخاطر" },
  { value: "supervision",    label: "بدل إشراف" },
  { value: "shift_night",    label: "بدل وردية ليلية" },
  { value: "travel",         label: "بدل سفر" },
  { value: "remote_work",    label: "بدل عمل عن بُعد" },
  { value: "childcare",      label: "بدل رعاية أطفال" },
  { value: "education",      label: "بدل تعليم" },
  { value: "medical",        label: "بدل طبي" },
  { value: "social",         label: "بدل اجتماعي" },
  { value: "technical",      label: "بدل فني" },
  { value: "representation", label: "بدل تمثيل" },
  { value: "nature_of_work", label: "بدل طبيعة عمل" },
  { value: "overtime_fixed", label: "بدل ساعات إضافية ثابت" },
  { value: "field",          label: "بدل انتقالات ميدانية" },
  { value: "other",          label: "أخرى" },
];

const DEDUCTION_TYPES = [
  { value: "social_insurance", label: "تأمينات اجتماعية" },
  { value: "health_insurance", label: "تأمين صحي" },
  { value: "tax",              label: "ضريبة دخل" },
  { value: "union_fee",        label: "اشتراك نقابة" },
  { value: "savings",          label: "صندوق ادخار" },
  { value: "parking",          label: "خصم انتظار سيارات" },
  { value: "uniform",          label: "خصم زي رسمي" },
  { value: "tools",            label: "خصم عهد / أدوات" },
  { value: "loan_recovery",    label: "استرداد سلفة" },
  { value: "other",            label: "أخرى" },
];

const BONUS_TYPES = [
  { value: "incentive",          label: "حافز" },
  { value: "eid",                label: "مكافأة عيد" },
  { value: "annual",             label: "مكافأة سنوية" },
  { value: "performance",        label: "مكافأة أداء" },
  { value: "profit_share",       label: "حصة أرباح" },
  { value: "attendance_bonus",   label: "مكافأة انتظام" },
  { value: "project_completion", label: "مكافأة إتمام مشروع" },
  { value: "referral",           label: "مكافأة ترشيح" },
  { value: "loyalty",            label: "مكافأة ولاء" },
  { value: "ramadan",            label: "مكافأة رمضان" },
  { value: "back_to_school",     label: "مكافأة دخول مدارس" },
  { value: "marriage",           label: "مكافأة زواج" },
  { value: "newborn",            label: "مكافأة مولود جديد" },
  { value: "other",              label: "أخرى" },
];

// ── طرق الحساب ────────────────────────────────────────
const AMOUNT_TYPES = [
  { value: "fixed",           label: "مبلغ ثابت (EGP)" },
  { value: "percent_basic",   label: "% من الراتب الأساسي" },
  { value: "percent_gross",   label: "% من الراتب الإجمالي" },
  { value: "quarter_day",     label: "ربع يوم" },
  { value: "half_day",        label: "نصف يوم" },
  { value: "full_day",        label: "يوم كامل" },
];

const SCOPE_CHOICES = [
  { value: "company",    label: "الشركة كلها",   icon: Users },
  { value: "branch",     label: "فرع محدد",      icon: Building2 },
  { value: "department", label: "إدارة محددة",   icon: Layers },
  { value: "employees",  label: "موظفين محددين", icon: User },
];

interface Form {
  policy_type:        string;
  name_ar:            string;
  name_en:            string;
  amount_type:        string;
  amount_value:       number;
  scope:              string;
  branch_id:          number | null;
  department_id:      number | null;
  specific_employees: number[];
  is_monthly:         boolean;
  is_active:          boolean;
  start_date:         string;
  end_date:           string;
  notes:              string;
}

const EMPTY: Form = {
  policy_type:        "",
  name_ar:            "",
  name_en:            "",
  amount_type:        "fixed",
  amount_value:       0,
  scope:              "company",
  branch_id:          null,
  department_id:      null,
  specific_employees: [],
  is_monthly:         true,
  is_active:          true,
  start_date:         new Date().toISOString().split("T")[0],
  end_date:           "",
  notes:              "",
};

const KIND_CFG = {
  allowance: { icon: DollarSign,   color: "text-amber-600",       label: "بدل",    endpoint: "allowance-policies", typeKey: "allowance_type", types: ALLOWANCE_TYPES },
  deduction: { icon: TrendingDown, color: "text-red-600",         label: "خصم",    endpoint: "deduction-policies", typeKey: "deduction_type", types: DEDUCTION_TYPES },
  bonus:     { icon: Award,        color: "text-brand-primary",   label: "مكافأة", endpoint: "bonus-policies",     typeKey: "bonus_type",     types: BONUS_TYPES },
};

// ── حساب المبلغ الفعلي اللي هيتبعت للباك ─────────────
function resolveAmount(amountType: string, amountValue: number): number {
  // الباك عنده amount فقط (decimal)
  // لو percent أو fraction — بنحفظ القيمة كما هي
  // والـ label بيوضح النوع في الـ name_ar
  return amountValue;
}

export default function PayrollPolicyDialog({ open, onClose, onSaved, policyId, kind, ar }: Props) {
  const [form, setForm]     = useState<Form>({ ...EMPTY });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);

  const [branches,    setBranches]    = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees,   setEmployees]   = useState<Employee[]>([]);
  const [empSearch,   setEmpSearch]   = useState("");
  const [empLoading,  setEmpLoading]  = useState(false);

  const cfg  = KIND_CFG[kind];
  const Icon = cfg.icon;

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;

  // ── تحميل Lookups ──────────────────────────────────
  const loadLookups = useCallback(async () => {
    if (!token) return;
    try {
      const [bRes, dRes] = await Promise.all([
        fetch("/api/branches",    { headers: { Authorization: authH } }),
        fetch("/api/departments", { headers: { Authorization: authH } }),
      ]);
      const [b, d] = await Promise.all([bRes.json(), dRes.json()]);
      setBranches(
        Array.isArray(b?.branches) ? b.branches :
        Array.isArray(b?.results)  ? b.results  : []
      );
      setDepartments(
        Array.isArray(d?.departments) ? d.departments :
        Array.isArray(d?.results)     ? d.results     : []
      );
    } catch { /* silent */ }
  }, [token, authH]);

  // ── تحميل الموظفين (كل الشركة) ──────────────────────
  const loadEmployees = useCallback(async (search = "") => {
    if (!token) return;
    setEmpLoading(true);
    try {
      const url = search
        ? `/api/hr/all-employees?search=${encodeURIComponent(search)}`
        : "/api/hr/all-employees";
      const res  = await fetch(url, { headers: { Authorization: authH } });
      const data = await res.json();
      setEmployees(
        Array.isArray(data?.employees) ? data.employees :
        Array.isArray(data?.results)   ? data.results   : []
      );
    } catch { /* silent */ }
    finally { setEmpLoading(false); }
  }, [token, authH]);

  // ── Debounce بحث الموظفين ──────────────────────────
  useEffect(() => {
    if (form.scope !== "employees") return;
    const t = setTimeout(() => loadEmployees(empSearch), 400);
    return () => clearTimeout(t);
  }, [empSearch, form.scope, loadEmployees]);

  useEffect(() => {
    if (!open) return;
    loadLookups();
    if (policyId) loadPolicy(policyId);
    else { setForm({ ...EMPTY }); setEmpSearch(""); }
  }, [open, policyId, kind]);

  // لما يغير scope لـ employees يحمل الموظفين
  useEffect(() => {
    if (form.scope === "employees" && employees.length === 0) {
      loadEmployees();
    }
  }, [form.scope]);

  // ── تحميل سياسة موجودة ────────────────────────────
  const loadPolicy = async (id: number) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/hr/policies/${cfg.endpoint}/${id}`, {
        headers: { Authorization: authH },
      });
      const data = await res.json();
      const p    = data?.policy || data?.result || data;
      if (p?.id) {
        setForm({
          ...EMPTY,
          policy_type:        p[cfg.typeKey] || "",
          name_ar:            p.name_ar      || "",
          name_en:            p.name_en      || "",
          amount_type:        "fixed",
          amount_value:       Number(p.amount) || 0,
          scope:              p.scope         || "company",
          branch_id:          p.branch_id     || null,
          department_id:      p.department_id || null,
          specific_employees: Array.isArray(p.specific_employees) ? p.specific_employees : [],
          is_monthly:         p.is_monthly  !== undefined ? p.is_monthly  : true,
          is_active:          p.is_active   !== undefined ? p.is_active   : true,
          start_date:         p.start_date  || new Date().toISOString().split("T")[0],
          end_date:           p.end_date    || "",
          notes:              p.notes       || "",
        });
        if (p.scope === "employees") loadEmployees();
      }
    } catch { toast.error(ar ? "فشل التحميل" : "Load failed"); }
    finally  { setLoading(false); }
  };

  // ── حفظ ────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.policy_type)           { toast.error("اختر النوع");                    return; }
    if (!form.name_ar.trim())        { toast.error("الاسم بالعربي مطلوب");           return; }
    if (form.amount_value <= 0)      { toast.error("القيمة مطلوبة وأكبر من صفر");    return; }
    if (form.scope === "branch"      && !form.branch_id)                  { toast.error("اختر الفرع");            return; }
    if (form.scope === "department"  && !form.department_id)              { toast.error("اختر الإدارة");          return; }
    if (form.scope === "employees"   && form.specific_employees.length === 0) { toast.error("اختر موظف واحد على الأقل"); return; }

    setSaving(true);
    try {
      const url    = policyId
        ? `/api/hr/policies/${cfg.endpoint}/${policyId}`
        : `/api/hr/policies/${cfg.endpoint}`;
      const method = policyId ? "PUT" : "POST";

      // ── بناء الـ name_ar ليشمل نوع الحساب ──
      let displayName = form.name_ar;
      const amtLabel  = AMOUNT_TYPES.find(a => a.value === form.amount_type)?.label || "";
      // لو المستخدم مكتبش وصف واضح للنوع، نضيفه تلقائياً
      // (اختياري — الـ name_ar كما هو)

      // ── payload للباك (amount = القيمة الرقمية) ──
      const payload: Record<string, unknown> = {
        [cfg.typeKey]: form.policy_type,
        name_ar:       displayName,
        name_en:       form.name_en,
        amount:        form.amount_value,   // الباك بيحفظ الرقم بس
        scope:         form.scope,
        is_monthly:    form.is_monthly,
        is_active:     form.is_active,
        start_date:    form.start_date,
        end_date:      form.end_date || null,
        notes:         form.notes
          ? `[${amtLabel}] ${form.notes}`
          : `[${amtLabel}]`,               // نحفظ نوع الحساب في notes
      };

      if (form.scope === "branch")     payload.branch_id     = form.branch_id;
      if (form.scope === "department") payload.department_id = form.department_id;
      if (form.scope === "employees")  payload.employee_ids  = form.specific_employees; // الباك بيتوقع employee_ids

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
    } catch (e) {
      toast.error("خطأ في الاتصال");
    } finally {
      setSaving(false);
    }
  };

  const toggleEmp = (id: number) => {
    setForm(p => ({
      ...p,
      specific_employees: p.specific_employees.includes(id)
        ? p.specific_employees.filter(x => x !== id)
        : [...p.specific_employees, id],
    }));
  };

  const empName = (e: Employee) =>
    e.full_name || `${e.first_name_ar || ""} ${e.last_name_ar || ""}`.trim() || `#${e.id}`;

  // ── الـ amount_types المناسبة حسب النوع ───────────
  const visibleAmountTypes = kind === "deduction"
    ? AMOUNT_TYPES  // كل الأنواع للخصم
    : AMOUNT_TYPES.filter(a => !["quarter_day","half_day","full_day"].includes(a.value)); // البدلات والمكافآت بدون كسور

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${cfg.color}`} />
            {policyId ? `تعديل ${cfg.label}` : `${cfg.label} جديد`}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4 space-y-5 px-1">

              {/* ── النوع ── */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">نوع {cfg.label} *</label>
                <select
                  value={form.policy_type}
                  onChange={e => setForm(p => ({ ...p, policy_type: e.target.value }))}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="">-- اختر --</option>
                  {cfg.types.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* ── الأسماء ── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">الاسم بالعربي *</label>
                  <Input
                    value={form.name_ar}
                    onChange={e => setForm(p => ({ ...p, name_ar: e.target.value }))}
                    placeholder="مثال: بدل مواصلات شهري"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">الاسم بالإنجليزي</label>
                  <Input
                    value={form.name_en}
                    onChange={e => setForm(p => ({ ...p, name_en: e.target.value }))}
                    dir="ltr"
                    placeholder="e.g. Monthly Transport"
                  />
                </div>
              </div>

              {/* ── طريقة الحساب + القيمة ── */}
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-3">
                <p className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  طريقة الحساب *
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {visibleAmountTypes.map(at => (
                    <button
                      key={at.value}
                      onClick={() => setForm(p => ({ ...p, amount_type: at.value }))}
                      className={`p-2.5 rounded-lg border-2 text-xs font-medium transition text-start ${
                        form.amount_type === at.value
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-700"
                          : "border-border text-muted-foreground hover:border-emerald-300"
                      }`}
                    >
                      {at.label}
                    </button>
                  ))}
                </div>

                {/* القيمة */}
                <div>
                  <label className="text-sm mb-1 block">
                    {form.amount_type === "fixed"         && "المبلغ (جنيه) *"}
                    {form.amount_type === "percent_basic" && "النسبة % من الأساسي *"}
                    {form.amount_type === "percent_gross" && "النسبة % من الإجمالي *"}
                    {form.amount_type === "quarter_day"   && "عدد أرباع اليوم *"}
                    {form.amount_type === "half_day"      && "عدد أنصاف اليوم *"}
                    {form.amount_type === "full_day"      && "عدد الأيام *"}
                  </label>
                  <Input
                    type="number"
                    step={form.amount_type === "fixed" ? "1" : "0.01"}
                    min="0"
                    value={form.amount_value || ""}
                    onChange={e => setForm(p => ({ ...p, amount_value: Number(e.target.value) }))}
                    placeholder={
                      form.amount_type === "fixed"         ? "500" :
                      form.amount_type.startsWith("percent") ? "10" : "1"
                    }
                  />
                  {/* Preview */}
                  {form.amount_value > 0 && (
                    <p className="text-xs text-emerald-700 mt-1 font-medium">
                      {form.amount_type === "fixed"         && `${form.amount_value} جنيه شهرياً`}
                      {form.amount_type === "percent_basic" && `${form.amount_value}% من الراتب الأساسي`}
                      {form.amount_type === "percent_gross" && `${form.amount_value}% من الراتب الإجمالي`}
                      {form.amount_type === "quarter_day"   && `${form.amount_value} × ربع يوم`}
                      {form.amount_type === "half_day"      && `${form.amount_value} × نصف يوم`}
                      {form.amount_type === "full_day"      && `${form.amount_value} يوم كامل`}
                    </p>
                  )}
                </div>
              </div>

              {/* ── نطاق التطبيق ── */}
              <div className="p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-xl space-y-3">
                <p className="text-sm font-semibold text-brand-primary flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  نطاق التطبيق *
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {SCOPE_CHOICES.map(s => {
                    const SIcon = s.icon;
                    return (
                      <button
                        key={s.value}
                        onClick={() => setForm(p => ({ ...p, scope: s.value }))}
                        className={`p-3 rounded-lg border-2 text-sm font-medium transition flex items-center gap-2 ${
                          form.scope === s.value
                            ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                            : "border-border text-muted-foreground hover:border-brand-primary/30"
                        }`}
                      >
                        <SIcon className="w-4 h-4" />
                        {s.label}
                      </button>
                    );
                  })}
                </div>

                {/* Branch */}
                {form.scope === "branch" && (
                  <div>
                    <label className="text-sm mb-1 block">اختر الفرع</label>
                    <select
                      value={form.branch_id || ""}
                      onChange={e => setForm(p => ({ ...p, branch_id: Number(e.target.value) || null }))}
                      className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                    >
                      <option value="">-- اختر --</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name_ar || b.name}</option>
                      ))}
                    </select>
                    {branches.length === 0 && (
                      <p className="text-xs text-muted-foreground mt-1">جاري التحميل...</p>
                    )}
                  </div>
                )}

                {/* Department */}
                {form.scope === "department" && (
                  <div>
                    <label className="text-sm mb-1 block">اختر الإدارة</label>
                    <select
                      value={form.department_id || ""}
                      onChange={e => setForm(p => ({ ...p, department_id: Number(e.target.value) || null }))}
                      className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                    >
                      <option value="">-- اختر --</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name_ar || d.name}</option>
                      ))}
                    </select>
                    {departments.length === 0 && (
                      <p className="text-xs text-muted-foreground mt-1">جاري التحميل...</p>
                    )}
                  </div>
                )}

                {/* Employees Multi-select */}
                {form.scope === "employees" && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">الموظفين</label>
                      {form.specific_employees.length > 0 && (
                        <Badge className="bg-brand-primary text-white border-0 text-xs">
                          {form.specific_employees.length} محدد
                        </Badge>
                      )}
                    </div>
                    <div className="relative mb-2">
                      <Search className="absolute right-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        value={empSearch}
                        onChange={e => setEmpSearch(e.target.value)}
                        placeholder="ابحث بالاسم أو الكود..."
                        className="pr-9 text-sm"
                      />
                    </div>
                    <div className="border border-border rounded-lg max-h-52 overflow-y-auto bg-background">
                      {empLoading ? (
                        <div className="flex justify-center py-6">
                          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : employees.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6">
                          لا يوجد موظفين
                        </p>
                      ) : (
                        employees.map(e => {
                          const selected = form.specific_employees.includes(e.id);
                          return (
                            <div
                              key={e.id}
                              onClick={() => toggleEmp(e.id)}
                              className={`p-2.5 border-b last:border-0 cursor-pointer flex items-center gap-2.5 transition ${
                                selected ? "bg-brand-primary/10" : "hover:bg-muted/50"
                              }`}
                            >
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition ${
                                selected
                                  ? "bg-brand-primary border-brand-primary"
                                  : "border-border"
                              }`}>
                                {selected && <span className="text-white text-[10px] font-bold">✓</span>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{empName(e)}</p>
                                <p className="text-[10px] text-muted-foreground">{e.employee_code}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ── التواريخ ── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">من تاريخ *</label>
                  <Input
                    type="date"
                    value={form.start_date}
                    onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    لحد تاريخ
                    <span className="text-xs text-muted-foreground ms-1">(اختياري)</span>
                  </label>
                  <Input
                    type="date"
                    value={form.end_date}
                    onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
                  />
                </div>
              </div>

              {/* ── التكرار والحالة ── */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setForm(p => ({ ...p, is_monthly: !p.is_monthly }))}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition flex flex-col items-center gap-1 ${
                    form.is_monthly
                      ? "border-blue-500 bg-blue-500/10 text-blue-700"
                      : "border-amber-500 bg-amber-500/10 text-amber-700"
                  }`}
                >
                  <span className="text-lg">{form.is_monthly ? "🔄" : "1️⃣"}</span>
                  {form.is_monthly ? "متكرر شهرياً" : "مرة واحدة فقط"}
                  <span className="text-[10px] opacity-70">
                    {form.is_monthly ? "هيتضاف كل شهر تلقائي" : "هيتضاف مرة واحدة بس"}
                  </span>
                </button>
                <button
                  onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition flex flex-col items-center gap-1 ${
                    form.is_active
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-700"
                      : "border-slate-400 bg-slate-100 text-slate-600"
                  }`}
                >
                  <span className="text-lg">{form.is_active ? "✅" : "⏸️"}</span>
                  {form.is_active ? "نشط" : "متوقف"}
                  <span className="text-[10px] opacity-70">
                    {form.is_active ? "مفعّل الآن" : "موقوف مؤقتاً"}
                  </span>
                </button>
              </div>

              {/* ── ملاحظات ── */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">ملاحظات</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  placeholder="أي تفاصيل إضافية..."
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background resize-none"
                />
              </div>

            </div>

            {/* ── Actions ── */}
            <div className="flex gap-3 pt-4 border-t shrink-0">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-brand-primary hover:bg-brand-secondary gap-2"
              >
                {saving
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Save className="w-4 h-4" />}
                {saving ? "جاري الحفظ..." : "حفظ"}
              </Button>
              <Button variant="outline" onClick={onClose} className="flex-1">
                إلغاء
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
