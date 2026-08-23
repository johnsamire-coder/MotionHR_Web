"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { TrendingDown, Save, Loader2, Info, Plus, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  ruleId: number | null;
  ar: boolean;
}

interface Branch { id: number; name_ar?: string; name?: string; }
interface Department { id: number; name_ar?: string; name?: string; }
interface Employee {
  id: number;
  full_name?: string;
  first_name_ar?: string;
  last_name_ar?: string;
  employee_code?: string;
}

interface Tier {
  from: number;
  to: number | null;
  deduction_type: string;
  value?: number;
}

const PENALTY_TYPES = [
  { value: "late_arrival",     label_ar: "تأخير الحضور",       unit_ar: "دقيقة" },
    { value: "early_leave",      label_ar: "الخروج المبكر",      unit_ar: "دقيقة" },
  { value: "missing_checkout", label_ar: "عدم تسجيل الخروج",   unit_ar: "مرة" },
];

const DEDUCTION_TYPES = [
  { value: "fixed_per_unit",    label_ar: "مبلغ ثابت لكل وحدة",   needs_value: true,  suffix: "EGP" },
  { value: "fixed_total",       label_ar: "مبلغ ثابت إجمالي",     needs_value: true,  suffix: "EGP" },
  { value: "percent_basic",     label_ar: "% من الراتب الأساسي",  needs_value: true,  suffix: "%" },
  { value: "quarter_day",       label_ar: "ربع يوم",               needs_value: false, suffix: "" },
  { value: "half_day",          label_ar: "نصف يوم",               needs_value: false, suffix: "" },
  { value: "full_day",          label_ar: "يوم كامل",              needs_value: false, suffix: "" },
  { value: "two_days",          label_ar: "يومين",                 needs_value: false, suffix: "" },
  { value: "three_days",        label_ar: "3 أيام",                needs_value: false, suffix: "" },
  { value: "day_plus_warning",  label_ar: "يوم + إنذار كتابي",    needs_value: false, suffix: "" },
];

const emptyTier: Tier = { from: 1, to: 15, deduction_type: "fixed_per_unit", value: 1 };

const emptyForm = {
  name: "",
  penalty_type: "late_arrival",
  grace_amount: 0,
  tiers: [{ ...emptyTier }] as Tier[],
  warnings_enabled: false,
  first_warning_after: 3,
  second_warning_after: 5,
  termination_after: 10,
  scope: "company",
  branch_id: null as number | null,
  department_id: null as number | null,
  specific_employees: [] as number[],
  is_active: true,
  start_date: new Date().toISOString().slice(0, 10),
  end_date: "",
  change_reason: "",
};

