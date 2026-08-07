"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { DollarSign, Save, Loader2, Info, Plus, Trash2 } from "lucide-react";
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
  value: number;
}

const ALLOWANCE_TYPES = [
  { value: "field_work",     label_ar: "بدل الميدان" },
  { value: "meals",          label_ar: "بدل الوجبات" },
  { value: "transport",      label_ar: "بدل المواصلات" },
  { value: "housing",        label_ar: "بدل السكن" },
  { value: "phone",          label_ar: "بدل التليفون" },
  { value: "clothing",       label_ar: "بدل الملابس" },
  { value: "representation", label_ar: "بدل تمثيل" },
  { value: "education",      label_ar: "بدل تعليم" },
  { value: "other",          label_ar: "بدل آخر" },
];

const CALCULATION_TYPES = [
  { value: "fixed_monthly",  label_ar: "مبلغ شهري ثابت",     hint: "يتصرف كامل كل شهر" },
  { value: "per_day",        label_ar: "لكل يوم عمل",         hint: "يُضرب في عدد أيام العمل" },
  { value: "per_visit",      label_ar: "لكل زيارة/عملية",     hint: "يُضرب في عدد الزيارات" },
  { value: "per_km",         label_ar: "لكل كيلومتر",         hint: "يُضرب في عدد الكيلومترات" },
  { value: "tiered",         label_ar: "شرائح تصاعدية",       hint: "حسب عدد الوحدات (زيارات/كم)" },
];

const emptyForm = {
  name: "",
  allowance_type: "field_work",
  calculation_type: "fixed_monthly",
  fixed_amount: 0,
  tiers: [{ from: 1, to: 10, value: 500 }] as Tier[],
  min_work_hours_per_day: 0,
  scope: "company",
  branch_id: null as number | null,
  department_id: null as number | null,
  specific_employees: [] as number[],
  is_active: true,
  start_date: new Date().toISOString().slice(0, 10),
  end_date: "",
  change_reason: "",
};

