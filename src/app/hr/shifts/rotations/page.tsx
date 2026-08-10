"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { RotateCcw, Plus, Trash2, Loader2, Users, Building2, Layers, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface SlotItem { start_day_index: number; end_day_index: number; shift_id: number; shift_name?: string; }
interface RotationItem { id: number; name: string; cycle_length_days: number; start_date: string; is_active: boolean; slots: SlotItem[]; }
interface ShiftItem { id: number; name: string; }
interface EmployeeItem { id: number; employee_code?: string; full_name?: string; first_name_ar?: string; last_name_ar?: string; }

export default function ShiftRotationsPage() {
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";
  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;

  const [rotations, setRotations] = useState<RotationItem[]>([]);
  const [shifts, setShifts] = useState<ShiftItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form - Create Rotation
  const [name, setName] = useState("");
  const [cycleLength, setCycleLength] = useState(7);
  const [startDate, setStartDate] = useState("");
  const [slots, setSlots] = useState<{ start_day_index: number; end_day_index: number; shift_id: string }[]>([
    { start_day_index: 0, end_day_index: 4, shift_id: "" },
    { start_day_index: 5, end_day_index: 6, shift_id: "" },
  ]);

  // Assign
  const [selectedRotation, setSelectedRotation] = useState<string>("");
  const [assignType, setAssignType] = useState<"employee" | "company">("company");
  const [assignEmp, setAssignEmp] = useState("");
  const [assignStart, setAssignStart] = useState("");

  const loadAll = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [rotRes, shiftRes, empRes] = await Promise.all([
        fetch("/api/hr/shifts/rotations", { headers: { Authorization: authH } }),
        fetch("/api/shifts", { headers: { Authorization: authH } }),
        fetch("/api/employees/list", { headers: { Authorization: authH } }),
      ]);
      const [rotData, shiftData, empData] = await Promise.all([
        rotRes.json(), shiftRes.json(), empRes.json()
      ]);
      setRotations(rotData.rotations || []);
      setShifts(shiftData.results || shiftData.shifts || []);
      setEmployees(empData.results || empData.employees || []);
    } catch {
      toast.error(ar ? "فشل تحميل البيانات" : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const createRotation = async () => {
    if (!name.trim() || !startDate) {
      toast.error(ar ? "الاسم والتاريخ مطلوبين" : "Name and date required");
      return;
    }
    const invalidSlot = slots.find(s => !s.shift_id);
    if (invalidSlot) {
      toast.error(ar ? "كل الفترات لازم يكون ليها شيفت" : "All slots must have a shift");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/hr/shifts/rotations", {
        method: "POST",
        headers: { Authorization: authH, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          cycle_length_days: cycleLength,
          start_date: startDate,
          slots: slots.map(s => ({
            start_day_index: s.start_day_index,
            end_day_index: s.end_day_index,
            shift_id: Number(s.shift_id),
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(ar ? "تم إنشاء التناوب" : "Rotation created");
        setName(""); setStartDate("");
        setSlots([{ start_day_index: 0, end_day_index: 4, shift_id: "" }, { start_day_index: 5, end_day_index: 6, shift_id: "" }]);
        loadAll();
      } else {
        toast.error(data.error || (ar ? "فشل الإنشاء" : "Create failed"));
      }
    } catch {
      toast.error(ar ? "خطأ في الاتصال" : "Network error");
    } finally { setSaving(false); }
  };

  const deleteRotation = async (id: number) => {
    if (!confirm(ar ? "حذف التناوب؟" : "Delete rotation?")) return;
    try {
      const res = await fetch(`/api/hr/shifts/rotations/${id}`, {
        method: "DELETE",
        headers: { Authorization: authH },
      });
      const data = await res.json();
      if (data.success) { toast.success(ar ? "تم الحذف" : "Deleted"); loadAll(); }
      else toast.error(data.error || (ar ? "فشل الحذف" : "Delete failed"));
    } catch { toast.error(ar ? "خطأ" : "Error"); }
  };

  const assignRotation = async () => {
    if (!selectedRotation || !assignStart) {
      toast.error(ar ? "اختر تناوب وتاريخ البداية" : "Select rotation and start date");
      return;
    }
    if (assignType === "employee" && !assignEmp) {
      toast.error(ar ? "اختر الموظف" : "Select employee");
      return;
    }
    setSaving(true);
    try {
      const body: any = { assignment_type: assignType, start_date: assignStart };
      if (assignType === "employee") body.employee_id = Number(assignEmp);
      const res = await fetch(`/api/hr/shifts/rotations/${selectedRotation}/assign`, {
        method: "POST",
        headers: { Authorization: authH, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) { toast.success(ar ? "تم التعيين" : "Assigned"); setSelectedRotation(""); setAssignEmp(""); setAssignStart(""); }
      else toast.error(data.error || (ar ? "فشل التعيين" : "Assign failed"));
    } catch { toast.error(ar ? "خطأ" : "Error"); }
    finally { setSaving(false); }
  };

  const updateSlot = (i: number, key: keyof typeof slots[0], val: any) => {
    setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, [key]: key === "shift_id" ? val : Number(val) } : s));
  };

  const addSlot = () => setSlots(prev => [...prev, { start_day_index: 0, end_day_index: 0, shift_id: "" }]);
  const removeSlot = (i: number) => { if (slots.length > 1) setSlots(prev => prev.filter((_, idx) => idx !== i)); };

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <Link href="/hr/shifts">
            <Button variant="outline" size="sm" className="gap-2">
              {ar ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {ar ? "رجوع للشيفتات" : "Back to Shifts"}
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {ar ? "تناوب الشيفتات" : "Shift Rotations"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {ar ? "دورات تلقائية لتبديل الشيفتات" : "Automatic shift rotation cycles"}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 pb-6" dir={ar ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{ar ? "تناوب الشيفتات" : "Shift Rotations"}</h1>
        <p className="text-muted-foreground mt-1">{ar ? "إنشاء دورات تناوب الشيفتات وتعيينها للموظفين" : "Create shift rotation cycles and assign them to employees"}</p>
      </div>

      {/* Create Form */}
      <div className="border rounded-xl p-5 bg-white space-y-4">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold">{ar ? "إنشاء تناوب جديد" : "Create New Rotation"}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">{ar ? "اسم التناوب *" : "Rotation Name *"}</label>
            <input type="text" className="w-full border rounded-lg px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} placeholder={ar ? "مثال: تناوب أسبوعي" : "e.g. Weekly Rotation"} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">{ar ? "طول الدورة (أيام) *" : "Cycle Length (days) *"}</label>
            <input type="number" min={1} max={30} className="w-full border rounded-lg px-3 py-2" value={cycleLength} onChange={(e) => setCycleLength(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">{ar ? "تاريخ البداية *" : "Start Date *"}</label>
            <input type="date" className="w-full border rounded-lg px-3 py-2" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
        </div>

        {/* Slots */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold">{ar ? "فترات الدورة *" : "Cycle Slots *"}</p>
            <button onClick={addSlot} className="text-xs text-indigo-600 hover:underline flex items-center gap-1"><Plus className="w-3 h-3" />{ar ? "إضافة فترة" : "Add Slot"}</button>
          </div>
          <div className="space-y-2">
            {slots.map((slot, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 items-center p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "من يوم (0-based)" : "From Day (0-based)"}</label>
                  <input type="number" min={0} max={cycleLength - 1} className="w-full border rounded px-2 py-1 text-sm" value={slot.start_day_index} onChange={(e) => updateSlot(i, "start_day_index", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "إلى يوم" : "To Day"}</label>
                  <input type="number" min={0} max={cycleLength - 1} className="w-full border rounded px-2 py-1 text-sm" value={slot.end_day_index} onChange={(e) => updateSlot(i, "end_day_index", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{ar ? "الشيفت" : "Shift"}</label>
                  <select className="w-full border rounded px-2 py-1 text-sm bg-white" value={slot.shift_id} onChange={(e) => updateSlot(i, "shift_id", e.target.value)}>
                    <option value="">{ar ? "-- اختر --" : "-- Select --"}</option>
                    {shifts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <button onClick={() => removeSlot(i)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={createRotation} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {ar ? "إنشاء التناوب" : "Create Rotation"}
          </button>
        </div>
      </div>

      {/* Assign */}
      <div className="border rounded-xl p-5 bg-white space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-semibold">{ar ? "تعيين تناوب لموظف / الشركة" : "Assign Rotation"}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">{ar ? "التناوب *" : "Rotation *"}</label>
            <select className="w-full border rounded-lg px-3 py-2 bg-white" value={selectedRotation} onChange={(e) => setSelectedRotation(e.target.value)}>
              <option value="">{ar ? "-- اختر تناوب --" : "-- Select Rotation --"}</option>
              {rotations.map(r => <option key={r.id} value={r.id}>{r.name} ({r.cycle_length_days} {ar ? "أيام" : "days"})</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">{ar ? "نوع التعيين" : "Assignment Type"}</label>
            <select className="w-full border rounded-lg px-3 py-2 bg-white" value={assignType} onChange={(e) => setAssignType(e.target.value as any)}>
              <option value="company">{ar ? "الشركة كلها" : "Whole Company"}</option>
              <option value="employee">{ar ? "موظف محدد" : "Specific Employee"}</option>
            </select>
          </div>
          {assignType === "employee" && (
            <div>
              <label className="text-sm font-medium block mb-1">{ar ? "الموظف *" : "Employee *"}</label>
              <select className="w-full border rounded-lg px-3 py-2 bg-white" value={assignEmp} onChange={(e) => setAssignEmp(e.target.value)}>
                <option value="">{ar ? "-- اختر الموظف --" : "-- Select Employee --"}</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name || `${e.first_name_ar || ""} ${e.last_name_ar || ""}`.trim()} {e.employee_code ? `(${e.employee_code})` : ""}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-sm font-medium block mb-1">{ar ? "تاريخ البداية *" : "Start Date *"}</label>
            <input type="date" className="w-full border rounded-lg px-3 py-2" value={assignStart} onChange={(e) => setAssignStart(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={assignRotation} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
            {ar ? "تعيين التناوب" : "Assign Rotation"}
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : rotations.length === 0 ? (
        <div className="text-center py-16 border rounded-xl bg-white">
          <RotateCcw className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">{ar ? "لا توجد دورات تناوب" : "No rotation cycles"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rotations.map((r) => (
            <div key={r.id} className={`border-2 rounded-xl p-4 bg-white space-y-3 ${r.is_active ? "border-indigo-200" : "border-slate-200 opacity-60"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.cycle_length_days} {ar ? "أيام · يبدأ من" : "days · starts"} {r.start_date}</p>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${r.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                  {r.is_active ? (ar ? "نشط" : "Active") : (ar ? "معطل" : "Inactive")}
                </span>
              </div>
              <div className="space-y-1">
                {r.slots.map((s, i) => (
                  <div key={i} className="text-xs bg-indigo-50 rounded px-2 py-1 flex justify-between">
                    <span>{ar ? "يوم" : "Day"} {s.start_day_index} → {s.end_day_index}</span>
                    <span className="font-semibold text-indigo-700">{s.shift_name}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t flex justify-end">
                <button onClick={() => deleteRotation(r.id)} className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 text-sm">
                  <Trash2 className="w-4 h-4" />{ar ? "حذف" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </div>
  );
}
