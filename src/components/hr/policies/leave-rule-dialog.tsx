"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Calendar, Save, Loader2, Info, ChevronDown, ChevronUp,
  Sun, Heart, Zap, Baby, User, Ban, Moon, Cross, Flower } from "lucide-react";
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

const emptyForm = {
  name: "",
  // Annual
  annual_leave_enabled: true,
  annual_leave_days: 21,
  annual_earn_start: "after_probation",
  annual_carry_over: true,
  annual_max_carry_over: 7,
  annual_cash_out_allowed: false,
  annual_min_notice_days: 7,
  annual_max_consecutive_days: 30,
  // Sick
  sick_leave_enabled: true,
  sick_leave_max_days: 14,
  sick_requires_certificate_after: 3,
  sick_paid_percentage: 75,
  // Emergency
  emergency_leave_enabled: true,
  emergency_max_days: 3,
  emergency_max_per_month: 1,
  emergency_min_notice_hours: 2,
  emergency_requires_reason: true,
  emergency_deducted_from_annual: false,
  // Maternity
  maternity_enabled: true,
  maternity_days: 90,
  maternity_paid: true,
  maternity_paid_percentage: 100,
  maternity_extension_days: 0,
  maternity_max_times: 3,
  // Paternity
  paternity_enabled: true,
  paternity_days: 3,
  paternity_paid: true,
  // Unpaid
  unpaid_leave_enabled: true,
  unpaid_deduction_type: "full_day",
  unpaid_custom_amount: 0,
  max_unpaid_days_per_year: 30,
  unpaid_requires_approval: true,
  // Hajj
  hajj_enabled: true,
  hajj_days: 21,
  hajj_paid: true,
  hajj_once_in_lifetime: true,
  hajj_min_service_years: 5,
  // Bereavement
  bereavement_enabled: true,
  bereavement_days_first_degree: 3,
  bereavement_days_second_degree: 1,
  // Marriage
  marriage_enabled: true,
  marriage_days: 3,
  marriage_once_in_lifetime: true,
  // Scope
  scope: "company",
  branch_id: null as number | null,
  department_id: null as number | null,
  specific_employees: [] as number[],
  // Metadata
  is_active: true,
  start_date: new Date().toISOString().slice(0, 10),
  end_date: "",
  change_reason: "",
};

type SectionKey = "annual" | "sick" | "emergency" | "maternity" | "paternity" | "unpaid" | "hajj" | "bereavement" | "marriage";

