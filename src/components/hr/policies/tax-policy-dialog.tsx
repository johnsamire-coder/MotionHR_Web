"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Landmark, Save, Loader2, Info, Percent, Users,
  Building2, User, Plus, Trash2,
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

interface Branch { id: number; name_ar?: string; name_en?: string; name?: string; }
interface Department { id: number; name_ar?: string; name_en?: string; name?: string; }
interface TaxBracket { from: number; to: number | null; rate: number; }

const emptyBracket: TaxBracket = { from: 0, to: null, rate: 0 };

const emptyForm = {
  name: "ضريبة الدخل",
  country: "EG",
  tax_year: new Date().getFullYear(),
  tax_brackets: [{ from: 0, to: 40000, rate: 0 }] as TaxBracket[],
  personal_exemption_single: 9000,
  personal_exemption_married: 9000,
  child_exemption: 0,
  max_children_exempted: 3,
  exempt_social_insurance: true,
  exempt_medical_insurance: true,
  additional_exemption: 0,
  calculation_method: "monthly_progressive",
  scope: "company",
  branch_id: null as number | null,
  department_id: null as number | null,
  is_active: true,
  start_date: new Date().toISOString().slice(0, 10),
  end_date: "",
  change_reason: "",
};

const SCOPES = [
  { value: "company", icon: Users, label_ar: "الشركة كلها", label_en: "Whole Company" },
  { value: "branch", icon: Building2, label_ar: "فرع محدد", label_en: "Specific Branch" },
  { value: "department", icon: User, label_ar: "إدارة محددة", label_en: "Specific Department" },
];

