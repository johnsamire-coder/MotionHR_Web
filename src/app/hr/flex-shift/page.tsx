"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Clock, CheckCircle, XCircle, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Adjustment {
  id: number;
  employee_id: number;
  employee_name: string;
  date: string;
  shift_name: string;
  required_hours: number;
  actual_hours: number;
  delta_hours: number;
  adjustment_type: string;
  adjustment_type_label: string;
  status: string;
  status_label: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
}

export default function FlexShiftPage() {
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";
  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;

  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [statusFilter, setStatusFilter] = useState("pending");

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/hr/flex-adjustments?status=${statusFilter}`, {
        headers: { Authorization: authH },
      });
      const data = await res.json();
      setAdjustments(data.adjustments || []);
    } catch {
      toast.error(ar ? "فشل تحميل البيانات" : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const review = async (id: number, action: "approve" | "reject") => {
    setActionId(id);
    try {
      const res = await fetch(`/api/hr/flex-adjustments/${id}/review`, {
        method: "POST",
        headers: { Authorization: authH, "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: notes[id] || "" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(action === "approve"
          ? (ar ? "تمت الموافقة" : "Approved")
          : (ar ? "تم الرفض" : "Rejected"));
        load();
      } else {
        toast.error(data.error || (ar ? "فشلت العملية" : "Action failed"));
      }
    } catch {
      toast.error(ar ? "خطأ في الاتصال" : "Network error");
    } finally {
      setActionId(null);
    }
  };

  const statusBadge = (status: string, label: string) => {
    const colors: Record<string, string> = {
      pending: "bg-amber-100 text-amber-700",
      approved: "bg-emerald-100 text-emerald-700",
      rejected: "bg-red-100 text-red-700",
    };
    return (
      <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${colors[status] || "bg-slate-100 text-slate-600"}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-6" dir={ar ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {ar ? "تعديلات الشيفت المرن" : "Flex Shift Adjustments"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {ar ? "مراجعة تسويات ساعات العمل للموظفين ذوي الشيفت المرن" : "Review flex shift working hours adjustments for employees"}
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[
          { value: "pending",  label_ar: "قيد المراجعة", label_en: "Pending" },
          { value: "approved", label_ar: "معتمد",         label_en: "Approved" },
          { value: "rejected", label_ar: "مرفوض",         label_en: "Rejected" },
          { value: "all",      label_ar: "الكل",           label_en: "All" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
              statusFilter === f.value
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white border-border hover:border-indigo-300"
            }`}
          >
            {ar ? f.label_ar : f.label_en}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : adjustments.length === 0 ? (
        <div className="text-center py-16 border rounded-xl bg-white">
          <Clock className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">{ar ? "لا توجد تسويات" : "No adjustments"}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {adjustments.map((adj) => (
            <div key={adj.id} className="border rounded-xl p-5 bg-white space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold">{adj.employee_name}</p>
                    {statusBadge(adj.status, adj.status_label)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {adj.date} · {adj.shift_name}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-sm font-semibold">
                  {adj.adjustment_type === "overtime"
                    ? <TrendingUp className="w-4 h-4 text-emerald-600" />
                    : <TrendingDown className="w-4 h-4 text-red-600" />}
                  <span className={adj.adjustment_type === "overtime" ? "text-emerald-600" : "text-red-600"}>
                    {adj.delta_hours > 0 ? "+" : ""}{adj.delta_hours.toFixed(1)}h
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-xs text-muted-foreground">{ar ? "المطلوب" : "Required"}</p>
                  <p className="font-bold text-sm">{adj.required_hours}h</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-xs text-muted-foreground">{ar ? "الفعلي" : "Actual"}</p>
                  <p className="font-bold text-sm">{adj.actual_hours}h</p>
                </div>
                <div className={`rounded-lg p-2 ${adj.delta_hours >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                  <p className="text-xs text-muted-foreground">{ar ? "الفرق" : "Delta"}</p>
                  <p className={`font-bold text-sm ${adj.delta_hours >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                    {adj.delta_hours > 0 ? "+" : ""}{adj.delta_hours.toFixed(1)}h
                  </p>
                </div>
              </div>

              <p className="text-xs font-medium text-muted-foreground">
                {adj.adjustment_type_label}
              </p>

              {adj.status !== "pending" && (
                <div className="text-xs text-muted-foreground bg-slate-50 rounded-lg p-3">
                  {adj.reviewed_by && <p>{ar ? "راجعه:" : "Reviewed by:"} {adj.reviewed_by} · {adj.reviewed_at}</p>}
                  {adj.review_notes && <p className="mt-1">{ar ? "ملاحظات:" : "Notes:"} {adj.review_notes}</p>}
                </div>
              )}

              {adj.status === "pending" && (
                <div className="space-y-3 pt-3 border-t">
                  <textarea
                    className="w-full border rounded-lg px-3 py-2 text-sm min-h-[60px]"
                    placeholder={ar ? "ملاحظات المراجعة (اختياري)" : "Review notes (optional)"}
                    value={notes[adj.id] || ""}
                    onChange={(e) => setNotes(prev => ({ ...prev, [adj.id]: e.target.value }))}
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => review(adj.id, "reject")}
                      disabled={actionId !== null}
                      className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-60 text-sm"
                    >
                      {actionId === adj.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      {ar ? "رفض" : "Reject"}
                    </button>
                    <button
                      onClick={() => review(adj.id, "approve")}
                      disabled={actionId !== null}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60 text-sm"
                    >
                      {actionId === adj.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      {ar ? "موافقة" : "Approve"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