export default function PenaltyRuleDialog({ open, onClose, onSaved, ruleId, ar }: Props) {
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [empSearch, setEmpSearch] = useState("");
  const [versionInfo, setVersionInfo] = useState<{ version: number; isSuperseded: boolean } | null>(null);

  const isEdit = !!ruleId;
  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;

  const currentType = PENALTY_TYPES.find(t => t.value === form.penalty_type) || PENALTY_TYPES[0];

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
    } catch {}
  }, [authH]);

  const loadRule = useCallback(async () => {
    if (!ruleId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/hr/policies/rules-penalty/${ruleId}`, { headers: { Authorization: authH } });
      const data = await res.json();
      const r = data.rule || data;
      if (!r?.id) { toast.error(ar ? "فشل التحميل" : "Load failed"); return; }
      setForm({
        name: r.name,
        penalty_type: r.penalty_type,
        grace_amount: r.grace_amount,
        tiers: r.tiers && r.tiers.length > 0 ? r.tiers : [{ ...emptyTier }],
        warnings_enabled: r.warnings_enabled,
        first_warning_after: r.first_warning_after,
        second_warning_after: r.second_warning_after,
        termination_after: r.termination_after,
        scope: r.scope,
        branch_id: r.branch_id || null,
        department_id: r.department_id || null,
        specific_employees: r.specific_employees || [],
        is_active: r.is_active,
        start_date: r.start_date,
        end_date: r.end_date || "",
        change_reason: "",
      });
      setVersionInfo({ version: r.version_number, isSuperseded: r.is_superseded });
    } finally { setLoading(false); }
  }, [ruleId, authH, ar]);

  useEffect(() => {
    if (open) {
      loadLookups();
      if (ruleId) loadRule();
      else { setForm({ ...emptyForm }); setVersionInfo(null); setEmpSearch(""); }
    }
  }, [open, ruleId, loadLookups, loadRule]);

  const addTier = () => {
    const lastTier = form.tiers[form.tiers.length - 1];
    const newFrom = (lastTier?.to || lastTier?.from || 0) + 1;
    setForm({ ...form, tiers: [...form.tiers, { from: newFrom, to: newFrom + 14, deduction_type: "fixed_per_unit", value: 1 }] });
  };

  const removeTier = (index: number) => {
    if (form.tiers.length === 1) {
      toast.error(ar ? "لازم شريحة واحدة على الأقل" : "At least one tier required");
      return;
    }
    setForm({ ...form, tiers: form.tiers.filter((_, i) => i !== index) });
  };

  const updateTier = (index: number, field: keyof Tier, value: any) => {
    const newTiers = [...form.tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setForm({ ...form, tiers: newTiers });
  };

  const toggleEmployee = (id: number) => {
    setForm(f => ({
      ...f,
      specific_employees: f.specific_employees.includes(id)
        ? f.specific_employees.filter(x => x !== id)
        : [...f.specific_employees, id],
    }));
  };

  const filteredEmployees = employees.filter(e => {
    if (!empSearch.trim()) return true;
    const q = empSearch.toLowerCase();
    const name = (e.full_name || `${e.first_name_ar || ""} ${e.last_name_ar || ""}`).toLowerCase();
    return name.includes(q) || (e.employee_code || "").toLowerCase().includes(q);
  });

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error(ar ? "الاسم مطلوب" : "Name required"); return; }
    if (form.tiers.length === 0) { toast.error(ar ? "لازم شريحة واحدة على الأقل" : "At least one tier"); return; }
    if (form.scope === "branch" && !form.branch_id) { toast.error(ar ? "اختر الفرع" : "Select branch"); return; }
    if (form.scope === "department" && !form.department_id) { toast.error(ar ? "اختر الإدارة" : "Select department"); return; }
    if (form.scope === "employees" && form.specific_employees.length === 0) { toast.error(ar ? "اختر موظف واحد على الأقل" : "Select at least one employee"); return; }

    setSaving(true);
    try {
      const url = isEdit ? `/api/hr/policies/rules-penalty/${ruleId}` : "/api/hr/policies/rules-penalty";
      const method = isEdit ? "PUT" : "POST";
      const payload = {
        ...form,
        branch_id: form.scope === "branch" ? form.branch_id : null,
        department_id: form.scope === "department" ? form.department_id : null,
        specific_employees: form.scope === "employees" ? form.specific_employees : [],
        end_date: form.end_date || null,
      };
      const res = await fetch(url, {
        method,
        headers: { Authorization: authH, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        if (isEdit && data.edit_mode === "new_version") {
          toast.success(ar ? `تم إنشاء النسخة رقم ${data.new_rule?.version_number}` : `Version ${data.new_rule?.version_number} created`);
        } else {
          toast.success(ar ? "تم الحفظ" : "Saved");
        }
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
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto" dir={ar ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            {isEdit ? (ar ? "تعديل قاعدة جزاء" : "Edit Penalty Rule") : (ar ? "إنشاء قاعدة جزاء" : "Create Penalty Rule")}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : (
          <div className="space-y-5">
            {isEdit && versionInfo && (
              <div className={`p-3 rounded-lg border ${versionInfo.isSuperseded ? "bg-orange-50 border-orange-200" : "bg-blue-50 border-blue-200"}`}>
                <div className="flex items-start gap-2 text-sm">
                  <Info className={`w-4 h-4 mt-0.5 ${versionInfo.isSuperseded ? "text-orange-600" : "text-blue-600"}`} />
                  <div>
                    <p className="font-semibold">{ar ? `النسخة رقم ${versionInfo.version}` : `Version ${versionInfo.version}`}</p>
                    <p className="text-xs mt-1 text-muted-foreground">
                      {ar ? "أي تعديل جوهري ينشئ نسخة جديدة تبدأ من أول الشهر التالي." : "Core edit creates new version next month."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* اسم القاعدة */}
            <div>
              <label className="text-sm font-semibold block mb-1">{ar ? "اسم القاعدة *" : "Rule Name *"}</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>

            {/* نوع الجزاء */}
            <div>
              <label className="text-sm font-semibold block mb-2">{ar ? "نوع الجزاء *" : "Penalty Type *"}</label>
              <div className="grid grid-cols-2 gap-2">
                {PENALTY_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm({ ...form, penalty_type: t.value })}
                    disabled={isEdit}
                    className={`p-3 rounded-lg border-2 text-right transition ${
                      form.penalty_type === t.value
                        ? "bg-red-50 border-red-500"
                        : "bg-white border-border hover:border-red-300"
                    } ${isEdit ? "opacity-70 cursor-not-allowed" : ""}`}
                  >
                    <p className="font-medium text-sm">{t.label_ar}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* فترة السماح */}
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <label className="text-sm font-semibold block mb-1">
                {ar ? `فترة السماح (${currentType.unit_ar})` : `Grace Period (${currentType.unit_ar})`}
              </label>
              <Input type="number" value={form.grace_amount}
                onChange={(e) => setForm({ ...form, grace_amount: Number(e.target.value) || 0 })} />
              <p className="text-xs text-muted-foreground mt-1">
                {ar
                  ? `الـ ${currentType.unit_ar} الأولى من الجزاء لا تُحسب`
                  : `First units are ignored`}
              </p>
            </div>

            {/* ═══ الشرائح (Tiers) ═══ */}
            <div className="p-4 rounded-lg bg-red-50 border-2 border-red-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-700" />
                  <p className="font-semibold text-sm">{ar ? "الشرائح التصاعدية" : "Progressive Tiers"}</p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={addTier} className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  {ar ? "أضف شريحة" : "Add Tier"}
                </Button>
              </div>
              <div className="space-y-3">
                {form.tiers.map((tier, idx) => {
                  const dtDef = DEDUCTION_TYPES.find(d => d.value === tier.deduction_type) || DEDUCTION_TYPES[0];
                  return (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-red-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-red-700">
                          {ar ? `الشريحة ${idx + 1}` : `Tier ${idx + 1}`}
                        </span>
                        <Button type="button" size="sm" variant="ghost" onClick={() => removeTier(idx)} className="h-7 w-7 p-0 text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">
                            {ar ? `من (${currentType.unit_ar})` : `From`}
                          </label>
                          <Input type="number" value={tier.from}
                            onChange={(e) => updateTier(idx, "from", Number(e.target.value) || 0)} />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">
                            {ar ? `إلى (فارغ = بدون حد)` : `To (empty = no limit)`}
                          </label>
                          <Input type="number" value={tier.to || ""}
                            placeholder={ar ? "بدون حد" : "No limit"}
                            onChange={(e) => updateTier(idx, "to", e.target.value ? Number(e.target.value) : null)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">{ar ? "نوع الخصم" : "Deduction Type"}</label>
                          <select className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                            value={tier.deduction_type}
                            onChange={(e) => updateTier(idx, "deduction_type", e.target.value)}>
                            {DEDUCTION_TYPES.map(d => (
                              <option key={d.value} value={d.value}>{d.label_ar}</option>
                            ))}
                          </select>
                        </div>
                        {dtDef.needs_value && (
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">
                              {ar ? "القيمة" : "Value"} ({dtDef.suffix})
                            </label>
                            <Input type="number" step="0.01" value={tier.value || 0}
                              onChange={(e) => updateTier(idx, "value", Number(e.target.value) || 0)} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* الإنذارات التصاعدية */}
            <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
              <label className="flex items-center gap-2 mb-3 cursor-pointer">
                <input type="checkbox" checked={form.warnings_enabled}
                  onChange={(e) => setForm({ ...form, warnings_enabled: e.target.checked })} />
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-700" />
                  <span className="font-semibold text-sm">{ar ? "تفعيل الإنذارات التصاعدية" : "Enable Progressive Warnings"}</span>
                </div>
              </label>
              {form.warnings_enabled && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{ar ? "الإنذار 1 بعد" : "1st warning after"}</label>
                    <Input type="number" value={form.first_warning_after}
                      onChange={(e) => setForm({ ...form, first_warning_after: Number(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{ar ? "الإنذار 2 بعد" : "2nd warning after"}</label>
                    <Input type="number" value={form.second_warning_after}
                      onChange={(e) => setForm({ ...form, second_warning_after: Number(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{ar ? "الفصل بعد" : "Termination after"}</label>
                    <Input type="number" value={form.termination_after}
                      onChange={(e) => setForm({ ...form, termination_after: Number(e.target.value) || 0 })} />
                  </div>
                </div>
              )}
            </div>

            {/* النطاق */}
            <div>
              <label className="text-sm font-semibold block mb-2">{ar ? "نطاق التطبيق *" : "Scope *"}</label>
              <select className="w-full px-3 py-2 border rounded-md bg-white text-sm mb-2"
                value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })}>
                <option value="company">{ar ? "الشركة كلها" : "Whole Company"}</option>
                <option value="branch">{ar ? "فرع محدد" : "Specific Branch"}</option>
                <option value="department">{ar ? "إدارة محددة" : "Specific Department"}</option>
                <option value="employees">{ar ? "موظفين محددين" : "Specific Employees"}</option>
              </select>

              {form.scope === "branch" && (
                <select className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                  value={form.branch_id || ""} onChange={(e) => setForm({ ...form, branch_id: Number(e.target.value) || null })}>
                  <option value="">{ar ? "-- اختر الفرع --" : "-- Select --"}</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name_ar || b.name}</option>)}
                </select>
              )}

              {form.scope === "department" && (
                <select className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                  value={form.department_id || ""} onChange={(e) => setForm({ ...form, department_id: Number(e.target.value) || null })}>
                  <option value="">{ar ? "-- اختر الإدارة --" : "-- Select --"}</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name_ar || d.name}</option>)}
                </select>
              )}

              {form.scope === "employees" && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {ar ? `عدد المختارين: ${form.specific_employees.length}` : `Selected: ${form.specific_employees.length}`}
                  </p>
                  <Input placeholder={ar ? "🔍 ابحث..." : "🔍 Search..."}
                    value={empSearch} onChange={(e) => setEmpSearch(e.target.value)} className="mb-2" />
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                    {filteredEmployees.map(e => (
                      <label key={e.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                        <input type="checkbox" checked={form.specific_employees.includes(e.id)}
                          onChange={() => toggleEmployee(e.id)} />
                        <span className="text-sm">
                          {e.full_name || `${e.first_name_ar || ""} ${e.last_name_ar || ""}`.trim() || `#${e.id}`}
                          {e.employee_code && <span className="text-xs text-muted-foreground mr-2">({e.employee_code})</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* التواريخ */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold block mb-1">{ar ? "من تاريخ *" : "Start *"}</label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1">{ar ? "لحد تاريخ" : "End"}</label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              {ar ? "القاعدة نشطة" : "Rule is active"}
            </label>

            {isEdit && (
              <div>
                <label className="text-sm font-semibold block mb-1">{ar ? "سبب التغيير" : "Change Reason"}</label>
                <textarea className="w-full px-3 py-2 border rounded-md text-sm min-h-[70px]"
                  value={form.change_reason} onChange={(e) => setForm({ ...form, change_reason: e.target.value })} />
              </div>
            )}

            <div className="flex gap-2 justify-end pt-3 border-t sticky bottom-0 bg-white">
              <Button variant="outline" onClick={onClose} disabled={saving}>{ar ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2 bg-red-600 hover:bg-red-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isEdit ? (ar ? "حفظ" : "Save") : (ar ? "إنشاء" : "Create")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
