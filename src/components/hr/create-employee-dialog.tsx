"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Dept  { id: number; name: string; name_en?: string }
interface Branch { id: number; name: string; name_en?: string }
interface JobTitle { id: number; title: string; title_en?: string }

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  departments: Dept[];
  branches: Branch[];
  jobTitles: JobTitle[];
}

const EMPTY = {
  first_name: "", last_name: "", first_name_en: "", last_name_en: "",
  employee_code: "", phone: "", email: "",
  department_id: "", branch_id: "", job_title_id: "",
  basic_salary: "", hire_date: "",
  gender: "male", worker_type: "employee",
};

export function CreateEmployeeDialog({ open, onClose, onSuccess, departments, branches, jobTitles }: Props) {
  const lang = useLangStore((s) => s.lang);
  const [form, setForm] = useState({ ...EMPTY });
  const [loading, setLoading] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.first_name || !form.last_name || !form.employee_code) {
      toast.error(lang === "ar" ? "الاسم والكود مطلوبين" : "Name and code are required");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        department_id: form.department_id ? Number(form.department_id) : undefined,
        branch_id:     form.branch_id     ? Number(form.branch_id)     : undefined,
        job_title_id:  form.job_title_id  ? Number(form.job_title_id)  : undefined,
        basic_salary:  form.basic_salary  ? Number(form.basic_salary)  : 0,
      };
      const res = await fetch("/api/hr/employees/create", {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(lang === "ar" ? "تم إضافة الموظف" : "Employee added");
        setForm({ ...EMPTY });
        onSuccess();
        onClose();
      } else {
        const msg = data.message || data.detail || JSON.stringify(data);
        toast.error(msg);
      }
    } catch {
      toast.error(lang === "ar" ? "خطأ في الشبكة" : "Network error");
    } finally {
      setLoading(false);
    }
  };

  const ar = lang === "ar";

  const Field = ({ label, field, type = "text", placeholder = "" }: {
    label: string; field: string; type?: string; placeholder?: string;
  }) => (
    <div>
      <label className="text-sm font-medium mb-1 block">{label}</label>
      <Input
        type={type}
        value={form[field as keyof typeof form]}
        onChange={e => set(field, e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-brand-primary" />
            {ar ? "إضافة موظف جديد" : "Add New Employee"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Name */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">
              {ar ? "الاسم" : "Name"}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label={ar ? "الاسم الأول (عربي) *" : "First Name (AR) *"} field="first_name" placeholder="محمد" />
              <Field label={ar ? "اسم العائلة (عربي) *" : "Last Name (AR) *"} field="last_name" placeholder="أحمد" />
              <Field label={ar ? "الاسم الأول (إنجليزي)" : "First Name (EN)"} field="first_name_en" placeholder="Mohamed" />
              <Field label={ar ? "اسم العائلة (إنجليزي)" : "Last Name (EN)"} field="last_name_en" placeholder="Ahmed" />
            </div>
          </div>

          {/* Basic Info */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">
              {ar ? "البيانات الأساسية" : "Basic Info"}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label={ar ? "الكود *" : "Code *"} field="employee_code" placeholder="EMP001" />
              <Field label={ar ? "رقم الموبايل" : "Phone"} field="phone" placeholder="+20..." />
              <Field label={ar ? "البريد الإلكتروني" : "Email"} field="email" type="email" placeholder="emp@co.com" />
              <Field label={ar ? "تاريخ التعيين" : "Hire Date"} field="hire_date" type="date" />
            </div>
          </div>

          {/* Org */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">
              {ar ? "الهيكل التنظيمي" : "Organization"}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">{ar ? "القسم" : "Department"}</label>
                <select
                  value={form.department_id}
                  onChange={e => set("department_id", e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="">{ar ? "اختر..." : "Select..."}</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {lang === "en" && d.name_en ? d.name_en : d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{ar ? "الفرع" : "Branch"}</label>
                <select
                  value={form.branch_id}
                  onChange={e => set("branch_id", e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="">{ar ? "اختر..." : "Select..."}</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {lang === "en" && b.name_en ? b.name_en : b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{ar ? "المسمى الوظيفي" : "Job Title"}</label>
                <select
                  value={form.job_title_id}
                  onChange={e => set("job_title_id", e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="">{ar ? "اختر..." : "Select..."}</option>
                  {jobTitles.map(j => (
                    <option key={j.id} value={j.id}>
                      {lang === "en" && j.title_en ? j.title_en : j.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{ar ? "نوع الموظف" : "Type"}</label>
                <select
                  value={form.worker_type}
                  onChange={e => set("worker_type", e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="employee">{ar ? "موظف" : "Employee"}</option>
                  <option value="manager">{ar ? "مدير" : "Manager"}</option>
                  <option value="driver">{ar ? "سائق" : "Driver"}</option>
                  <option value="field_worker">{ar ? "عامل ميداني" : "Field Worker"}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Salary + Gender */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">
              {ar ? "المرتب والنوع" : "Salary & Gender"}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label={ar ? "المرتب الأساسي" : "Basic Salary"} field="basic_salary" type="number" placeholder="0" />
              <div>
                <label className="text-sm font-medium mb-1 block">{ar ? "النوع" : "Gender"}</label>
                <select
                  value={form.gender}
                  onChange={e => set("gender", e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="male">{ar ? "ذكر" : "Male"}</option>
                  <option value="female">{ar ? "أنثى" : "Female"}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-brand-primary hover:bg-brand-secondary gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {ar ? "إضافة الموظف" : "Add Employee"}
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              {ar ? "إلغاء" : "Cancel"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
