"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Calendar, Plus, Trash2, Loader2 } from "lucide-react";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface EmployeeItem {
  id: number;
  employee_code?: string;
  full_name?: string;
  first_name_ar?: string;
  last_name_ar?: string;
}
interface ShiftItem {
  id: number;
  name: string;
}
interface OverrideItem {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_code: string;
  department: string;
  branch: string;
  shift_id: number;
  shift_name: string;
  override_date: string;
  reason: string;
  is_past: boolean;
}

export default function ShiftExceptionsPage() {
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";
  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;

  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [shifts, setShifts] = useState<ShiftItem[]>([]);
  const [overrides, setOverrides] = useState<OverrideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<string>("");
  const [selectedShift, setSelectedShift] = useState<string>("");
  const [overrideDate, setOverrideDate] = useState("");
  const [reason, setReason] = useState("");
  const [showPast, setShowPast] = useState(false);

  const loadAll = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [empRes, shiftRes, ovRes] = await Promise.all([
        fetch("/api/employees/list", { headers: { Authorization: authH } }),
        fetch("/api/shifts", { headers: { Authorization: authH } }),
        fetch(`/api/hr/shifts/overrides?show_past=${showPast}`, { headers: { Authorization: authH } }),
      ]);
      const [empData, shiftData, ovData] = await Promise.all([
        empRes.json(), shiftRes.json(), ovRes.json()
      ]);
      setEmployees(empData.results || empData.employees || []);
      setShifts(shiftData.results || shiftData.shifts || []);
      setOverrides(ovData.overrides || []);
    } catch {
      toast.error(ar ? "فشل تحميل البيانات" : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [showPast]);

  const createOverride = async () => {
    if (!selectedEmp || !selectedShift || !overrideDate) {
      toast.error(ar ? "الموظف والشيفت والتاريخ مطلوبين" : "Employee, shift and date required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/hr/shifts/overrides", {
        method: "POST",
        headers: { Authorization: authH, "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: Number(selectedEmp),
          shift_id: Number(selectedShift),
          override_date: overrideDate,
          reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(ar ? "تم إضافة الاستثناء" : "Override added");
        setSelectedEmp("");
        setSelectedShift("");
        setOverrideDate("");
        setReason("");
        loadAll();
      } else {
        toast.error(data.error || (ar ? "فشل الحفظ" : "Save failed"));
      }
    } catch {
      toast.error(ar ? "خطأ في الاتصال" : "Network error");
    } finally {
      setSaving(false);
    }
  };

  const deleteOverride = async (id: number) => {
    if (!confirm(ar ? "حذف الاستثناء؟" : "Delete override?")) return;
    try {
      const res = await fetch(`/api/hr/shifts/overrides/${id}`, {
        method: "DELETE",
        headers: { Authorization: authH },
      });
      const data = await res.json();
      if (data.success) {
        toast.success(ar ? "تم حذف الاستثناء" : "Deleted");
        loadAll();
      } else {
        toast.error(data.error || (ar ? "فشل الحذف" : "Delete failed"));
      }
    } catch {
      toast.error(ar ? "خطأ في الاتصال" : "Network error");
    }
  };

  return (
    <div className="space-y-6 pb-6" dir={ar ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {ar ? "استثناءات الشيفت" : "Shift Exceptions"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {ar ? "تحديد شيفت استثنائي لموظف في يوم معين" : "Assign an exceptional shift for a specific employee on a specific date"}
        </p>
      </div>

      {/* Create Form */}
      <div className="border rounded-xl p-5 bg-white space-y-4">
        <div className="flex items-center gap-2">
          <Plus className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold">{ar ? "إضافة استثناء جديد" : "Add New Override"}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">{ar ? "الموظف *" : "Employee *"}</label>
            <select
              className="w-full border rounded-lg px-3 py-2 bg-white"
              value={selectedEmp}
              onChange={(e) => setSelectedEmp(e.target.value)}
            >
              <option value="">{ar ? "-- اختر الموظف --" : "-- Select Employee --"}</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {(e.full_name || `${e.first_name_ar || ""} ${e.last_name_ar || ""}`.trim())} {e.employee_code ? `(${e.employee_code})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">{ar ? "الشيفت *" : "Shift *"}</label>
            <select
              className="w-full border rounded-lg px-3 py-2 bg-white"
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
            >
              <option value="">{ar ? "-- اختر الشيفت --" : "-- Select Shift --"}</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">{ar ? "التاريخ *" : "Date *"}</label>
            <input
              type="date"
              className="w-full border rounded-lg px-3 py-2"
              value={overrideDate}
              onChange={(e) => setOverrideDate(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">{ar ? "السبب" : "Reason"}</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={ar ? "اختياري" : "Optional"}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={createOverride}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {ar ? "إضافة الاستثناء" : "Add Override"}
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <input
          id="showPast"
          type="checkbox"
          checked={showPast}
          onChange={(e) => setShowPast(e.target.checked)}
        />
        <label htmlFor="showPast" className="text-sm cursor-pointer">
          {ar ? "إظهار الاستثناءات القديمة" : "Show past overrides"}
        </label>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : overrides.length === 0 ? (
        <div className="text-center py-16 border rounded-xl bg-white">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">{ar ? "لا توجد استثناءات شيفت" : "No shift overrides"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {overrides.map((o) => (
            <div key={o.id} className={`border-2 rounded-xl p-4 bg-white space-y-3 ${o.is_past ? "opacity-60 border-slate-200" : "border-indigo-200"}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm">{o.employee_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.employee_code} · {o.department} · {o.branch}
                  </p>
                </div>
                {o.is_past && (
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                    {ar ? "منتهي" : "Past"}
                  </span>
                )}
              </div>

              <div className="text-sm space-y-1">
                <p><span className="font-medium">{ar ? "الشيفت:" : "Shift:"}</span> {o.shift_name}</p>
                <p><span className="font-medium">{ar ? "التاريخ:" : "Date:"}</span> {o.override_date}</p>
                {o.reason && <p><span className="font-medium">{ar ? "السبب:" : "Reason:"}</span> {o.reason}</p>}
              </div>

              <div className="pt-2 border-t flex justify-end">
                <button
                  onClick={() => deleteOverride(o.id)}
                  className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  {ar ? "حذف" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
