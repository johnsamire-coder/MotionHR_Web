"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Award, Save, Loader2, Info, Clock, Moon, Calendar } from "lucide-react";
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
  name: "قواعد المكافآت الافتراضية",
  // الأوفرتايم
  overtime_rate_per_hour: 50,
  overtime_multiplier_regular: 1.5,
  overtime_multiplier_weekend: 2.0,
  overtime_multiplier_holiday: 2.5,
  overtime_max_hours_per_day: 4,
  overtime_max_hours_per_month: 60,
  overtime_requires_approval: true,
  // الشيفت الليلي
  night_shift_bonus_per_hour: 0,
  night_shift_start_hour: 22,
  night_shift_end_hour: 6,
  // العطلات
  weekend_bonus_per_day: 0,
  holiday_bonus_per_day: 0,
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

export default function BonusRuleDialog({ open, onClose, onSaved, ruleId, ar }: Props) {
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
      const res = await fetch(`/api/hr/policies/bonus-rules/${ruleId}`, { headers: { Authorization: authH } });
      const data = await res.json();
      const r = data.rule || data;
      if (!r?.id) { toast.error(ar ? "فشل التحميل" : "Load failed"); return; }
      setForm({
        name: r.name,
        overtime_rate_per_hour: Number(r.overtime_rate_per_hour) || 0,
        overtime_multiplier_regular: Number(r.overtime_multiplier_regular) || 1.5,
        overtime_multiplier_weekend: Number(r.overtime_multiplier_weekend) || 2.0,
        overtime_multiplier_holiday: Number(r.overtime_multiplier_holiday) || 2.5,
        overtime_max_hours_per_day: Number(r.overtime_max_hours_per_day) || 4,
        overtime_max_hours_per_month: Number(r.overtime_max_hours_per_month) || 60,
        overtime_requires_approval: r.overtime_requires_approval,
        night_shift_bonus_per_hour: Number(r.night_shift_bonus_per_hour) || 0,
        night_shift_start_hour: Number(r.night_shift_start_hour) || 22,
        night_shift_end_hour: Number(r.night_shift_end_hour) || 6,
        weekend_bonus_per_day: Number(r.weekend_bonus_per_day) || 0,
        holiday_bonus_per_day: Number(r.holiday_bonus_per_day) || 0,
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
      const url = isEdit ? `/api/hr/policies/bonus-rules/${ruleId}` : "/api/hr/policies/bonus-rules";
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
            <Award className="w-5 h-5 text-brand-primary" />
            {isEdit ? (ar ? "تعديل قاعدة مكافآت" : "Edit Bonus Rule") : (ar ? "إنشاء قاعدة مكافآت" : "Create Bonus Rule")}
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
                      {ar ? "أي تعديل جوهري ينشئ نسخة جديدة تبدأ من أول الشهر التالي." : "Any core edit creates a new version."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-semibold block mb-1">{ar ? "اسم القاعدة *" : "Rule Name *"}</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>

            {/* الأوفرتايم */}
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-emerald-700" />
                <p className="font-semibold text-sm">{ar ? "الأوفرتايم (Overtime)" : "Overtime"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "قيمة الساعة (EGP)" : "Per hour (EGP)"}</label>
                  <Input type="number" step="0.01" value={form.overtime_rate_per_hour}
                    onChange={(e) => setForm({ ...form, overtime_rate_per_hour: Number(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "معامل عادي" : "Regular multiplier"}</label>
                  <Input type="number" step="0.1" value={form.overtime_multiplier_regular}
                    onChange={(e) => setForm({ ...form, overtime_multiplier_regular: Number(e.target.value) || 1.5 })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "معامل الويكند" : "Weekend multiplier"}</label>
                  <Input type="number" step="0.1" value={form.overtime_multiplier_weekend}
                    onChange={(e) => setForm({ ...form, overtime_multiplier_weekend: Number(e.target.value) || 2 })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "معامل الأعياد" : "Holiday multiplier"}</label>
                  <Input type="number" step="0.1" value={form.overtime_multiplier_holiday}
                    onChange={(e) => setForm({ ...form, overtime_multiplier_holiday: Number(e.target.value) || 2.5 })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "أقصى ساعات/يوم" : "Max hours/day"}</label>
                  <Input type="number" value={form.overtime_max_hours_per_day}
                    onChange={(e) => setForm({ ...form, overtime_max_hours_per_day: Number(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "أقصى ساعات/شهر" : "Max hours/month"}</label>
                  <Input type="number" value={form.overtime_max_hours_per_month}
                    onChange={(e) => setForm({ ...form, overtime_max_hours_per_month: Number(e.target.value) || 0 })} />
                </div>
              </div>
              <label className="flex items-center gap-2 mt-3 text-sm cursor-pointer">
                <input type="checkbox" checked={form.overtime_requires_approval}
                  onChange={(e) => setForm({ ...form, overtime_requires_approval: e.target.checked })} />
                {ar ? "يحتاج موافقة مسبقة" : "Requires prior approval"}
              </label>
            </div>

            {/* الشيفت الليلي */}
            <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200">
              <div className="flex items-center gap-2 mb-3">
                <Moon className="w-4 h-4 text-indigo-700" />
                <p className="font-semibold text-sm">{ar ? "بدل الشيفت الليلي" : "Night Shift Bonus"}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "بدل/ساعة (EGP)" : "Per hour (EGP)"}</label>
                  <Input type="number" step="0.01" value={form.night_shift_bonus_per_hour}
                    onChange={(e) => setForm({ ...form, night_shift_bonus_per_hour: Number(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "بداية الشيفت (0-23)" : "Start hour (0-23)"}</label>
                  <Input type="number" min="0" max="23" value={form.night_shift_start_hour}
                    onChange={(e) => setForm({ ...form, night_shift_start_hour: Number(e.target.value) || 22 })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "نهاية الشيفت (0-23)" : "End hour (0-23)"}</label>
                  <Input type="number" min="0" max="23" value={form.night_shift_end_hour}
                    onChange={(e) => setForm({ ...form, night_shift_end_hour: Number(e.target.value) || 6 })} />
                </div>
              </div>
            </div>

            {/* العطلات */}
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-amber-700" />
                <p className="font-semibold text-sm">{ar ? "بدل العطلات والأعياد" : "Weekend & Holiday Bonus"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "بدل يوم الويكند" : "Weekend/day (EGP)"}</label>
                  <Input type="number" step="0.01" value={form.weekend_bonus_per_day}
                    onChange={(e) => setForm({ ...form, weekend_bonus_per_day: Number(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "بدل العيد الرسمي" : "Holiday/day (EGP)"}</label>
                  <Input type="number" step="0.01" value={form.holiday_bonus_per_day}
                    onChange={(e) => setForm({ ...form, holiday_bonus_per_day: Number(e.target.value) || 0 })} />
                </div>
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
              <Button onClick={handleSave} disabled={saving} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
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