export default function LeaveRuleDialog({ open, onClose, onSaved, ruleId, ar }: Props) {
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [empSearch, setEmpSearch] = useState("");
  const [versionInfo, setVersionInfo] = useState<{ version: number; isSuperseded: boolean } | null>(null);
  const [openSection, setOpenSection] = useState<SectionKey | null>("annual");

  const isEdit = !!ruleId;
  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;

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
      setBranches(brData.results || brData.branches || []);
      setDepartments(depData.results || depData.departments || []);
      setEmployees(empData.results || empData.employees || []);
    } catch {}
  }, [authH]);

  const loadRule = useCallback(async () => {
    if (!ruleId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/hr/policies/rules-leave/${ruleId}`, { headers: { Authorization: authH } });
      const data = await res.json();
      const r = data.rule || data;
      if (!r?.id) { toast.error(ar ? "فشل التحميل" : "Load failed"); return; }
      setForm({ ...emptyForm, ...r, specific_employees: r.specific_employees || [], change_reason: "", end_date: r.end_date || "" });
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
      const url = isEdit ? `/api/hr/policies/rules-leave/${ruleId}` : "/api/hr/policies/rules-leave";
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
          toast.success(ar ? `تم إنشاء النسخة رقم ${data.new_rule?.version_number}` : `Version created`);
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

  const setF = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const Section = ({ id, icon: Icon, title, enabled, onToggle, color, children }: {
    id: SectionKey;
    icon: any;
    title: string;
    enabled: boolean;
    onToggle: (v: boolean) => void;
    color: string;
    children: React.ReactNode;
  }) => {
    const isOpen = openSection === id;
    return (
      <div className={`rounded-lg border-2 overflow-hidden ${enabled ? `border-${color}-300` : "border-slate-200 opacity-70"}`}>
        <div className={`flex items-center justify-between p-3 bg-${color}-50 cursor-pointer`}
          onClick={() => setOpenSection(isOpen ? null : id)}>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={enabled}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onToggle(e.target.checked)}
              className="w-4 h-4" />
            <Icon className={`w-4 h-4 text-${color}-700`} />
            <p className="font-semibold text-sm">{title}</p>
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
        {isOpen && enabled && (
          <div className="p-3 bg-white space-y-3">{children}</div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto" dir={ar ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            {isEdit ? (ar ? "تعديل قواعد الإجازات" : "Edit Leave Rules") : (ar ? "إنشاء قواعد إجازات" : "Create Leave Rules")}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : (
          <div className="space-y-4">
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
              <Input value={form.name} onChange={(e) => setF("name", e.target.value)} />
            </div>

            <p className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
              {ar ? "💡 اضغط على كل قسم لفتحه، وشيل الشيك لتعطيل نوع الإجازة" : "💡 Click each section to expand, uncheck to disable a leave type"}
            </p>

            {/* Annual Leave */}
            <Section id="annual" icon={Sun} title={ar ? "الإجازة السنوية" : "Annual Leave"}
              enabled={form.annual_leave_enabled} onToggle={(v) => setF("annual_leave_enabled", v)} color="blue">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "عدد الأيام السنوية" : "Days/Year"}</label>
                  <Input type="number" value={form.annual_leave_days} onChange={(e) => setF("annual_leave_days", Number(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "بدء الاستحقاق" : "Earn Start"}</label>
                  <select className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                    value={form.annual_earn_start} onChange={(e) => setF("annual_earn_start", e.target.value)}>
                    <option value="immediate">{ar ? "من أول يوم" : "Immediate"}</option>
                    <option value="after_probation">{ar ? "بعد فترة الاختبار" : "After Probation"}</option>
                    <option value="after_year">{ar ? "بعد سنة" : "After Year"}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "أقل مدة إخطار (أيام)" : "Min Notice Days"}</label>
                  <Input type="number" value={form.annual_min_notice_days} onChange={(e) => setF("annual_min_notice_days", Number(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "أقصى إجازة متتالية" : "Max Consecutive"}</label>
                  <Input type="number" value={form.annual_max_consecutive_days} onChange={(e) => setF("annual_max_consecutive_days", Number(e.target.value) || 0)} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.annual_carry_over} onChange={(e) => setF("annual_carry_over", e.target.checked)} />
                {ar ? "ترحيل الرصيد للسنة التالية" : "Carry over to next year"}
              </label>
              {form.annual_carry_over && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "أقصى أيام للترحيل" : "Max Carry-Over Days"}</label>
                  <Input type="number" value={form.annual_max_carry_over} onChange={(e) => setF("annual_max_carry_over", Number(e.target.value) || 0)} />
                </div>
              )}
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.annual_cash_out_allowed} onChange={(e) => setF("annual_cash_out_allowed", e.target.checked)} />
                {ar ? "السماح بصرف نقدي للرصيد المتبقي" : "Allow cash-out for unused"}
              </label>
            </Section>

            {/* Sick Leave */}
            <Section id="sick" icon={Heart} title={ar ? "الإجازة المرضية" : "Sick Leave"}
              enabled={form.sick_leave_enabled} onToggle={(v) => setF("sick_leave_enabled", v)} color="red">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "أقصى أيام في السنة" : "Max Days/Year"}</label>
                  <Input type="number" value={form.sick_leave_max_days} onChange={(e) => setF("sick_leave_max_days", Number(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "شهادة طبية بعد كام يوم" : "Certificate After"}</label>
                  <Input type="number" value={form.sick_requires_certificate_after} onChange={(e) => setF("sick_requires_certificate_after", Number(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "نسبة الأجر %" : "Paid %"}</label>
                  <Input type="number" step="0.1" value={form.sick_paid_percentage} onChange={(e) => setF("sick_paid_percentage", Number(e.target.value) || 0)} />
                </div>
              </div>
            </Section>

            {/* Emergency Leave */}
            <Section id="emergency" icon={Zap} title={ar ? "الإجازة الطارئة" : "Emergency Leave"}
              enabled={form.emergency_leave_enabled} onToggle={(v) => setF("emergency_leave_enabled", v)} color="yellow">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "أقصى أيام/سنة" : "Max/Year"}</label>
                  <Input type="number" value={form.emergency_max_days} onChange={(e) => setF("emergency_max_days", Number(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "أقصى مرات/شهر" : "Max/Month"}</label>
                  <Input type="number" value={form.emergency_max_per_month} onChange={(e) => setF("emergency_max_per_month", Number(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "إخطار مسبق (ساعات)" : "Notice Hours"}</label>
                  <Input type="number" value={form.emergency_min_notice_hours} onChange={(e) => setF("emergency_min_notice_hours", Number(e.target.value) || 0)} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.emergency_requires_reason} onChange={(e) => setF("emergency_requires_reason", e.target.checked)} />
                {ar ? "السبب مطلوب" : "Reason required"}
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.emergency_deducted_from_annual} onChange={(e) => setF("emergency_deducted_from_annual", e.target.checked)} />
                {ar ? "تُخصم من رصيد السنوية" : "Deduct from annual balance"}
              </label>
            </Section>

            {/* Maternity */}
            <Section id="maternity" icon={Baby} title={ar ? "إجازة الأمومة" : "Maternity Leave"}
              enabled={form.maternity_enabled} onToggle={(v) => setF("maternity_enabled", v)} color="pink">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "عدد الأيام" : "Days"}</label>
                  <Input type="number" value={form.maternity_days} onChange={(e) => setF("maternity_days", Number(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "نسبة الأجر %" : "Paid %"}</label>
                  <Input type="number" step="0.1" value={form.maternity_paid_percentage} onChange={(e) => setF("maternity_paid_percentage", Number(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "أيام تمديد" : "Extension Days"}</label>
                  <Input type="number" value={form.maternity_extension_days} onChange={(e) => setF("maternity_extension_days", Number(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "الحد الأقصى (مرات)" : "Max Times"}</label>
                  <Input type="number" value={form.maternity_max_times} onChange={(e) => setF("maternity_max_times", Number(e.target.value) || 0)} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.maternity_paid} onChange={(e) => setF("maternity_paid", e.target.checked)} />
                {ar ? "مدفوعة" : "Paid"}
              </label>
            </Section>

            {/* Paternity */}
            <Section id="paternity" icon={User} title={ar ? "إجازة الأبوة" : "Paternity Leave"}
              enabled={form.paternity_enabled} onToggle={(v) => setF("paternity_enabled", v)} color="cyan">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{ar ? "عدد الأيام" : "Days"}</label>
                <Input type="number" value={form.paternity_days} onChange={(e) => setF("paternity_days", Number(e.target.value) || 0)} />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.paternity_paid} onChange={(e) => setF("paternity_paid", e.target.checked)} />
                {ar ? "مدفوعة" : "Paid"}
              </label>
            </Section>

            {/* Unpaid Leave */}
            <Section id="unpaid" icon={Ban} title={ar ? "الإجازة بدون رصيد" : "Unpaid Leave"}
              enabled={form.unpaid_leave_enabled} onToggle={(v) => setF("unpaid_leave_enabled", v)} color="orange">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "طريقة الحسم" : "Deduction Type"}</label>
                  <select className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                    value={form.unpaid_deduction_type} onChange={(e) => setF("unpaid_deduction_type", e.target.value)}>
                    <option value="full_day">{ar ? "يوم كامل من المرتب" : "Full Day"}</option>
                    <option value="basic_only">{ar ? "من الأساسي فقط" : "Basic Only"}</option>
                    <option value="custom">{ar ? "مبلغ مخصص" : "Custom Amount"}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "أقصى أيام/سنة" : "Max/Year"}</label>
                  <Input type="number" value={form.max_unpaid_days_per_year} onChange={(e) => setF("max_unpaid_days_per_year", Number(e.target.value) || 0)} />
                </div>
              </div>
              {form.unpaid_deduction_type === "custom" && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "المبلغ لكل يوم (EGP)" : "Custom Amount"}</label>
                  <Input type="number" step="0.01" value={form.unpaid_custom_amount} onChange={(e) => setF("unpaid_custom_amount", Number(e.target.value) || 0)} />
                </div>
              )}
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.unpaid_requires_approval} onChange={(e) => setF("unpaid_requires_approval", e.target.checked)} />
                {ar ? "يحتاج موافقة" : "Requires approval"}
              </label>
            </Section>

            {/* Hajj */}
            <Section id="hajj" icon={Moon} title={ar ? "إجازة الحج" : "Hajj Leave"}
              enabled={form.hajj_enabled} onToggle={(v) => setF("hajj_enabled", v)} color="emerald">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "عدد الأيام" : "Days"}</label>
                  <Input type="number" value={form.hajj_days} onChange={(e) => setF("hajj_days", Number(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "أقل سنوات خدمة" : "Min Service Years"}</label>
                  <Input type="number" value={form.hajj_min_service_years} onChange={(e) => setF("hajj_min_service_years", Number(e.target.value) || 0)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.hajj_paid} onChange={(e) => setF("hajj_paid", e.target.checked)} />
                  {ar ? "مدفوعة" : "Paid"}
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.hajj_once_in_lifetime} onChange={(e) => setF("hajj_once_in_lifetime", e.target.checked)} />
                  {ar ? "مرة واحدة طوال الخدمة" : "Once in lifetime"}
                </label>
              </div>
            </Section>

            {/* Bereavement */}
            <Section id="bereavement" icon={Cross} title={ar ? "إجازة الوفاة" : "Bereavement Leave"}
              enabled={form.bereavement_enabled} onToggle={(v) => setF("bereavement_enabled", v)} color="slate">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "أيام (درجة أولى)" : "1st Degree Days"}</label>
                  <Input type="number" value={form.bereavement_days_first_degree} onChange={(e) => setF("bereavement_days_first_degree", Number(e.target.value) || 0)} />
                  <p className="text-[10px] text-muted-foreground mt-1">{ar ? "أب/أم/زوج/زوجة/ابن" : "Parents/Spouse/Child"}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "أيام (درجة ثانية)" : "2nd Degree Days"}</label>
                  <Input type="number" value={form.bereavement_days_second_degree} onChange={(e) => setF("bereavement_days_second_degree", Number(e.target.value) || 0)} />
                  <p className="text-[10px] text-muted-foreground mt-1">{ar ? "أخ/أخت/جد/جدة" : "Sibling/Grandparent"}</p>
                </div>
              </div>
            </Section>

            {/* Marriage */}
            <Section id="marriage" icon={Flower} title={ar ? "إجازة الزواج" : "Marriage Leave"}
              enabled={form.marriage_enabled} onToggle={(v) => setF("marriage_enabled", v)} color="rose">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{ar ? "عدد الأيام" : "Days"}</label>
                <Input type="number" value={form.marriage_days} onChange={(e) => setF("marriage_days", Number(e.target.value) || 0)} />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.marriage_once_in_lifetime} onChange={(e) => setF("marriage_once_in_lifetime", e.target.checked)} />
                {ar ? "مرة واحدة طوال الخدمة" : "Once in lifetime"}
              </label>
            </Section>

            {/* Scope */}
            <div>
              <label className="text-sm font-semibold block mb-2">{ar ? "نطاق التطبيق *" : "Scope *"}</label>
              <select className="w-full px-3 py-2 border rounded-md bg-white text-sm mb-2"
                value={form.scope} onChange={(e) => setF("scope", e.target.value)}>
                <option value="company">{ar ? "الشركة كلها" : "Whole Company"}</option>
                <option value="branch">{ar ? "فرع محدد" : "Branch"}</option>
                <option value="department">{ar ? "إدارة محددة" : "Department"}</option>
                <option value="employees">{ar ? "موظفين محددين" : "Employees"}</option>
              </select>
              {form.scope === "branch" && (
                <select className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                  value={form.branch_id || ""} onChange={(e) => setF("branch_id", Number(e.target.value) || null)}>
                  <option value="">{ar ? "-- اختر --" : "--"}</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name_ar || b.name}</option>)}
                </select>
              )}
              {form.scope === "department" && (
                <select className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                  value={form.department_id || ""} onChange={(e) => setF("department_id", Number(e.target.value) || null)}>
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

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold block mb-1">{ar ? "من *" : "Start *"}</label>
                <Input type="date" value={form.start_date} onChange={(e) => setF("start_date", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1">{ar ? "إلى" : "End"}</label>
                <Input type="date" value={form.end_date} onChange={(e) => setF("end_date", e.target.value)} />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setF("is_active", e.target.checked)} />
              {ar ? "نشط" : "Active"}
            </label>

            {isEdit && (
              <div>
                <label className="text-sm font-semibold block mb-1">{ar ? "سبب التغيير" : "Change Reason"}</label>
                <textarea className="w-full px-3 py-2 border rounded-md text-sm min-h-[70px]"
                  value={form.change_reason} onChange={(e) => setF("change_reason", e.target.value)} />
              </div>
            )}

            <div className="flex gap-2 justify-end pt-3 border-t sticky bottom-0 bg-white">
              <Button variant="outline" onClick={onClose} disabled={saving}>{ar ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2 bg-purple-600 hover:bg-purple-700">
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
