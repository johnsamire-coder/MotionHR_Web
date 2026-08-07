"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { DollarSign, Save, Loader2, Info, MapPin, Utensils, Car } from "lucide-react";
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

const emptyForm = {
  name: "قواعد البدلات الافتراضية",
  // بدل الميدان
  field_allowance_type: "none",
  fixed_field_allowance: 0,
  per_visit_allowance: 0,
  per_km_allowance: 0,
  // الوجبات
  meal_allowance_per_day: 0,
  meal_min_work_hours: 6,
  // المواصلات
  transport_allowance_type: "none",
  transport_allowance_per_day: 0,
  monthly_transport: 0,
  // النطاق
  scope: "company",
  branch_id: null as number | null,
  department_id: null as number | null,
  // Metadata
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
  const [versionInfo, setVersionInfo] = useState<{ version: number; isSuperseded: boolean } | null>(null);

  const isEdit = !!ruleId;
  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;

  const loadLookups = useCallback(async () => {
    try {
      const [brRes, depRes] = await Promise.all([
        fetch("/api/branches", { headers: { Authorization: authH } }),
        fetch("/api/departments", { headers: { Authorization: authH } }),
      ]);
      setBranches((await brRes.json()).results || (await brRes.json()).branches || []);
      setDepartments((await depRes.json()).results || (await depRes.json()).departments || []);
    } catch {}
  }, [authH]);

  const loadRule = useCallback(async () => {
    if (!ruleId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/hr/policies/allowance-rules/${ruleId}`, { headers: { Authorization: authH } });
      const data = await res.json();
      const r = data.rule || data;
      if (!r?.id) { toast.error(ar ? "فشل التحميل" : "Load failed"); return; }
      setForm({
        name: r.name,
        field_allowance_type: r.field_allowance_type,
        fixed_field_allowance: Number(r.fixed_field_allowance) || 0,
        per_visit_allowance: Number(r.per_visit_allowance) || 0,
        per_km_allowance: Number(r.per_km_allowance) || 0,
        meal_allowance_per_day: Number(r.meal_allowance_per_day) || 0,
        meal_min_work_hours: Number(r.meal_min_work_hours) || 6,
        transport_allowance_type: r.transport_allowance_type,
        transport_allowance_per_day: Number(r.transport_allowance_per_day) || 0,
        monthly_transport: Number(r.monthly_transport) || 0,
        scope: r.scope,
        branch_id: r.branch_id || null,
        department_id: r.department_id || null,
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
      else { setForm({ ...emptyForm }); setVersionInfo(null); }
    }
  }, [open, ruleId, loadLookups, loadRule]);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error(ar ? "الاسم مطلوب" : "Name required"); return; }
    if (form.scope === "branch" && !form.branch_id) { toast.error(ar ? "اختر الفرع" : "Select branch"); return; }
    if (form.scope === "department" && !form.department_id) { toast.error(ar ? "اختر الإدارة" : "Select department"); return; }

    setSaving(true);
    try {
      const url = isEdit ? `/api/hr/policies/allowance-rules/${ruleId}` : "/api/hr/policies/allowance-rules";
      const method = isEdit ? "PUT" : "POST";
      const payload = {
        ...form,
        branch_id: form.scope === "branch" ? form.branch_id : null,
        department_id: form.scope === "department" ? form.department_id : null,
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir={ar ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-600" />
            {isEdit ? (ar ? "تعديل قاعدة بدلات" : "Edit Allowance Rule") : (ar ? "إنشاء قاعدة بدلات" : "Create Allowance Rule")}
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
                      {ar ? "أي تعديل جوهري ينشئ نسخة جديدة." : "Any core edit creates new version."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-semibold block mb-1">{ar ? "اسم القاعدة *" : "Rule Name *"}</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>

            {/* بدل الميدان */}
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-blue-700" />
                <p className="font-semibold text-sm">{ar ? "بدل الميدان (للموظفين الميدانيين)" : "Field Allowance"}</p>
              </div>
              <select className="w-full px-3 py-2 border rounded-md bg-white text-sm mb-3"
                value={form.field_allowance_type}
                onChange={(e) => setForm({ ...form, field_allowance_type: e.target.value })}>
                <option value="none">{ar ? "بدون بدل" : "None"}</option>
                <option value="fixed">{ar ? "مبلغ ثابت شهري" : "Fixed monthly"}</option>
                <option value="per_visit">{ar ? "لكل زيارة" : "Per visit"}</option>
                <option value="per_km">{ar ? "لكل كيلومتر" : "Per KM"}</option>
              </select>
              {form.field_allowance_type === "fixed" && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "المبلغ الشهري (EGP)" : "Monthly amount"}</label>
                  <Input type="number" step="0.01" value={form.fixed_field_allowance}
                    onChange={(e) => setForm({ ...form, fixed_field_allowance: Number(e.target.value) || 0 })} />
                </div>
              )}
              {form.field_allowance_type === "per_visit" && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "المبلغ لكل زيارة" : "Per visit"}</label>
                  <Input type="number" step="0.01" value={form.per_visit_allowance}
                    onChange={(e) => setForm({ ...form, per_visit_allowance: Number(e.target.value) || 0 })} />
                </div>
              )}
              {form.field_allowance_type === "per_km" && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "المبلغ لكل كيلومتر" : "Per KM"}</label>
                  <Input type="number" step="0.01" value={form.per_km_allowance}
                    onChange={(e) => setForm({ ...form, per_km_allowance: Number(e.target.value) || 0 })} />
                </div>
              )}
            </div>

            {/* بدل الوجبات */}
            <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
              <div className="flex items-center gap-2 mb-3">
                <Utensils className="w-4 h-4 text-orange-700" />
                <p className="font-semibold text-sm">{ar ? "بدل الوجبات" : "Meal Allowance"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "قيمة الوجبة/يوم (EGP)" : "Per day"}</label>
                  <Input type="number" step="0.01" value={form.meal_allowance_per_day}
                    onChange={(e) => setForm({ ...form, meal_allowance_per_day: Number(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "أقل ساعات عمل للاستحقاق" : "Min hours"}</label>
                  <Input type="number" value={form.meal_min_work_hours}
                    onChange={(e) => setForm({ ...form, meal_min_work_hours: Number(e.target.value) || 6 })} />
                </div>
              </div>
            </div>

            {/* بدل المواصلات */}
            <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <Car className="w-4 h-4 text-purple-700" />
                <p className="font-semibold text-sm">{ar ? "بدل المواصلات" : "Transport Allowance"}</p>
              </div>
              <select className="w-full px-3 py-2 border rounded-md bg-white text-sm mb-3"
                value={form.transport_allowance_type}
                onChange={(e) => setForm({ ...form, transport_allowance_type: e.target.value })}>
                <option value="none">{ar ? "بدون بدل" : "None"}</option>
                <option value="per_day">{ar ? "لكل يوم عمل" : "Per work day"}</option>
                <option value="monthly">{ar ? "مبلغ شهري ثابت" : "Monthly fixed"}</option>
              </select>
              {form.transport_allowance_type === "per_day" && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "المبلغ اليومي (EGP)" : "Per day (EGP)"}</label>
                  <Input type="number" step="0.01" value={form.transport_allowance_per_day}
                    onChange={(e) => setForm({ ...form, transport_allowance_per_day: Number(e.target.value) || 0 })} />
                </div>
              )}
              {form.transport_allowance_type === "monthly" && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "المبلغ الشهري (EGP)" : "Monthly (EGP)"}</label>
                  <Input type="number" step="0.01" value={form.monthly_transport}
                    onChange={(e) => setForm({ ...form, monthly_transport: Number(e.target.value) || 0 })} />
                </div>
              )}
            </div>

            {/* النطاق */}
            <div>
              <label className="text-sm font-semibold block mb-2">{ar ? "نطاق التطبيق *" : "Scope *"}</label>
              <select className="w-full px-3 py-2 border rounded-md bg-white text-sm mb-2"
                value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })}>
                <option value="company">{ar ? "الشركة كلها" : "Whole Company"}</option>
                <option value="branch">{ar ? "فرع محدد" : "Branch"}</option>
                <option value="department">{ar ? "إدارة محددة" : "Department"}</option>
              </select>
              {form.scope === "branch" && (
                <select className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                  value={form.branch_id || ""} onChange={(e) => setForm({ ...form, branch_id: Number(e.target.value) || null })}>
                  <option value="">{ar ? "-- اختر --" : "-- Select --"}</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name_ar || b.name}</option>)}
                </select>
              )}
              {form.scope === "department" && (
                <select className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                  value={form.department_id || ""} onChange={(e) => setForm({ ...form, department_id: Number(e.target.value) || null })}>
                  <option value="">{ar ? "-- اختر --" : "-- Select --"}</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name_ar || d.name}</option>)}
                </select>
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

            <div className="flex gap-2 justify-end pt-3 border-t">
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
