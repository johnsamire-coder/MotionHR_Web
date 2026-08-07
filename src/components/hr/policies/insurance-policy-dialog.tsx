"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Shield, Heart, Save, Loader2, Info,
  Users, Building2, User, Layers, Percent, DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { STORAGE_KEYS } from "@/lib/constants/config";

type InsuranceType = "social" | "medical";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  policyId: number | null;
  ar: boolean;
}

interface Branch     { id: number; name_ar?: string; name_en?: string; name?: string; }
interface Department { id: number; name_ar?: string; name_en?: string; name?: string; }
interface Employee {
  id: number;
  full_name?: string;
  first_name_ar?: string;
  last_name_ar?: string;
  employee_code?: string;
}

const SHARE_TYPES = [
  { value: "percent", label_ar: "نسبة % من المرتب", label_en: "% of Salary" },
  { value: "fixed",   label_ar: "مبلغ ثابت (EGP)",  label_en: "Fixed Amount (EGP)" },
];

const SCOPES = [
  { value: "company",    label_ar: "الشركة كلها",    label_en: "Whole Company", icon: Building2 },
  { value: "branch",     label_ar: "فرع محدد",       label_en: "Specific Branch", icon: Layers },
  { value: "department", label_ar: "إدارة محددة",    label_en: "Specific Department", icon: Users },
  { value: "employees",  label_ar: "موظفين محددين",  label_en: "Specific Employees", icon: User },
];

const emptyForm = {
  insurance_type: "social" as InsuranceType,
  name_ar: "",
  name_en: "",
  company_share_type: "percent",
  company_share_value: 0,
  employee_share_type: "percent",
  employee_share_value: 0,
  calculation_base: "basic" as "basic" | "gross" | "employee_custom",
  min_insured_salary: "",
  max_insured_salary: "",
  scope: "company",
  branch_id: null as number | null,
  department_id: null as number | null,
  specific_employees: [] as number[],
  is_active: true,
  start_date: new Date().toISOString().slice(0, 10),
  end_date: "",
  change_reason: "",
};

