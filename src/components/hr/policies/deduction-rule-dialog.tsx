"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { TrendingDown, Save, Loader2, Info, Clock, Calendar, LogOut } from "lucide-react";
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
  name: "قواعد الحسم الافتراضية",
  // حسم التأخير
  late_deduction_per_minute: 1.0,
  late_grace_minutes: 5,
  late_max_per_day: 0,
  // حسم الغياب
  absence_deduction_per_day: 200,
  unauthorized_absence_multiplier: 1.0,
  // الخروج المبكر
  early_leave_per_minute: 0,
  early_leave_grace_minutes: 0,
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

export default function DeductionRuleDialog({ open, onClose, onSaved, ruleId, ar }: Props) {
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
      const brData = await brRes.json();
      const depData = await depRes.json();
      setBranches(brData.results || brData.branches || brData || []);
      setDepartments(depData.results || depData.departments || depData || []);
    } catch {}
  }, [authH]);

  const loadRule = useCallback(async () => {
    if (!ruleId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/hr/policies/deduction-rules/${ruleId}`, {
        headers: { Authorization: authH },
      });
      const data = await res.json();
      const r = data.rule || data;
      if (!r?.id) { toast.error(ar ? "فشل التحميل" : "Load failed"); return; }
      setForm({
        name: r.name || "",
        late_deduction_per_minute: Number(r.late_deduction_per_minute) || 0,
        late_grace_minutes: Number(r.late_grace_minutes) || 0,
        late_max_per_day: Number(r.late_max_per_day) || 0,
        absence_deduction_per_day: Number(r.absence_deduction_per_day) || 0,
        unauthorized_absence_multiplier: Number(r.unauthorized_absence_multiplier) || 1,
        early_leave_per_minute: Number(r.early_leave_per_minute) || 0,
        early_leave_grace_minutes: Number(r.early_leave_grace_minutes) || 0,
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
    if (!form.start_date) { toast.error(ar ? "تاريخ البدء مطلوب" : "Start date required"); return; }
    if (form.scope === "branch" && !form.branch_id) { toast.error(ar ? "اختر الفرع" : "Select branch"); return; }
    if (form.scope === "department" && !form.department_id) { toast.error(ar ? "اختر الإدارة" : "Select department"); return; }

    setSaving(true);
    try {
      const url = isEdit ? `/api/hr/policies/deduction-rules/${ruleId}` : "/api/hr/policies/deduction-rules";
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
            <TrendingDown className="w-5 h-5 text-red-600" />
            {isEdit ? (ar ? "تعديل قاعدة حسم" : "Edit Deduction Rule") : (ar ? "إنشاء قاعدة حسم" : "Create Deduction Rule")}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5">
            {isEdit && versionInfo && (
              <div className={`p-3 rounded-lg border ${versionInfo.isSuperseded ? "bg-orange-50 border-orange-200" : "bg-blue-50 border-blue-200"}`}>
                <div className="flex items-start gap-2 text-sm">
                  <Info className={`w-4 h-4 mt-0.5 ${versionInfo.isSuperseded ? "text-orange-600" : "text-blue-600"}`} />
                  <div>
                    <p className="font-semibold">{ar ? `النسخة رقم ${versionInfo.version}` : `Version ${versionInfo.version}`}</p>
                    <p className="text-xs mt-1 text-muted-foreground">
                      {ar ? "أي تعديل جوهري ينشئ نسخة جديدة تبدأ من أول الشهر التالي." : "Any core edit creates a new version starting next month."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* الاسم */}
            <div>
              <label className="text-sm font-semibold block mb-1">{ar ? "اسم القاعدة *" : "Rule Name *"}</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>

            {/* حسم التأخير */}
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-red-600" />
                <p className="font-semibold text-sm">{ar ? "حسم التأخير" : "Late Deduction"}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "الحسم/دقيقة (EGP)" : "Per minute (EGP)"}</label>
                  <Input type="number" step="0.01" value={form.late_deduction_per_minute}
                    onChange={(e) => setForm({ ...form, late_deduction_per_minute: Number(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "فترة السماح (دقيقة)" : "Grace (min)"}</label>
                  <Input type="number" value={form.late_grace_minutes}
                    onChange={(e) => setForm({ ...form, late_grace_minutes: Number(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "الحد الأقصى/يوم" : "Max/day"}</label>
                  <Input type="number" step="0.01" value={form.late_max_per_day}
                    onChange={(e) => setForm({ ...form, late_max_per_day: Number(e.target.value) || 0 })} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {ar ? "الحد الأقصى = 0 يعني بدون حد" : "Max = 0 means no limit"}
              </p>
            </div>

            {/* حسم الغياب */}
            <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-orange-600" />
                <p className="font-semibold text-sm">{ar ? "حسم الغياب" : "Absence Deduction"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "الحسم/يوم (EGP)" : "Per day (EGP)"}</label>
                  <Input type="number" step="0.01" value={form.absence_deduction_per_day}
                    onChange={(e) => setForm({ ...form, absence_deduction_per_day: Number(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "معامل الغياب بدون إذن" : "Unauthorized multiplier"}</label>
                  <Input type="number" step="0.1" value={form.unauthorized_absence_multiplier}
                    onChange={(e) => setForm({ ...form, unauthorized_absence_multiplier: Number(e.target.value) || 1 })} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {ar ? "مثال: 2 = خصم مضاعف على الغياب بدون إذن مسبق" : "Example: 2 = double deduction for unauthorized absence"}
              </p>
            </div>

            {/* الخروج المبكر */}
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="flex items-center gap-2 mb-3">
                <LogOut className="w-4 h-4 text-yellow-700" />
                <p className="font-semibold text-sm">{ar ? "حسم الخروج المبكر" : "Early Leave Deduction"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "الحسم/دقيقة (EGP)" : "Per minute (EGP)"}</label>
                  <Input type="number" step="0.01" value={form.early_leave_per_minute}
                    onChange={(e) => setForm({ ...form, early_leave_per_minute: Number(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "فترة السماح (دقيقة)" : "Grace (min)"}</label>
                  <Input type="number" value={form.early_leave_grace_minutes}
                    onChange={(e) => setForm({ ...form, early_leave_grace_minutes: Number(e.target.value) || 0 })} />
                </div>
              </div>
            </div>

            {/* النطاق */}
            <div>
              <label className="text-sm font-semibold block mb-2">{ar ? "نطاق التطبيق *" : "Scope *"}</label>
              <select className="w-full px-3 py-2 border rounded-md bg-white text-sm mb-2"
                value={form.scope}
                onChange={(e) => setForm({ ...form, scope: e.target.value })}>
                <option value="company">{ar ? "الشركة كلها" : "Whole Company"}</option>
                <option value="branch">{ar ? "فرع محدد" : "Specific Branch"}</option>
                <option value="department">{ar ? "إدارة محددة" : "Specific Department"}</option>
              </select>

              {form.scope === "branch" && (
                <select className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                  value={form.branch_id || ""}
                  onChange={(e) => setForm({ ...form, branch_id: Number(e.target.value) || null })}>
                  <option value="">{ar ? "-- اختر الفرع --" : "-- Select branch --"}</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name_ar || b.name}</option>)}
                </select>
              )}

              {form.scope === "department" && (
                <select className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                  value={form.department_id || ""}
                  onChange={(e) => setForm({ ...form, department_id: Number(e.target.value) || null })}>
                  <option value="">{ar ? "-- اختر الإدارة --" : "-- Select department --"}</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name_ar || d.name}</option>)}
                </select>
              )}
            </div>

            {/* التواريخ */}
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

            {/* Active */}
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              {ar ? "القاعدة نشطة" : "Rule is active"}
            </label>

            {isEdit && (
              <div>
                <label className="text-sm font-semibold block mb-1">{ar ? "سبب التغيير" : "Change Reason"}</label>
                <textarea className="w-full px-3 py-2 border rounded-md text-sm min-h-[70px]"
                  value={form.change_reason}
                  onChange={(e) => setForm({ ...form, change_reason: e.target.value })}
                  placeholder={ar ? "مثال: تعديل نسبة حسم التأخير" : "e.g. Change late deduction rate"} />
              </div>
            )}

            <div className="flex gap-2 justify-end pt-3 border-t">
              <Button variant="outline" onClick={onClose} disabled={saving}>{ar ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2 bg-red-600 hover:bg-red-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isEdit ? (ar ? "حفظ التعديلات" : "Save") : (ar ? "إنشاء القاعدة" : "Create")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
