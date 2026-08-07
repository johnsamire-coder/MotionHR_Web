"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Calendar, Save, Loader2, Info, Clock, DollarSign, Bell, CheckCircle2 } from "lucide-react";
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

const emptyForm = {
  cycle_type: "calendar_month",
  cutoff_day: 25,
  pay_day: 5,
  weekly_pay_day: "sunday",
  holiday_handling: "before",
  default_currency: "EGP",
  proration_method: "30_days",
  working_days_per_month: 22,
  new_employee_handling: "prorated",
  payslip_notify_days_before: 2,
  auto_generate_payroll: true,
  payroll_ref_prefix: "PR",
  approval_level: "hr_only",
  require_approval_before_pay: true,
  first_approver_role: "hr_manager",
  second_approver_role: "",
  third_approver_role: "",
  is_active: true,
  start_date: new Date().toISOString().slice(0, 10),
  end_date: "",
  change_reason: "",
};

export default function PayrollCyclePolicyDialog({ open, onClose, onSaved, policyId, ar }: Props) {
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [versionInfo, setVersionInfo] = useState<{ version: number; isSuperseded: boolean; hasNext: boolean } | null>(null);

  const isEdit = !!policyId;
  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;

  const loadPolicy = useCallback(async () => {
    if (!policyId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/hr/policies/payroll-cycle-policies/${policyId}`, {
        headers: { Authorization: authH },
      });
      const data = await res.json();
      const p = data.policy || data;
      if (!p?.id) { toast.error(ar ? "فشل التحميل" : "Load failed"); return; }
      setForm({
        cycle_type: p.cycle_type,
        cutoff_day: p.cutoff_day,
        pay_day: p.pay_day,
        weekly_pay_day: p.weekly_pay_day,
        holiday_handling: p.holiday_handling,
        default_currency: p.default_currency,
        proration_method: p.proration_method,
        working_days_per_month: p.working_days_per_month,
        new_employee_handling: p.new_employee_handling,
        payslip_notify_days_before: p.payslip_notify_days_before,
        auto_generate_payroll: p.auto_generate_payroll,
        payroll_ref_prefix: p.payroll_ref_prefix,
        approval_level: p.approval_level,
        require_approval_before_pay: p.require_approval_before_pay,
        first_approver_role: p.first_approver_role || "hr_manager",
        second_approver_role: p.second_approver_role || "",
        third_approver_role: p.third_approver_role || "",
        is_active: p.is_active,
        start_date: p.start_date,
        end_date: p.end_date || "",
        change_reason: "",
      });
      setVersionInfo({ version: p.version_number, isSuperseded: p.is_superseded, hasNext: p.has_next_versions });
    } finally { setLoading(false); }
  }, [policyId, authH, ar]);

  useEffect(() => {
    if (open) {
      if (policyId) loadPolicy();
      else { setForm({ ...emptyForm }); setVersionInfo(null); }
    }
  }, [open, policyId, loadPolicy]);

  const handleSave = async () => {
    if (!form.start_date) { toast.error(ar ? "تاريخ البدء مطلوب" : "Start date required"); return; }
    setSaving(true);
    try {
      const url = isEdit ? `/api/hr/policies/payroll-cycle-policies/${policyId}` : "/api/hr/policies/payroll-cycle-policies";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { Authorization: authH, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        if (isEdit && data.edit_mode === "new_version") {
          toast.success(ar ? `تم إنشاء النسخة رقم ${data.new_policy?.version_number}` : `Version ${data.new_policy?.version_number} created`);
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
            <Calendar className="w-5 h-5 text-brand-primary" />
            {isEdit ? (ar ? "تعديل سياسة دورة الرواتب" : "Edit Payroll Cycle Policy") : (ar ? "إنشاء سياسة دورة الرواتب" : "Create Payroll Cycle Policy")}
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

            {/* ═══ نوع الدورة ═══ */}
            <div className="p-4 rounded-lg bg-slate-50 border">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-slate-600" />
                <p className="font-semibold text-sm">{ar ? "نوع الدورة" : "Cycle Type"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "النوع" : "Type"}</label>
                  <select className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                    value={form.cycle_type}
                    onChange={(e) => setForm({ ...form, cycle_type: e.target.value })}>
                    <option value="calendar_month">{ar ? "شهر ميلادي (1 → آخر يوم)" : "Calendar Month"}</option>
                    <option value="custom_month">{ar ? "شهر مخصص" : "Custom Month"}</option>
                    <option value="weekly">{ar ? "أسبوعي" : "Weekly"}</option>
                    <option value="bi_weekly">{ar ? "كل أسبوعين" : "Bi-Weekly"}</option>
                  </select>
                </div>
                {form.cycle_type === "custom_month" && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{ar ? "يوم قفل الشهر" : "Cutoff Day"}</label>
                    <Input type="number" min="1" max="31" value={form.cutoff_day}
                      onChange={(e) => setForm({ ...form, cutoff_day: Number(e.target.value) || 25 })} />
                  </div>
                )}
              </div>
            </div>

            {/* ═══ يوم الصرف ═══ */}
            <div className="p-4 rounded-lg bg-slate-50 border">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-slate-600" />
                <p className="font-semibold text-sm">{ar ? "يوم صرف المرتبات" : "Pay Day"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(form.cycle_type === "calendar_month" || form.cycle_type === "custom_month") ? (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{ar ? "يوم الصرف في الشهر" : "Pay Day"}</label>
                    <Input type="number" min="1" max="31" value={form.pay_day}
                      onChange={(e) => setForm({ ...form, pay_day: Number(e.target.value) || 5 })} />
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{ar ? "يوم الصرف الأسبوعي" : "Pay Day"}</label>
                    <select className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                      value={form.weekly_pay_day}
                      onChange={(e) => setForm({ ...form, weekly_pay_day: e.target.value })}>
                      <option value="sunday">{ar ? "الأحد" : "Sunday"}</option>
                      <option value="monday">{ar ? "الاثنين" : "Monday"}</option>
                      <option value="tuesday">{ar ? "الثلاثاء" : "Tuesday"}</option>
                      <option value="wednesday">{ar ? "الأربعاء" : "Wednesday"}</option>
                      <option value="thursday">{ar ? "الخميس" : "Thursday"}</option>
                      <option value="friday">{ar ? "الجمعة" : "Friday"}</option>
                      <option value="saturday">{ar ? "السبت" : "Saturday"}</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "لو الصرف يوم عطلة" : "If Pay Day is Holiday"}</label>
                  <select className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                    value={form.holiday_handling}
                    onChange={(e) => setForm({ ...form, holiday_handling: e.target.value })}>
                    <option value="before">{ar ? "الصرف اليوم اللي قبله" : "Pay Before"}</option>
                    <option value="after">{ar ? "الصرف اليوم اللي بعده" : "Pay After"}</option>
                    <option value="same">{ar ? "نفس اليوم" : "Same Day"}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ═══ العملة ═══ */}
            <div className="p-4 rounded-lg bg-slate-50 border">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-slate-600" />
                <p className="font-semibold text-sm">{ar ? "العملة" : "Currency"}</p>
              </div>
              <select className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                value={form.default_currency}
                onChange={(e) => setForm({ ...form, default_currency: e.target.value })}>
                <option value="EGP">{ar ? "جنيه مصري (EGP)" : "Egyptian Pound (EGP)"}</option>
                <option value="USD">{ar ? "دولار أمريكي (USD)" : "US Dollar (USD)"}</option>
                <option value="EUR">{ar ? "يورو (EUR)" : "Euro (EUR)"}</option>
                <option value="SAR">{ar ? "ريال سعودي (SAR)" : "Saudi Riyal (SAR)"}</option>
                <option value="AED">{ar ? "درهم إماراتي (AED)" : "UAE Dirham (AED)"}</option>
              </select>
            </div>

            {/* ═══ طريقة الحساب ═══ */}
            <div className="p-4 rounded-lg bg-slate-50 border">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-slate-600" />
                <p className="font-semibold text-sm">{ar ? "طريقة النسبة والتناسب" : "Proration Method"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                  value={form.proration_method}
                  onChange={(e) => setForm({ ...form, proration_method: e.target.value })}>
                  <option value="30_days">{ar ? "30 يوم دائماً" : "30 Days Always"}</option>
                  <option value="actual_days">{ar ? "أيام الشهر الفعلية" : "Actual Days"}</option>
                  <option value="working_days">{ar ? "أيام العمل فقط" : "Working Days"}</option>
                </select>
                {form.proration_method === "working_days" && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{ar ? "أيام العمل الشهرية" : "Working Days/Month"}</label>
                    <Input type="number" min="1" max="31" value={form.working_days_per_month}
                      onChange={(e) => setForm({ ...form, working_days_per_month: Number(e.target.value) || 22 })} />
                  </div>
                )}
              </div>
            </div>

            {/* ═══ الموظف الجديد ═══ */}
            <div className="p-4 rounded-lg bg-slate-50 border">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-slate-600" />
                <p className="font-semibold text-sm">{ar ? "معالجة الموظف الجديد" : "New Employee Handling"}</p>
              </div>
              <select className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                value={form.new_employee_handling}
                onChange={(e) => setForm({ ...form, new_employee_handling: e.target.value })}>
                <option value="full">{ar ? "مرتب كامل من أول يوم" : "Full Salary"}</option>
                <option value="prorated">{ar ? "بالنسبة والتناسب" : "Prorated"}</option>
                <option value="next_cycle">{ar ? "يبدأ من الدورة الجاية" : "Next Cycle"}</option>
              </select>
            </div>

            {/* ═══ الإشعارات ═══ */}
            <div className="p-4 rounded-lg bg-slate-50 border">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="w-4 h-4 text-slate-600" />
                <p className="font-semibold text-sm">{ar ? "الإشعارات" : "Notifications"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "إشعار قبل الصرف بكام يوم" : "Notify Days Before"}</label>
                  <Input type="number" min="0" max="30" value={form.payslip_notify_days_before}
                    onChange={(e) => setForm({ ...form, payslip_notify_days_before: Number(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "بادئة الرقم المسلسل" : "Ref Prefix"}</label>
                  <Input value={form.payroll_ref_prefix} placeholder="PR"
                    onChange={(e) => setForm({ ...form, payroll_ref_prefix: e.target.value })} />
                </div>
              </div>
              <label className="flex items-center gap-2 mt-3 text-sm cursor-pointer">
                <input type="checkbox" checked={form.auto_generate_payroll}
                  onChange={(e) => setForm({ ...form, auto_generate_payroll: e.target.checked })} />
                {ar ? "توليد Payroll تلقائي يوم القفل" : "Auto-generate payroll on cutoff"}
              </label>
            </div>

            {/* ═══ الموافقات ═══ */}
            <div className="p-4 rounded-lg bg-slate-50 border">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-slate-600" />
                <p className="font-semibold text-sm">{ar ? "الموافقات" : "Approvals"}</p>
              </div>
              <select className="w-full px-3 py-2 border rounded-md bg-white text-sm mb-3"
                value={form.approval_level}
                onChange={(e) => setForm({ ...form, approval_level: e.target.value })}>
                <option value="hr_only">{ar ? "HR فقط" : "HR Only"}</option>
                <option value="hr_plus_manager">{ar ? "HR + المدير العام" : "HR + Manager"}</option>
                <option value="hr_plus_finance_plus_ceo">{ar ? "HR + مالي + مدير عام" : "HR + Finance + CEO"}</option>
              </select>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.require_approval_before_pay}
                  onChange={(e) => setForm({ ...form, require_approval_before_pay: e.target.checked })} />
                {ar ? "الموافقة مطلوبة قبل الصرف" : "Require approval before pay"}
              </label>

              {/* ═══ من يعتمد كل مستوى ═══ */}
              <div className="mt-4 pt-4 border-t space-y-3">
                <p className="text-xs text-muted-foreground mb-2">
                  {ar
                    ? "حدد الأدوار المسؤولة عن اعتماد المرتبات (أي موظف بهذا الدور يقدر يعتمد)"
                    : "Specify the roles responsible for approving payroll (any employee with this role can approve)"}
                </p>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block font-semibold">
                    {ar ? "المعتمد الأول (HR)" : "First Approver (HR)"}
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                    value={form.first_approver_role}
                    onChange={(e) => setForm({ ...form, first_approver_role: e.target.value })}
                  >
                    <option value="hr_manager">{ar ? "مدير الموارد البشرية" : "HR Manager"}</option>
                    <option value="company_admin">{ar ? "صاحب الشركة" : "Company Admin"}</option>
                    <option value="manager">{ar ? "مدير" : "Manager"}</option>
                  </select>
                </div>

                {(form.approval_level === "hr_plus_manager" || form.approval_level === "hr_plus_finance_plus_ceo") && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block font-semibold">
                      {ar ? "المعتمد الثاني (المدير)" : "Second Approver (Manager)"}
                    </label>
                    <select
                      className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                      value={form.second_approver_role}
                      onChange={(e) => setForm({ ...form, second_approver_role: e.target.value })}
                    >
                      <option value="">{ar ? "-- اختر --" : "-- Select --"}</option>
                      <option value="manager">{ar ? "مدير عام" : "General Manager"}</option>
                      <option value="company_admin">{ar ? "صاحب الشركة" : "Company Admin"}</option>
                    </select>
                  </div>
                )}

                {form.approval_level === "hr_plus_finance_plus_ceo" && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block font-semibold">
                      {ar ? "المعتمد الثالث (المالي/CEO)" : "Third Approver (Finance/CEO)"}
                    </label>
                    <select
                      className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                      value={form.third_approver_role}
                      onChange={(e) => setForm({ ...form, third_approver_role: e.target.value })}
                    >
                      <option value="">{ar ? "-- اختر --" : "-- Select --"}</option>
                      <option value="company_admin">{ar ? "صاحب الشركة (CEO)" : "Company Admin (CEO)"}</option>
                      <option value="finance_manager">{ar ? "مدير مالي" : "Finance Manager"}</option>
                    </select>
                    <p className="text-[10px] text-amber-600 mt-1">
                      {ar
                        ? "⚠️ لو الدور 'مدير مالي' مش موجود، أنشئه من شاشة الأدوار أولاً"
                        : "⚠️ If 'Finance Manager' role doesn't exist, create it in the Roles screen first"}
                    </p>
                  </div>
                )}
              </div>
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

            {/* Active */}
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              {ar ? "السياسة نشطة" : "Policy is active"}
            </label>

            {/* Change reason (لو edit) */}
            {isEdit && (
              <div>
                <label className="text-sm font-semibold block mb-1">{ar ? "سبب التغيير" : "Change Reason"}</label>
                <textarea className="w-full px-3 py-2 border rounded-md text-sm min-h-[70px]"
                  value={form.change_reason}
                  onChange={(e) => setForm({ ...form, change_reason: e.target.value })}
                  placeholder={ar ? "مثال: تعديل يوم الصرف من 5 إلى 1" : "e.g. Change pay day from 5 to 1"} />
              </div>
            )}

            {/* Actions */}
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