export default function TaxPolicyDialog({ open, onClose, onSaved, policyId, ar }: Props) {
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const isEdit = !!policyId;
  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;

  const loadLists = useCallback(async () => {
    try {
      const [brRes, depRes] = await Promise.all([
        fetch("/api/branches", { headers: { Authorization: authH } }),
        fetch("/api/departments", { headers: { Authorization: authH } }),
      ]);
      const brData = await brRes.json();
      const depData = await depRes.json();
      setBranches(brData.results || brData.branches || brData || []);
      setDepartments(depData.results || depData.departments || depData || []);
    } catch { /* silent */ }
  }, [authH]);

  const loadPolicy = useCallback(async () => {
    if (!policyId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/hr/policies/tax/${policyId}`, {
        headers: { Authorization: authH },
      });
      const data = await res.json();
      const p = data.policy || data;
      if (!p?.id) { toast.error(ar ? "فشل التحميل" : "Load failed"); return; }
      setForm({
        name: p.name,
        country: p.country,
        tax_year: p.tax_year,
        tax_brackets: p.tax_brackets && p.tax_brackets.length ? p.tax_brackets : [{ ...emptyBracket }],
        personal_exemption_single: p.personal_exemption_single,
        personal_exemption_married: p.personal_exemption_married,
        child_exemption: p.child_exemption,
        max_children_exempted: p.max_children_exempted,
        exempt_social_insurance: p.exempt_social_insurance,
        exempt_medical_insurance: p.exempt_medical_insurance,
        additional_exemption: p.additional_exemption,
        calculation_method: p.calculation_method,
        scope: p.scope,
        branch_id: p.branch_id || null,
        department_id: p.department_id || null,
        is_active: p.is_active,
        start_date: p.start_date,
        end_date: p.end_date || "",
        change_reason: "",
      });
    } finally { setLoading(false); }
  }, [policyId, authH, ar]);

  useEffect(() => {
    if (open) {
      loadLists();
      if (policyId) loadPolicy();
      else setForm({ ...emptyForm });
    }
  }, [open, policyId, loadLists, loadPolicy]);

  const updateBracket = (index: number, field: keyof TaxBracket, value: number | null) => {
    const brackets = [...form.tax_brackets];
    brackets[index] = { ...brackets[index], [field]: value };
    setForm({ ...form, tax_brackets: brackets });
  };

  const addBracket = () => {
    const last = form.tax_brackets[form.tax_brackets.length - 1];
    setForm({
      ...form,
      tax_brackets: [...form.tax_brackets, { from: (last?.to || 0) + 1, to: null, rate: 0 }],
    });
  };

  const removeBracket = (index: number) => {
    if (form.tax_brackets.length <= 1) return;
    setForm({ ...form, tax_brackets: form.tax_brackets.filter((_, i) => i !== index) });
  };

  const handleSave = async () => {
    if (!form.start_date) { toast.error(ar ? "تاريخ البدء مطلوب" : "Start date required"); return; }
    if (form.scope === "branch" && !form.branch_id) { toast.error(ar ? "اختر الفرع" : "Select branch"); return; }
    if (form.scope === "department" && !form.department_id) { toast.error(ar ? "اختر الإدارة" : "Select department"); return; }

    setSaving(true);
    try {
      const url = isEdit ? `/api/hr/policies/tax/${policyId}` : "/api/hr/policies/tax";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { Authorization: authH, "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          branch_id: form.scope === "branch" ? form.branch_id : null,
          department_id: form.scope === "department" ? form.department_id : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isEdit ? (ar ? "تم الحفظ" : "Saved") : (ar ? "تم إنشاء سياسة الضريبة" : "Tax policy created"));
        onSaved();
        onClose();
      } else {
        toast.error(data.error || (ar ? "فشل الحفظ" : "Failed"));
      }
    } catch {
      toast.error(ar ? "خطأ في الاتصال" : "Network error");
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir={ar ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-brand-primary" />
            {isEdit ? (ar ? "تعديل سياسة الضريبة" : "Edit Tax Policy") : (ar ? "إنشاء سياسة ضريبة" : "Create Tax Policy")}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* ═══ البيانات الأساسية ═══ */}
            <div className="p-4 rounded-lg bg-slate-50 border">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-slate-600" />
                <p className="font-semibold text-sm">{ar ? "البيانات الأساسية" : "Basic Info"}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "اسم السياسة" : "Name"}</label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "الدولة" : "Country"}</label>
                  <select className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}>
                    <option value="EG">{ar ? "مصر" : "Egypt"}</option>
                    <option value="SA">{ar ? "السعودية" : "Saudi Arabia"}</option>
                    <option value="AE">{ar ? "الإمارات" : "UAE"}</option>
                    <option value="KW">{ar ? "الكويت" : "Kuwait"}</option>
                    <option value="OTHER">{ar ? "أخرى" : "Other"}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "السنة الضريبية" : "Tax Year"}</label>
                  <Input type="number" value={form.tax_year}
                    onChange={(e) => setForm({ ...form, tax_year: Number(e.target.value) || new Date().getFullYear() })} />
                </div>
              </div>
            </div>

            {/* ═══ النطاق ═══ */}
            <div className="p-4 rounded-lg bg-slate-50 border">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-slate-600" />
                <p className="font-semibold text-sm">{ar ? "نطاق التطبيق" : "Scope"}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {SCOPES.map((s) => (
                  <button key={s.value} type="button"
                    onClick={() => setForm((f) => ({ ...f, scope: s.value }))}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-right ${
                      form.scope === s.value ? "border-brand-primary bg-brand-primary/5" : "bg-white border-border hover:border-brand-primary/50"
                    }`}>
                    <s.icon className="w-4 h-4 text-brand-primary" />
                    <span className="text-sm font-medium">{ar ? s.label_ar : s.label_en}</span>
                  </button>
                ))}
              </div>
              {form.scope === "branch" && (
                <select className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                  value={form.branch_id || ""}
                  onChange={(e) => setForm((f) => ({ ...f, branch_id: Number(e.target.value) || null }))}>
                  <option value="">{ar ? "— اختر الفرع —" : "— Select Branch —"}</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name_ar || b.name_en || b.name}</option>
                  ))}
                </select>
              )}
              {form.scope === "department" && (
                <select className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                  value={form.department_id || ""}
                  onChange={(e) => setForm((f) => ({ ...f, department_id: Number(e.target.value) || null }))}>
                  <option value="">{ar ? "— اختر الإدارة —" : "— Select Department —"}</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name_ar || d.name_en || d.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* ═══ الشرائح الضريبية ═══ */}
            <div className="p-4 rounded-lg bg-slate-50 border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-slate-600" />
                  <p className="font-semibold text-sm">{ar ? "الشرائح الضريبية (سنوي)" : "Tax Brackets (Annual)"}</p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={addBracket} className="gap-1 text-xs">
                  <Plus className="w-3.5 h-3.5" />{ar ? "إضافة شريحة" : "Add Bracket"}
                </Button>
              </div>
              <div className="space-y-2">
                {form.tax_brackets.map((bracket, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center bg-white p-2 rounded border">
                    <div>
                      <label className="text-[10px] text-muted-foreground block">{ar ? "من" : "From"}</label>
                      <Input type="number" value={bracket.from}
                        onChange={(e) => updateBracket(i, "from", Number(e.target.value) || 0)} className="h-8 text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block">{ar ? "إلى (فارغ = بلا حد)" : "To (empty = no limit)"}</label>
                      <Input type="number" value={bracket.to ?? ""}
                        onChange={(e) => updateBracket(i, "to", e.target.value === "" ? null : Number(e.target.value))} className="h-8 text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block">{ar ? "نسبة %" : "Rate %"}</label>
                      <Input type="number" step="0.5" value={bracket.rate}
                        onChange={(e) => updateBracket(i, "rate", Number(e.target.value) || 0)} className="h-8 text-sm" />
                    </div>
                    <Button type="button" size="sm" variant="ghost" onClick={() => removeBracket(i)}
                      disabled={form.tax_brackets.length <= 1} className="h-8 w-8 p-0 text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* ═══ الإعفاءات ═══ */}
            <div className="p-4 rounded-lg bg-slate-50 border">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-slate-600" />
                <p className="font-semibold text-sm">{ar ? "الإعفاءات (سنوي)" : "Exemptions (Annual)"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "إعفاء أعزب" : "Single Exemption"}</label>
                  <Input type="number" value={form.personal_exemption_single}
                    onChange={(e) => setForm({ ...form, personal_exemption_single: Number(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "إعفاء متزوج" : "Married Exemption"}</label>
                  <Input type="number" value={form.personal_exemption_married}
                    onChange={(e) => setForm({ ...form, personal_exemption_married: Number(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "إعفاء لكل ابن معال" : "Per Child Exemption"}</label>
                  <Input type="number" value={form.child_exemption}
                    onChange={(e) => setForm({ ...form, child_exemption: Number(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "أقصى عدد أبناء للإعفاء" : "Max Children"}</label>
                  <Input type="number" value={form.max_children_exempted}
                    onChange={(e) => setForm({ ...form, max_children_exempted: Number(e.target.value) || 0 })} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "إعفاءات إضافية سنوية" : "Additional Exemptions"}</label>
                  <Input type="number" value={form.additional_exemption}
                    onChange={(e) => setForm({ ...form, additional_exemption: Number(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.exempt_social_insurance}
                    onChange={(e) => setForm({ ...form, exempt_social_insurance: e.target.checked })} />
                  {ar ? "إعفاء حصة الموظف من التأمين الاجتماعي" : "Exempt employee's social insurance share"}
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.exempt_medical_insurance}
                    onChange={(e) => setForm({ ...form, exempt_medical_insurance: e.target.checked })} />
                  {ar ? "إعفاء حصة الموظف من التأمين الطبي" : "Exempt employee's medical insurance share"}
                </label>
              </div>
            </div>

            {/* ═══ طريقة الحساب ═══ */}
            <div className="p-4 rounded-lg bg-slate-50 border">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-slate-600" />
                <p className="font-semibold text-sm">{ar ? "طريقة الحساب" : "Calculation Method"}</p>
              </div>
              <select className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                value={form.calculation_method}
                onChange={(e) => setForm({ ...form, calculation_method: e.target.value })}>
                <option value="monthly_progressive">{ar ? "حساب تقدمي شهري (12/12 من السنوي)" : "Monthly Progressive"}</option>
                <option value="cumulative">{ar ? "حساب تراكمي" : "Cumulative"}</option>
              </select>
            </div>

            {/* ═══ التواريخ ═══ */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold block mb-1">{ar ? "من تاريخ *" : "Start Date *"}</label>
                <Input type="date" value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1">{ar ? "لحد تاريخ" : "End Date"}</label>
                <Input type="date" value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              {ar ? "السياسة نشطة" : "Policy is active"}
            </label>

            {isEdit && (
              <div>
                <label className="text-sm font-semibold block mb-1">{ar ? "سبب التغيير" : "Change Reason"}</label>
                <textarea className="w-full px-3 py-2 border rounded-md text-sm min-h-[70px]"
                  value={form.change_reason}
                  onChange={(e) => setForm({ ...form, change_reason: e.target.value })}
                  placeholder={ar ? "مثال: تحديث الشرائح بحسب القانون الجديد" : "e.g. Update brackets per new law"} />
              </div>
            )}

            <div className="flex gap-2 justify-end pt-3 border-t">
              <Button variant="outline" onClick={onClose} disabled={saving}>{ar ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2 bg-brand-primary hover:bg-brand-primary/90">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isEdit ? (ar ? "حفظ التعديلات" : "Save") : (ar ? "إنشاء السياسة" : "Create")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