export default function InsurancePolicyDialog({ open, onClose, onSaved, policyId, ar }: Props) {
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [empSearch, setEmpSearch] = useState("");

  // Versioning info (لو تعديل)
  const [versionInfo, setVersionInfo] = useState<{
    version: number;
    isSuperseded: boolean;
    changeReason: string;
    hasNextVersions: boolean;
  } | null>(null);

  const isEdit = !!policyId;

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;

  // ─── Load lookups (branches + departments + employees) ────────
  const loadLookups = useCallback(async () => {
    try {
      const [brRes, depRes, empRes] = await Promise.all([
        fetch("/api/branches", { headers: { Authorization: authH } }),
        fetch("/api/departments", { headers: { Authorization: authH } }),
        fetch("/api/employees/list", { headers: { Authorization: authH } }),
      ]);
      const brData = await brRes.json();
      const depData = await depRes.json();
      const empData = await empRes.json();

      setBranches(brData.results || brData.branches || brData || []);
      setDepartments(depData.results || depData.departments || depData || []);
      setEmployees(empData.results || empData.employees || []);
    } catch {
      // silent
    }
  }, [authH]);

  // ─── Load policy for edit ────────
  const loadPolicy = useCallback(async () => {
    if (!policyId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/hr/policies/insurance-policies/${policyId}`, {
        headers: { Authorization: authH },
      });
      const data = await res.json();
      const p = data.policy || data;
      if (!p?.id) {
        toast.error(ar ? "فشل التحميل" : "Load failed");
        return;
      }
      setForm({
        insurance_type: p.insurance_type,
        name_ar: p.name_ar || "",
        name_en: p.name_en || "",
        company_share_type: p.company_share_type,
        company_share_value: Number(p.company_share_value) || 0,
        employee_share_type: p.employee_share_type,
        employee_share_value: Number(p.employee_share_value) || 0,
        calculation_base: p.calculation_base || "basic",
        min_insured_salary: p.min_insured_salary ? String(p.min_insured_salary) : "",
        max_insured_salary: p.max_insured_salary ? String(p.max_insured_salary) : "",
        scope: p.scope,
        branch_id: p.branch_id || null,
        department_id: p.department_id || null,
        specific_employees: p.specific_employees || [],
        is_active: p.is_active,
        start_date: p.start_date,
        end_date: p.end_date || "",
        change_reason: "",
      });
      setVersionInfo({
        version: p.version_number,
        isSuperseded: p.is_superseded,
        changeReason: p.change_reason || "",
        hasNextVersions: p.has_next_versions,
      });
    } catch {
      toast.error(ar ? "خطأ في الاتصال" : "Network error");
    } finally {
      setLoading(false);
    }
  }, [policyId, authH, ar]);

  useEffect(() => {
    if (open) {
      loadLookups();
      if (policyId) {
        loadPolicy();
      } else {
        setForm({ ...emptyForm });
        setVersionInfo(null);
      }
    }
  }, [open, policyId, loadLookups, loadPolicy]);

  // ─── Save ────────
  const handleSave = async () => {
    if (!form.name_ar.trim()) {
      toast.error(ar ? "الاسم بالعربي مطلوب" : "Arabic name is required");
      return;
    }
    if (!form.start_date) {
      toast.error(ar ? "تاريخ البدء مطلوب" : "Start date is required");
      return;
    }
    if (form.scope === "branch" && !form.branch_id) {
      toast.error(ar ? "اختر الفرع" : "Select branch");
      return;
    }
    if (form.scope === "department" && !form.department_id) {
      toast.error(ar ? "اختر الإدارة" : "Select department");
      return;
    }
    if (form.scope === "employees" && form.specific_employees.length === 0) {
      toast.error(ar ? "اختر موظف واحد على الأقل" : "Select at least one employee");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        insurance_type: form.insurance_type,
        name_ar: form.name_ar.trim(),
        name_en: form.name_en.trim(),
        company_share_type: form.company_share_type,
        company_share_value: Number(form.company_share_value) || 0,
        employee_share_type: form.employee_share_type,
        employee_share_value: Number(form.employee_share_value) || 0,
        calculation_base: form.calculation_base,
        min_insured_salary: form.min_insured_salary ? Number(form.min_insured_salary) : null,
        max_insured_salary: form.max_insured_salary ? Number(form.max_insured_salary) : null,
        scope: form.scope,
        branch_id: form.scope === "branch" ? form.branch_id : null,
        department_id: form.scope === "department" ? form.department_id : null,
        specific_employees: form.scope === "employees" ? form.specific_employees : [],
        is_active: form.is_active,
        start_date: form.start_date,
        end_date: form.end_date || null,
        change_reason: form.change_reason.trim(),
      };

      const url = isEdit
        ? `/api/hr/policies/insurance-policies/${policyId}`
        : "/api/hr/policies/insurance-policies";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { Authorization: authH, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        if (isEdit && data.edit_mode === "new_version") {
          toast.success(
            ar
              ? `تم إنشاء النسخة رقم ${data.new_policy?.version_number} - سارية من ${data.new_policy?.start_date}`
              : `Version ${data.new_policy?.version_number} created — Effective ${data.new_policy?.start_date}`
          );
        } else if (isEdit) {
          toast.success(ar ? "تم التحديث (بدون نسخة جديدة)" : "Updated (no new version)");
        } else {
          toast.success(ar ? "تم إنشاء السياسة" : "Policy created");
        }
        onSaved();
        onClose();
      } else {
        toast.error(data.error || data.message || (ar ? "فشل الحفظ" : "Save failed"));
      }
    } catch {
      toast.error(ar ? "خطأ في الاتصال" : "Network error");
    } finally {
      setSaving(false);
    }
  };

  // ─── Employee search ────────
  const filteredEmployees = employees.filter((e) => {
    if (!empSearch.trim()) return true;
    const q = empSearch.toLowerCase();
    const name = (e.full_name || `${e.first_name_ar || ""} ${e.last_name_ar || ""}`).toLowerCase();
    return name.includes(q) || (e.employee_code || "").toLowerCase().includes(q);
  });

  const toggleEmployee = (id: number) => {
    setForm((f) => ({
      ...f,
      specific_employees: f.specific_employees.includes(id)
        ? f.specific_employees.filter((x) => x !== id)
        : [...f.specific_employees, id],
    }));
  };

  const isSocial = form.insurance_type === "social";
  const typeColor = isSocial ? "blue" : "emerald";
  const TypeIcon = isSocial ? Shield : Heart;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir={ar ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TypeIcon className={`w-5 h-5 text-${typeColor}-600`} />
            {isEdit
              ? ar ? `تعديل سياسة تأمين` : `Edit Insurance Policy`
              : ar ? `إنشاء سياسة تأمين جديدة` : `Create Insurance Policy`}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5">

            {/* ══════ Versioning banner (لو edit) ══════ */}
            {isEdit && versionInfo && (
              <div className={`p-3 rounded-lg border ${
                versionInfo.isSuperseded
                  ? "bg-orange-50 border-orange-200"
                  : "bg-blue-50 border-blue-200"
              }`}>
                <div className="flex items-start gap-2">
                  <Info className={`w-4 h-4 mt-0.5 ${
                    versionInfo.isSuperseded ? "text-orange-600" : "text-blue-600"
                  }`} />
                  <div className="flex-1 text-sm">
                    <p className="font-semibold">
                      {ar ? `النسخة رقم ${versionInfo.version}` : `Version ${versionInfo.version}`}
                    </p>
                    <p className="text-xs mt-1 text-muted-foreground">
                      {versionInfo.isSuperseded
                        ? ar
                          ? "⚠️ هذه النسخة مقفلة (تم استبدالها). أي تعديل جوهري سيُنشئ نسخة جديدة."
                          : "⚠️ Superseded. Any core edit creates a new version."
                        : ar
                          ? "💡 أي تعديل جوهري (نسب أو مبالغ) سيُنشئ نسخة جديدة تبدأ من أول الشهر التالي."
                          : "💡 Any core edit creates a new version starting next month."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ══════ Insurance Type (Radio Cards) ══════ */}
            <div>
              <label className="text-sm font-semibold block mb-2">
                {ar ? "نوع التأمين *" : "Insurance Type *"}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, insurance_type: "social" }))}
                  disabled={isEdit}
                  className={`p-4 rounded-lg border-2 transition text-right ${
                    form.insurance_type === "social"
                      ? "bg-blue-50 border-blue-500 ring-2 ring-blue-200"
                      : "bg-white border-border hover:border-blue-300"
                  } ${isEdit ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  <Shield className="w-6 h-6 text-blue-600 mb-2" />
                  <p className="font-semibold text-sm">{ar ? "تأمين اجتماعي" : "Social Insurance"}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ar ? "الهيئة العامة للتأمينات" : "Social Insurance Authority"}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, insurance_type: "medical" }))}
                  disabled={isEdit}
                  className={`p-4 rounded-lg border-2 transition text-right ${
                    form.insurance_type === "medical"
                      ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200"
                      : "bg-white border-border hover:border-emerald-300"
                  } ${isEdit ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  <Heart className="w-6 h-6 text-emerald-600 mb-2" />
                  <p className="font-semibold text-sm">{ar ? "تأمين طبي" : "Medical Insurance"}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ar ? "التأمين الصحي" : "Health Insurance"}
                  </p>
                </button>
              </div>
              {isEdit && (
                <p className="text-xs text-muted-foreground mt-2">
                  {ar ? "لا يمكن تغيير نوع التأمين بعد الإنشاء" : "Cannot change insurance type after creation"}
                </p>
              )}
            </div>

            {/* ══════ Name ══════ */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold block mb-1">
                  {ar ? "الاسم بالعربي *" : "Name (Arabic) *"}
                </label>
                <Input
                  value={form.name_ar}
                  onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))}
                  placeholder={ar ? "مثال: التأمين الاجتماعي الأساسي" : "Basic Social Insurance"}
                />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1">
                  {ar ? "الاسم بالإنجليزي" : "Name (English)"}
                </label>
                <Input
                  dir="ltr"
                  value={form.name_en}
                  onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
                  placeholder="Basic Social Insurance"
                />
              </div>
            </div>

            {/* ══════ Company Share ══════ */}
            <div className="p-4 rounded-lg bg-slate-50 border">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-slate-600" />
                <p className="font-semibold text-sm">{ar ? "حصة الشركة" : "Company Share"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    {ar ? "طريقة الحساب" : "Calculation"}
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                    value={form.company_share_type}
                    onChange={(e) => setForm((f) => ({ ...f, company_share_type: e.target.value }))}
                  >
                    {SHARE_TYPES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {ar ? s.label_ar : s.label_en}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    {form.company_share_type === "percent"
                      ? (ar ? "النسبة (%)" : "Percentage (%)")
                      : (ar ? "المبلغ (EGP)" : "Amount (EGP)")}
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.company_share_value}
                      onChange={(e) => setForm((f) => ({ ...f, company_share_value: Number(e.target.value) }))}
                      className="pl-8"
                    />
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {form.company_share_type === "percent" ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ══════ Employee Share ══════ */}
            <div className="p-4 rounded-lg bg-slate-50 border">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-slate-600" />
                <p className="font-semibold text-sm">{ar ? "حصة الموظف" : "Employee Share"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    {ar ? "طريقة الحساب" : "Calculation"}
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                    value={form.employee_share_type}
                    onChange={(e) => setForm((f) => ({ ...f, employee_share_type: e.target.value }))}
                  >
                    {SHARE_TYPES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {ar ? s.label_ar : s.label_en}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    {form.employee_share_type === "percent"
                      ? (ar ? "النسبة (%)" : "Percentage (%)")
                      : (ar ? "المبلغ (EGP)" : "Amount (EGP)")}
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.employee_share_value}
                      onChange={(e) => setForm((f) => ({ ...f, employee_share_value: Number(e.target.value) }))}
                      className="pl-8"
                    />
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {form.employee_share_type === "percent" ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ══════ أساس حساب التأمين ══════ */}
            <div className="p-4 rounded-lg bg-amber-50/50 border border-amber-200/60">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-amber-700" />
                <p className="font-semibold text-sm">
                  {ar ? "أساس حساب التأمين *" : "Calculation Base *"}
                </p>
              </div>
              <div className="space-y-2">
                {[
                  {
                    value: "basic",
                    label_ar: "الراتب الأساسي فقط",
                    label_en: "Basic Salary Only",
                    desc_ar: "يُستخدم basic_salary الخاص بالموظف",
                    desc_en: "Uses employee's basic_salary",
                  },
                  {
                    value: "gross",
                    label_ar: "الراتب الإجمالي (أساسي + بدلات)",
                    label_en: "Gross Salary (Basic + Allowances)",
                    desc_ar: "لسه مستقبلي - حالياً يستخدم basic",
                    desc_en: "Future feature - currently uses basic",
                  },
                  {
                    value: "employee_custom",
                    label_ar: "المرتب التأميني الخاص بالموظف",
                    label_en: "Employee's Custom Insurance Salary",
                    desc_ar: "يستخدم insurance_base_salary لكل موظف (لو مش محدد يرجع للـ basic)",
                    desc_en: "Uses per-employee insurance_base_salary (falls back to basic if empty)",
                  },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-2 p-3 rounded-lg border-2 cursor-pointer transition ${
                      form.calculation_base === opt.value
                        ? "bg-amber-100/50 border-amber-400"
                        : "bg-white border-border hover:border-amber-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="calculation_base"
                      value={opt.value}
                      checked={form.calculation_base === opt.value}
                      onChange={() => setForm((f) => ({ ...f, calculation_base: opt.value as any }))}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{ar ? opt.label_ar : opt.label_en}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ar ? opt.desc_ar : opt.desc_en}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* ══════ Salary Bounds (اختياري) ══════ */}
            {isSocial && (
              <div className="p-4 rounded-lg bg-blue-50/40 border border-blue-200/50">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-blue-600" />
                  <p className="font-semibold text-sm">
                    {ar ? "حدود المرتب المؤمّن عليه (اختياري)" : "Insured Salary Range (Optional)"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      {ar ? "الحد الأدنى (EGP)" : "Min (EGP)"}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.min_insured_salary}
                      onChange={(e) => setForm((f) => ({ ...f, min_insured_salary: e.target.value }))}
                      placeholder={ar ? "مثلا: 1400" : "e.g. 1400"}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      {ar ? "الحد الأقصى (EGP)" : "Max (EGP)"}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.max_insured_salary}
                      onChange={(e) => setForm((f) => ({ ...f, max_insured_salary: e.target.value }))}
                      placeholder={ar ? "مثلا: 12600" : "e.g. 12600"}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {ar
                    ? "لو راتب الموظف خارج النطاق، الحساب هيتم على الحد الأدنى/الأقصى."
                    : "Salaries outside range are capped to min/max."}
                </p>
              </div>
            )}

            {/* ══════ Scope ══════ */}
            <div>
              <label className="text-sm font-semibold block mb-2">
                {ar ? "نطاق التطبيق *" : "Scope *"}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SCOPES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, scope: s.value }))}
                    className={`p-3 rounded-lg border-2 transition text-right flex items-center gap-2 ${
                      form.scope === s.value
                        ? "bg-brand-primary/5 border-brand-primary"
                        : "bg-white border-border hover:border-brand-primary/50"
                    }`}
                  >
                    <s.icon className="w-4 h-4 text-brand-primary" />
                    <span className="text-sm font-medium">
                      {ar ? s.label_ar : s.label_en}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Scope details */}
            {form.scope === "branch" && (
              <div>
                <label className="text-sm font-semibold block mb-1">{ar ? "الفرع" : "Branch"}</label>
                <select
                  className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                  value={form.branch_id || ""}
                  onChange={(e) => setForm((f) => ({ ...f, branch_id: Number(e.target.value) || null }))}
                >
                  <option value="">{ar ? "— اختر —" : "— Select —"}</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name_ar || b.name_en || b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {form.scope === "department" && (
              <div>
                <label className="text-sm font-semibold block mb-1">{ar ? "الإدارة" : "Department"}</label>
                <select
                  className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                  value={form.department_id || ""}
                  onChange={(e) => setForm((f) => ({ ...f, department_id: Number(e.target.value) || null }))}
                >
                  <option value="">{ar ? "— اختر —" : "— Select —"}</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name_ar || d.name_en || d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {form.scope === "employees" && (
              <div>
                <label className="text-sm font-semibold block mb-1">
                  {ar ? `الموظفين المحددين (${form.specific_employees.length})` : `Selected Employees (${form.specific_employees.length})`}
                </label>
                <Input
                  placeholder={ar ? "🔍 ابحث..." : "🔍 Search..."}
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  className="mb-2"
                />
                <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                  {filteredEmployees.map((e) => (
                    <label
                      key={e.id}
                      className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.specific_employees.includes(e.id)}
                        onChange={() => toggleEmployee(e.id)}
                      />
                      <span className="text-sm">
                        {e.full_name || `${e.first_name_ar || ""} ${e.last_name_ar || ""}`.trim() || `#${e.id}`}
                        {e.employee_code && <span className="text-xs text-muted-foreground mr-2">({e.employee_code})</span>}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* ══════ Dates ══════ */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold block mb-1">
                  {ar ? "من تاريخ *" : "Start Date *"}
                </label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1">
                  {ar ? "لحد تاريخ" : "End Date"}
                </label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                />
              </div>
            </div>

            {/* Active */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
              <label htmlFor="isActive" className="text-sm">
                {ar ? "السياسة نشطة" : "Policy is active"}
              </label>
            </div>

            {/* Change Reason (لو edit) */}
            {isEdit && (
              <div>
                <label className="text-sm font-semibold block mb-1">
                  {ar ? "سبب التغيير" : "Change Reason"}
                </label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md text-sm min-h-[70px]"
                  value={form.change_reason}
                  onChange={(e) => setForm((f) => ({ ...f, change_reason: e.target.value }))}
                  placeholder={ar ? "مثال: قرار وزاري رقم 12/2026" : "e.g. Ministerial decree #12/2026"}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {ar ? "مطلوب لو هتعدل النسب (لأمانة السجلات)" : "Required if editing rates (for audit)"}
                </p>
              </div>
            )}

            {/* ══════ Actions ══════ */}
            <div className="flex gap-2 justify-end pt-3 border-t">
              <Button variant="outline" onClick={onClose} disabled={saving}>
                {ar ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className={`gap-2 ${isSocial ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isEdit ? (ar ? "حفظ التعديلات" : "Save Changes") : (ar ? "إنشاء السياسة" : "Create Policy")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


