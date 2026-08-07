"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Save, Loader2, TrendingDown, Award, DollarSign, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { STORAGE_KEYS } from "@/lib/constants/config";

export type EntryType = "penalty" | "bonus" | "allowance";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  entryType: EntryType;
  entryId: number | null;
  ar: boolean;
}

interface Employee {
  id: number;
  full_name?: string;
  first_name_ar?: string;
  last_name_ar?: string;
  employee_code?: string;
  department?: string;
}

const CATEGORIES: Record<EntryType, Array<{value: string; label_ar: string}>> = {
  penalty: [
    { value: "performance", label_ar: "قصور في الأداء" },
    { value: "discipline",  label_ar: "مخالفة سلوكية" },
    { value: "attendance",  label_ar: "مشكلة حضور" },
    { value: "safety",      label_ar: "مخالفة سلامة" },
    { value: "quality",     label_ar: "مشكلة جودة عمل" },
    { value: "other",       label_ar: "أخرى" },
  ],
  bonus: [
    { value: "performance",        label_ar: "أداء متميز" },
    { value: "goal_achievement",   label_ar: "تحقيق هدف" },
    { value: "project_completion", label_ar: "إتمام مشروع" },
    { value: "extra_effort",       label_ar: "مجهود إضافي" },
    { value: "loyalty",            label_ar: "ولاء وسنوات خدمة" },
    { value: "referral",           label_ar: "ترشيح موظف جديد" },
    { value: "other",              label_ar: "أخرى" },
  ],
  allowance: [
    { value: "travel",           label_ar: "بدل سفر" },
    { value: "field_visit",      label_ar: "بدل زيارة ميدانية" },
    { value: "overtime_meal",    label_ar: "بدل وجبة أوفرتايم" },
    { value: "special_project",  label_ar: "بدل مشروع خاص" },
    { value: "training",         label_ar: "بدل تدريب" },
    { value: "conference",       label_ar: "بدل مؤتمر/دورة" },
    { value: "other",            label_ar: "أخرى" },
  ],
};

const AMOUNT_TYPES = [
  { value: "fixed",         label_ar: "مبلغ ثابت (EGP)",   needs_value: true, suffix: "EGP" },
  { value: "quarter_day",   label_ar: "ربع يوم",             needs_value: false, suffix: "" },
  { value: "half_day",      label_ar: "نصف يوم",             needs_value: false, suffix: "" },
  { value: "full_day",      label_ar: "يوم كامل",            needs_value: false, suffix: "" },
  { value: "two_days",      label_ar: "يومين",               needs_value: false, suffix: "" },
  { value: "three_days",    label_ar: "3 أيام",              needs_value: false, suffix: "" },
  { value: "percent_basic", label_ar: "% من الراتب الأساسي", needs_value: true, suffix: "%" },
];

const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

const TYPE_CONFIG = {
  penalty:   { icon: TrendingDown, color: "red",     name_ar: "جزاء" },
  bonus:     { icon: Award,        color: "emerald", name_ar: "مكافأة" },
  allowance: { icon: DollarSign,   color: "amber",   name_ar: "بدل" },
};

