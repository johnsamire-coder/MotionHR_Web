"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Calendar, Save, Loader2, Plus, Trash2, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  holidayId: number | null;
  ar: boolean;
}

interface Rule {
  scope: string;
  treatment: string;
  bonus_calc_method: string;
  bonus_fixed_amount: number;
  bonus_salary_percentage: number;
  bonus_day_multiplier: number;
}

const TREATMENTS = [
  { value: "paid_leave",    label_ar: "إجازة مدفوعة",        label_en: "Paid Leave" },
  { value: "work_with_bonus", label_ar: "عمل بمقابل إضافي", label_en: "Work with Bonus" },
  { value: "normal_work",   label_ar: "يوم عمل عادي",        label_en: "Normal Work" },
];

const BONUS_METHODS = [
  { value: "fixed_amount",       label_ar: "مبلغ ثابت",           label_en: "Fixed Amount" },
  { value: "salary_percentage",  label_ar: "نسبة من الراتب",      label_en: "Salary %" },
  { value: "day_multiplier",     label_ar: "مضاعف أجر اليوم",    label_en: "Day Multiplier" },
];

const emptyRule: Rule = {
  scope: "company",
  treatment: "paid_leave",
  bonus_calc_method: "",
  bonus_fixed_amount: 0,
  bonus_salary_percentage: 0,
  bonus_day_multiplier: 2.0,
};

