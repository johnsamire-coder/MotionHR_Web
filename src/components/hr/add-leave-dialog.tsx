"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Emp { id: number; full_name?: string; name?: string; employee_code?: string; gender?: string }
interface LT { id: number; name: string; gender_restriction?: string }

export function AddLeaveDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const lang = useLangStore(s => s.lang);
  const ar = lang === "ar";
  const [employees, setEmployees] = useState<Emp[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LT[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ employee_id: "", leave_type_id: "", start_date: "", end_date: "", reason: "", status: "approved" });
  const [substitutes, setSubstitutes] = useState<{id: number; name: string; department: string}[]>([]);
  const [substituteId, setSubstituteId] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;

  useEffect(() => {
    if (!open) return;
    fetch("/api/employees/list?page_size=500", { headers: { Authorization: authH } })
      .then(r => r.json())
      .then(d => setEmployees(d.results || d.employees || []));
    fetch("/api/leaves/types", { headers: { Authorization: authH } })
      .then(r => r.json())
      .then(d => setLeaveTypes(d.leave_types || d.results || []));
    fetch("/api/leaves/substitutes", { headers: { Authorization: authH } })
      .then(r => r.json())
      .then(d => setSubstitutes(d.substitutes || []));
  }, [open]);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    if (form.start_date && !dateRe.test(form.start_date)) {
      toast.error(ar ? "تاريخ البداية غير صحيح" : "Invalid start date");
      return;
    }
    if (form.end_date && !dateRe.test(form.end_date)) {
      toast.error(ar ? "تاريخ النهاية غير صحيح" : "Invalid end date");
      return;
    }
    if (!form.employee_id || !form.leave_type_id || !form.start_date || !form.end_date || !form.reason) {
      toast.error(ar ? "كل الحقول مطلوبة" : "All fields required");
      return;
    }
    setLoading(true);
    try {
      // لو مرضية + approved → لازم بديل
      const selectedLT = leaveTypes.find(lt => String(lt.id) === form.leave_type_id) as (LT & {category?: string}) | undefined;
      const ltCategory = (selectedLT as any)?.category || "";
      if (ltCategory === "sick" && form.status === "approved" && !substituteId) {
        toast.error(ar ? "الإجازة المرضية تحتاج تحديد موظف بديل" : "Sick leave requires a substitute employee");
        setLoading(false);
        return;
      }
      const payload: Record<string, unknown> = {
        ...form,
        employee_id: Number(form.employee_id),
        leave_type_id: Number(form.leave_type_id),
      };
      if (substituteId) payload.substitute_employee_id = substituteId;
      const res = await fetch("/api/leaves/hr-create", {
        method: "POST",
        headers: { Authorization: authH, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        toast.success(data.message || (ar ? "تم بنجاح" : "Success"));
        setForm({ employee_id: "", leave_type_id: "", start_date: "", end_date: "", reason: "", status: "approved" });
        setSubstituteId("");
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || data.message || "Error");
      }
    } catch {
      toast.error(ar ? "خطأ في الشبكة" : "Network error");
    } finally {
      setLoading(false);
    }
  };

  const selectedEmp = employees.find(e => String(e.id) === form.employee_id);
  const empGender = (selectedEmp?.gender || "").toLowerCase();
  const filteredTypes = leaveTypes.filter(lt => {
    const r = (lt.gender_restriction || "all").toLowerCase();
    if (r === "female" && empGender === "male") return false;
    if (r === "male" && empGender === "female") return false;
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-primary" />
            {ar ? "إضافة إجازة" : "Add Leave"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{ar ? "الموظف *" : "Employee *"}</label>
            <select value={form.employee_id} onChange={e => set("employee_id", e.target.value)} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background h-9">
              <option value="">{ar ? "اختر..." : "Select..."}</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name || e.name} ({e.employee_code})</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{ar ? "نوع الإجازة *" : "Leave Type *"}</label>
            <select value={form.leave_type_id} onChange={e => set("leave_type_id", e.target.value)} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background h-9">
              <option value="">{ar ? "اختر..." : "Select..."}</option>
              {filteredTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{ar ? "من *" : "From *"}</label>
              <Input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} className="h-9" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{ar ? "إلى *" : "To *"}</label>
              <Input type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)} className="h-9" />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{ar ? "السبب *" : "Reason *"}</label>
            <Input value={form.reason} onChange={e => set("reason", e.target.value)} className="h-9" placeholder={ar ? "سبب الإجازة" : "Reason"} />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{ar ? "الموظف البديل (مطلوب للمرضية)" : "Substitute Employee (Required for Sick)"}</label>
            <select value={substituteId} onChange={e => setSubstituteId(e.target.value)} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background h-9">
              <option value="">{ar ? "اختر بديل..." : "Select substitute..."}</option>
              {substitutes.map(s => <option key={s.id} value={s.id}>{s.name}{s.department ? ` — ${s.department}` : ""}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{ar ? "الحالة" : "Status"}</label>
            <select value={form.status} onChange={e => set("status", e.target.value)} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background h-9">
              <option value="approved">{ar ? "موافق عليها" : "Approved"}</option>
              <option value="pending">{ar ? "معلقة" : "Pending"}</option>
            </select>
          </div>

          <div className="flex gap-3 pt-3 border-t">
            <Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-brand-primary hover:bg-brand-primary/90 gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {ar ? "إضافة" : "Add"}
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">{ar ? "إلغاء" : "Cancel"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