export default function ManualEntryDialog({ open, onClose, onSaved, entryType, entryId, ar }: Props) {
  const config = TYPE_CONFIG[entryType];
  const Icon = config.icon;

  const today = new Date();
  const [form, setForm] = useState({
    employee_id: null as number | null,
    category: CATEGORIES[entryType][0].value,
    amount_type: "fixed",
    amount_value: 0,
    reason: "",
    target_year: today.getFullYear(),
    target_month: today.getMonth() + 1,
  });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [empSearch, setEmpSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEdit = !!entryId;
  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;

  const loadEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/employees/list", { headers: { Authorization: authH } });
      const data = await res.json();
      setEmployees(data.results || data.employees || []);
    } catch {}
  }, [authH]);

  const loadEntry = useCallback(async () => {
    if (!entryId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/hr/manual-entries/${entryType}/${entryId}`, { headers: { Authorization: authH } });
      const data = await res.json();
      const e = data.entry || data;
      if (!e?.id) { toast.error(ar ? "فشل التحميل" : "Load failed"); return; }
      setForm({
        employee_id: e.employee_id,
        category: e.category,
        amount_type: e.amount_type,
        amount_value: Number(e.amount_value) || 0,
        reason: e.reason || "",
        target_year: e.target_year,
        target_month: e.target_month,
      });
    } finally { setLoading(false); }
  }, [entryId, entryType, authH, ar]);

  useEffect(() => {
    if (open) {
      loadEmployees();
      if (entryId) loadEntry();
      else setForm({
        employee_id: null,
        category: CATEGORIES[entryType][0].value,
        amount_type: "fixed",
        amount_value: 0,
        reason: "",
        target_year: today.getFullYear(),
        target_month: today.getMonth() + 1,
      });
    }
  }, [open, entryId, entryType, loadEmployees, loadEntry]);

  const handleSave = async () => {
    if (!form.employee_id) { toast.error(ar ? "اختر الموظف" : "Select employee"); return; }
    if (!form.reason.trim()) { toast.error(ar ? "السبب مطلوب" : "Reason required"); return; }
    const amtDef = AMOUNT_TYPES.find(a => a.value === form.amount_type);
    if (amtDef?.needs_value && form.amount_value <= 0) {
      toast.error(ar ? "أدخل القيمة" : "Enter value");
      return;
    }

    setSaving(true);
    try {
      const url = isEdit
        ? `/api/hr/manual-entries/${entryType}/${entryId}`
        : `/api/hr/manual-entries/${entryType}`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { Authorization: authH, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(isEdit
          ? (ar ? "تم التحديث" : "Updated")
          : (ar ? "تم تقديم الطلب. بانتظار موافقة الإدارة" : "Request submitted. Pending approval"));
        onSaved();
        onClose();
      } else {
        toast.error(data.error || (ar ? "فشل الحفظ" : "Failed"));
      }
    } catch {
      toast.error(ar ? "خطأ في الاتصال" : "Network error");
    } finally { setSaving(false); }
  };

  const filteredEmployees = employees.filter(e => {
    if (!empSearch.trim()) return true;
    const q = empSearch.toLowerCase();
    const name = (e.full_name || `${e.first_name_ar || ""} ${e.last_name_ar || ""}`).toLowerCase();
    return name.includes(q) || (e.employee_code || "").toLowerCase().includes(q);
  });

  const selectedEmp = employees.find(e => e.id === form.employee_id);
  const amtDef = AMOUNT_TYPES.find(a => a.value === form.amount_type);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={ar ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`w-5 h-5 text-${config.color}-600`} />
            {isEdit
              ? `${ar ? "تعديل" : "Edit"} ${config.name_ar}`
              : `${ar ? "طلب" : "Request"} ${config.name_ar} ${ar ? "يدوي" : ""}`
            }
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            <div className={`p-3 rounded-lg bg-${config.color}-50 border border-${config.color}-200 text-sm`}>
              💡 {ar
                ? "الطلب هيروح لمدير الشركة للموافقة. HR هيعرف تلقائياً بعد الاعتماد."
                : "Request goes to Company Admin for approval. HR notified automatically."}
            </div>

            {/* الموظف */}
            <div>
              <label className="text-sm font-semibold block mb-1">{ar ? "الموظف *" : "Employee *"}</label>
              {selectedEmp ? (
                <div className={`flex items-center justify-between p-3 rounded-lg bg-${config.color}-50 border border-${config.color}-200`}>
                  <div className="flex items-center gap-2">
                    <User className={`w-4 h-4 text-${config.color}-600`} />
                    <div>
                      <p className="font-semibold text-sm">
                        {selectedEmp.full_name || `${selectedEmp.first_name_ar || ""} ${selectedEmp.last_name_ar || ""}`.trim()}
                      </p>
                      <p className="text-xs text-muted-foreground">{selectedEmp.employee_code}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setForm(f => ({...f, employee_id: null}))}>
                    {ar ? "تغيير" : "Change"}
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="relative mb-2">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={ar ? "ابحث عن موظف..." : "Search employee..."}
                      value={empSearch}
                      onChange={(e) => setEmpSearch(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto border rounded-md">
                    {filteredEmployees.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-4">
                        {ar ? "لا يوجد موظفين" : "No employees"}
                      </p>
                    ) : filteredEmployees.map(e => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, employee_id: e.id }))}
                        className="w-full text-right p-2 hover:bg-slate-50 border-b last:border-0"
                      >
                        <p className="text-sm font-medium">
                          {e.full_name || `${e.first_name_ar || ""} ${e.last_name_ar || ""}`.trim() || `#${e.id}`}
                        </p>
                        {e.employee_code && <p className="text-xs text-muted-foreground">{e.employee_code}</p>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* النوع */}
            <div>
              <label className="text-sm font-semibold block mb-1">{ar ? "التصنيف *" : "Category *"}</label>
              <select className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES[entryType].map(c => (
                  <option key={c.value} value={c.value}>{c.label_ar}</option>
                ))}
              </select>
            </div>

            {/* المبلغ */}
            <div className="p-4 rounded-lg bg-slate-50 border">
              <label className="text-sm font-semibold block mb-2">{ar ? "القيمة *" : "Amount *"}</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "النوع" : "Type"}</label>
                  <select className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                    value={form.amount_type} onChange={(e) => setForm({ ...form, amount_type: e.target.value })}>
                    {AMOUNT_TYPES.map(a => (
                      <option key={a.value} value={a.value}>{a.label_ar}</option>
                    ))}
                  </select>
                </div>
                {amtDef?.needs_value && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      {ar ? "القيمة" : "Value"} ({amtDef.suffix})
                    </label>
                    <Input type="number" step="0.01" value={form.amount_value}
                      onChange={(e) => setForm({ ...form, amount_value: Number(e.target.value) || 0 })} />
                  </div>
                )}
              </div>
            </div>

            {/* الشهر */}
            <div>
              <label className="text-sm font-semibold block mb-1">{ar ? "شهر التطبيق *" : "Apply on Month *"}</label>
              <div className="grid grid-cols-2 gap-3">
                <select className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                  value={form.target_month} onChange={(e) => setForm({ ...form, target_month: Number(e.target.value) })}>
                  {MONTHS_AR.map((m, i) => (
                    <option key={i+1} value={i+1}>{m}</option>
                  ))}
                </select>
                <Input type="number" min="2020" max="2030" value={form.target_year}
                  onChange={(e) => setForm({ ...form, target_year: Number(e.target.value) || today.getFullYear() })} />
              </div>
            </div>

            {/* السبب */}
            <div>
              <label className="text-sm font-semibold block mb-1">{ar ? "السبب *" : "Reason *"}</label>
              <textarea className="w-full px-3 py-2 border rounded-md text-sm min-h-[100px]"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder={ar ? "اشرح سبب الطلب بالتفصيل..." : "Explain the reason in detail..."} />
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t">
              <Button variant="outline" onClick={onClose} disabled={saving}>{ar ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={handleSave} disabled={saving} className={`gap-2 bg-${config.color}-600 hover:bg-${config.color}-700`}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isEdit ? (ar ? "حفظ" : "Save") : (ar ? "تقديم الطلب" : "Submit Request")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