export default function OfficialHolidayDialog({ open, onClose, onSaved, holidayId, ar }: Props) {
  const [name, setName]                       = useState("");
  const [startDate, setStartDate]             = useState("");
  const [endDate, setEndDate]                 = useState("");
  const [notes, setNotes]                     = useState("");
  const [sendNotification, setSendNotification] = useState(true);
  const [remindDayBefore, setRemindDayBefore] = useState(false);
  const [rules, setRules]                     = useState<Rule[]>([{ ...emptyRule }]);
  const [saving, setSaving]                   = useState(false);
  const [loading, setLoading]                 = useState(false);

  const isEdit = !!holidayId;
  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;

  useEffect(() => {
    if (!open) return;
    if (holidayId) {
      setLoading(true);
      fetch(`/api/hr/policies/official-holidays/${holidayId}`, {
        headers: { Authorization: authH },
      })
        .then((r) => r.json())
        .then((data) => {
          const h = data.holiday || data;
          setName(h.name || "");
          setStartDate(h.start_date || "");
          setEndDate(h.end_date || "");
          setNotes(h.notes || "");
          setSendNotification(h.send_notification ?? true);
          setRemindDayBefore(h.remind_day_before ?? false);
          setRules(
            h.rules?.length
              ? h.rules.map((r: any) => ({
                  scope: r.scope,
                  treatment: r.treatment,
                  bonus_calc_method: r.bonus_calc_method || "",
                  bonus_fixed_amount: r.bonus_fixed_amount || 0,
                  bonus_salary_percentage: r.bonus_salary_percentage || 0,
                  bonus_day_multiplier: r.bonus_day_multiplier || 2.0,
                }))
              : [{ ...emptyRule }]
          );
        })
        .catch(() => toast.error(ar ? "فشل التحميل" : "Load failed"))
        .finally(() => setLoading(false));
    } else {
      setName("");
      setStartDate("");
      setEndDate("");
      setNotes("");
      setSendNotification(true);
      setRemindDayBefore(false);
      setRules([{ ...emptyRule }]);
    }
  }, [open, holidayId]);

  const updateRule = (i: number, key: keyof Rule, value: any) => {
    setRules((prev) => prev.map((r, idx) => idx === i ? { ...r, [key]: value } : r));
  };

  const addRule = () => setRules((prev) => [...prev, { ...emptyRule }]);

  const removeRule = (i: number) => {
    if (rules.length === 1) {
      toast.error(ar ? "لازم قاعدة واحدة على الأقل" : "At least one rule required");
      return;
    }
    setRules((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error(ar ? "الاسم مطلوب" : "Name required"); return; }
    if (!startDate)   { toast.error(ar ? "تاريخ البدء مطلوب" : "Start date required"); return; }
    if (!endDate)     { toast.error(ar ? "تاريخ الانتهاء مطلوب" : "End date required"); return; }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        start_date: startDate,
        end_date: endDate,
        notes: notes.trim(),
        send_notification: sendNotification,
        remind_day_before: remindDayBefore,
        rules,
      };

      const url = isEdit
        ? `/api/hr/policies/official-holidays/${holidayId}`
        : "/api/hr/policies/official-holidays";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { Authorization: authH, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(ar ? "تم الحفظ" : "Saved");
        onSaved();
        onClose();
      } else {
        toast.error(data.error || (ar ? "فشل الحفظ" : "Save failed"));
      }
    } catch {
      toast.error(ar ? "خطأ في الاتصال" : "Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={ar ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            {isEdit
              ? (ar ? "تعديل عيد رسمي" : "Edit Official Holiday")
              : (ar ? "إضافة عيد رسمي" : "Add Official Holiday")}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5">

            {/* الاسم */}
            <div>
              <label className="text-sm font-semibold block mb-1">
                {ar ? "اسم العيد / الإجازة *" : "Holiday Name *"}
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={ar ? "مثال: عيد الأضحى" : "e.g. Eid Al-Adha"}
              />
            </div>

            {/* التواريخ */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold block mb-1">
                  {ar ? "من تاريخ *" : "Start Date *"}
                </label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1">
                  {ar ? "إلى تاريخ *" : "End Date *"}
                </label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            {/* الملاحظات */}
            <div>
              <label className="text-sm font-semibold block mb-1">
                {ar ? "ملاحظات" : "Notes"}
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded-md text-sm min-h-[70px]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={ar ? "أي تفاصيل إضافية..." : "Additional details..."}
              />
            </div>

            {/* الإشعارات */}
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-4 h-4 text-blue-600" />
                <p className="font-semibold text-sm text-blue-700">
                  {ar ? "الإشعارات" : "Notifications"}
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendNotification}
                  onChange={(e) => setSendNotification(e.target.checked)}
                />
                {ar ? "إرسال إشعار للموظفين" : "Send notification to employees"}
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={remindDayBefore}
                  onChange={(e) => setRemindDayBefore(e.target.checked)}
                />
                {ar ? "تذكير قبل اليوم" : "Remind day before"}
              </label>
            </div>

            {/* القواعد */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold">
                  {ar ? "قواعد المعاملة" : "Treatment Rules"}
                </p>
                <Button type="button" size="sm" variant="outline" onClick={addRule} className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  {ar ? "إضافة قاعدة" : "Add Rule"}
                </Button>
              </div>

              <div className="space-y-3">
                {rules.map((rule, idx) => (
                  <div key={idx} className="p-4 rounded-lg border-2 border-purple-100 bg-purple-50/30">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-purple-700">
                        {ar ? `القاعدة ${idx + 1}` : `Rule ${idx + 1}`}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeRule(idx)}
                        className="h-7 w-7 p-0 text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          {ar ? "النطاق" : "Scope"}
                        </label>
                        <select
                          className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                          value={rule.scope}
                          onChange={(e) => updateRule(idx, "scope", e.target.value)}
                        >
                          <option value="company">{ar ? "الشركة كلها" : "Whole Company"}</option>
                          <option value="branch">{ar ? "فرع محدد" : "Specific Branch"}</option>
                          <option value="department">{ar ? "قسم محدد" : "Specific Department"}</option>
                          <option value="employees">{ar ? "موظفين محددين" : "Specific Employees"}</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          {ar ? "نوع المعاملة" : "Treatment"}
                        </label>
                        <select
                          className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                          value={rule.treatment}
                          onChange={(e) => updateRule(idx, "treatment", e.target.value)}
                        >
                          {TREATMENTS.map((t) => (
                            <option key={t.value} value={t.value}>
                              {ar ? t.label_ar : t.label_en}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {rule.treatment === "work_with_bonus" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">
                            {ar ? "طريقة حساب المقابل" : "Bonus Calculation"}
                          </label>
                          <select
                            className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                            value={rule.bonus_calc_method}
                            onChange={(e) => updateRule(idx, "bonus_calc_method", e.target.value)}
                          >
                            <option value="">{ar ? "— اختر —" : "— Select —"}</option>
                            {BONUS_METHODS.map((m) => (
                              <option key={m.value} value={m.value}>
                                {ar ? m.label_ar : m.label_en}
                              </option>
                            ))}
                          </select>
                        </div>

                        {rule.bonus_calc_method === "fixed_amount" && (
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">
                              {ar ? "المبلغ الثابت (EGP)" : "Fixed Amount (EGP)"}
                            </label>
                            <Input
                              type="number"
                              step="0.01"
                              value={rule.bonus_fixed_amount}
                              onChange={(e) => updateRule(idx, "bonus_fixed_amount", Number(e.target.value))}
                            />
                          </div>
                        )}

                        {rule.bonus_calc_method === "salary_percentage" && (
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">
                              {ar ? "نسبة من الراتب (%)" : "Salary Percentage (%)"}
                            </label>
                            <Input
                              type="number"
                              step="0.1"
                              value={rule.bonus_salary_percentage}
                              onChange={(e) => updateRule(idx, "bonus_salary_percentage", Number(e.target.value))}
                            />
                          </div>
                        )}

                        {rule.bonus_calc_method === "day_multiplier" && (
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">
                              {ar ? "مضاعف أجر اليوم (×)" : "Day Multiplier (×)"}
                            </label>
                            <Input
                              type="number"
                              step="0.5"
                              value={rule.bonus_day_multiplier}
                              onChange={(e) => updateRule(idx, "bonus_day_multiplier", Number(e.target.value))}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 justify-end pt-3 border-t">
              <Button variant="outline" onClick={onClose} disabled={saving}>
                {ar ? "إلغاء" : "Cancel"}
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2 bg-purple-600 hover:bg-purple-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isEdit ? (ar ? "حفظ التعديلات" : "Save Changes") : (ar ? "إضافة" : "Add")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