export default function AllowanceRuleDialog({ open, onClose, onSaved, ruleId, ar }: Props) {
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

  const currentCalc = CALCULATION_TYPES.find(c => c.value === form.calculation_type) || CALCULATION_TYPES[0];

  const loadLookups = useCallback(async () => {
    try {
      const [brRes, depRes, empRes] = await Promise.all([
        fetch("/api/branches", { headers: { Authorization: authH } }),
        fetch("/api/departments", { headers: { Authorization: authH } }),
        fetch("/api/employees/list", { headers: { Authorization: authH } }),
      ]);
      setBranches((await brRes.json()).results || (await brRes.json()).branches || []);
      setDepartments((await depRes.json()).results || (await depRes.json()).departments || []);
      setEmployees((await empRes.json()).results || (await empRes.json()).employees || []);
    } catch {}
  }, [authH]);

  const loadRule = useCallback(async () => {
    if (!ruleId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/hr/policies/rules-allowance/${ruleId}`, { headers: { Authorization: authH } });
      const data = await res.json();
      const r = data.rule || data;
      if (!r?.id) { toast.error(ar ? "فشل التحميل" : "Load failed"); return; }
      setForm({
        name: r.name,
        allowance_type: r.allowance_type,
        calculation_type: r.calculation_type,
        fixed_amount: Number(r.fixed_amount) || 0,
        tiers: r.tiers && r.tiers.length > 0 ? r.tiers : [{ from: 1, to: 10, value: 500 }],
        min_work_hours_per_day: Number(r.min_work_hours_per_day) || 0,
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
    setForm({ ...form, tiers: [...form.tiers, { from: newFrom, to: newFrom + 9, value: 750 }] });
  };

  const removeTier = (index: number) => {
    if (form.tiers.length === 1) { toast.error(ar ? "لازم شريحة واحدة" : "One tier required"); return; }
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
    if (form.scope === "branch" && !form.branch_id) { toast.error(ar ? "اختر الفرع" : "Select branch"); return; }
    if (form.scope === "department" && !form.department_id) { toast.error(ar ? "اختر الإدارة" : "Select dept"); return; }
    if (form.scope === "employees" && form.specific_employees.length === 0) { toast.error(ar ? "اختر موظف" : "Select employees"); return; }

    setSaving(true);
    try {
      const url = isEdit ? `/api/hr/policies/rules-allowance/${ruleId}` : "/api/hr/policies/rules-allowance";
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
        toast.error(data.error || (ar ? "فشل" : "Failed"));
      }
    } catch {
      toast.error(ar ? "خطأ" : "Error");
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto" dir={ar ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-600" />
            {isEdit ? (ar ? "تعديل قاعدة بدل" : "Edit Allowance Rule") : (ar ? "إنشاء قاعدة بدل" : "Create Allowance Rule")}
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
                  <p className="font-semibold">{ar ? `النسخة ${versionInfo.version}` : `v${versionInfo.version}`}</p>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-semibold block mb-1">{ar ? "اسم القاعدة *" : "Rule Name *"}</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>

            {/* نوع البدل */}
            <div>
              <label className="text-sm font-semibold block mb-2">{ar ? "نوع البدل *" : "Allowance Type *"}</label>
              <select className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                value={form.allowance_type} disabled={isEdit}
                onChange={(e) => setForm({ ...form, allowance_type: e.target.value })}>
                {ALLOWANCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label_ar}</option>)}
              </select>
            </div>

            {/* طريقة الحساب */}
            <div className="p-4 rounded-lg bg-amber-50 border-2 border-amber-200">
              <label className="text-sm font-semibold block mb-2">{ar ? "طريقة الحساب *" : "Calculation Method *"}</label>
              <select className="w-full px-3 py-2 border rounded-md bg-white text-sm mb-2"
                value={form.calculation_type}
                onChange={(e) => setForm({ ...form, calculation_type: e.target.value })}>
                {CALCULATION_TYPES.map(c => <option key={c.value} value={c.value}>{c.label_ar}</option>)}
              </select>
              <p className="text-xs text-muted-foreground">💡 {currentCalc.hint}</p>

              {/* لو المبلغ ثابت */}
              {form.calculation_type !== "tiered" && (
                <div className="mt-3">
                  <label className="text-xs text-muted-foreground mb-1 block">
                    {form.calculation_type === "fixed_monthly" ? (ar ? "المبلغ الشهري (EGP)" : "Monthly (EGP)") :
                     form.calculation_type === "per_day" ? (ar ? "المبلغ لكل يوم (EGP)" : "Per day") :
                     form.calculation_type === "per_visit" ? (ar ? "المبلغ لكل زيارة (EGP)" : "Per visit") :
                     (ar ? "المبلغ لكل كيلو (EGP)" : "Per KM")}
                  </label>
                  <Input type="number" step="0.01" value={form.fixed_amount}
                    onChange={(e) => setForm({ ...form, fixed_amount: Number(e.target.value) || 0 })} />
                </div>
              )}

              {/* لو Tiered */}
              {form.calculation_type === "tiered" && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-sm">{ar ? "الشرائح" : "Tiers"}</p>
                    <Button type="button" size="sm" variant="outline" onClick={addTier} className="gap-1.5">
                      <Plus className="w-3.5 h-3.5" />{ar ? "أضف" : "Add"}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {form.tiers.map((tier, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-lg border border-amber-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-amber-700">{ar ? `شريحة ${idx + 1}` : `Tier ${idx + 1}`}</span>
                          <Button type="button" size="sm" variant="ghost" onClick={() => removeTier(idx)} className="h-7 w-7 p-0 text-red-600">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">{ar ? "من" : "From"}</label>
                            <Input type="number" value={tier.from}
                              onChange={(e) => updateTier(idx, "from", Number(e.target.value) || 0)} />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">{ar ? "إلى" : "To"}</label>
                            <Input type="number" value={tier.to || ""}
                              placeholder={ar ? "بدون حد" : "No limit"}
                              onChange={(e) => updateTier(idx, "to", e.target.value ? Number(e.target.value) : null)} />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">{ar ? "المبلغ (EGP)" : "Amount"}</label>
                            <Input type="number" step="0.01" value={tier.value}
                              onChange={(e) => updateTier(idx, "value", Number(e.target.value) || 0)} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* شروط الاستحقاق */}
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <label className="text-sm font-semibold block mb-1">{ar ? "شروط الاستحقاق" : "Eligibility"}</label>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  {ar ? "أقل ساعات عمل يومياً للاستحقاق (0 = بدون شرط)" : "Min work hours/day (0 = none)"}
                </label>
                <Input type="number" value={form.min_work_hours_per_day}
                  onChange={(e) => setForm({ ...form, min_work_hours_per_day: Number(e.target.value) || 0 })} />
              </div>
            </div>

            {/* النطاق */}
            <div>
              <label className="text-sm font-semibold block mb-2">{ar ? "نطاق التطبيق *" : "Scope *"}</label>
              <select className="w-full px-3 py-2 border rounded-md bg-white text-sm mb-2"
                value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })}>
                <option value="company">{ar ? "الشركة كلها" : "Whole Company"}</option>
                <option value="branch">{ar ? "فرع محدد" : "Branch"}</option>
                <option value="department">{ar ? "إدارة محددة" : "Department"}</option>
                <option value="employees">{ar ? "موظفين محددين" : "Employees"}</option>
              </select>
              {form.scope === "branch" && (
                <select className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                  value={form.branch_id || ""} onChange={(e) => setForm({ ...form, branch_id: Number(e.target.value) || null })}>
                  <option value="">{ar ? "-- اختر --" : "--"}</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name_ar || b.name}</option>)}
                </select>
              )}
              {form.scope === "department" && (
                <select className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                  value={form.department_id || ""} onChange={(e) => setForm({ ...form, department_id: Number(e.target.value) || null })}>
                  <option value="">{ar ? "-- اختر --" : "--"}</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name_ar || d.name}</option>)}
                </select>
              )}
              {form.scope === "employees" && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">{ar ? `المختارين: ${form.specific_employees.length}` : `Selected: ${form.specific_employees.length}`}</p>
                  <Input placeholder="🔍" value={empSearch} onChange={(e) => setEmpSearch(e.target.value)} className="mb-2" />
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                    {filteredEmployees.map(e => (
                      <label key={e.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                        <input type="checkbox" checked={form.specific_employees.includes(e.id)} onChange={() => toggleEmployee(e.id)} />
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
                <label className="text-sm font-semibold block mb-1">{ar ? "من *" : "Start *"}</label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1">{ar ? "إلى" : "End"}</label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              {ar ? "نشط" : "Active"}
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
              <Button onClick={handleSave} disabled={saving} className="gap-2 bg-amber-600 hover:bg-amber-700">
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
