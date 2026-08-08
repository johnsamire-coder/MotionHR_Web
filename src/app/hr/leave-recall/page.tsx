"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { RefreshCw, CheckCircle, XCircle, Loader2, Clock } from "lucide-react";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface RecallItem {
  id: number;
  employee_id: number;
  employee_name: string;
  leave_id: number;
  recall_date: string;
  reason: string;
  status: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
}

export default function LeaveRecallPage() {
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";
  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;

  const [recalls, setRecalls] = useState<RecallItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  const loadRecalls = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/hr/leave-recall", { headers: { Authorization: authH } });
      const data = await res.json();
      setRecalls(data.recalls || data.results || []);
    } catch {
      toast.error(ar ? "فشل تحميل البيانات" : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRecalls(); }, []);

  const review = async (id: number, action: "approve" | "reject") => {
    setActionId(id);
    try {
      const res = await fetch(`/api/hr/leave-recall/${id}/review`, {
        method: "POST",
        headers: { Authorization: authH, "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(action === "approve"
          ? (ar ? "تم اعتماد الاستدعاء" : "Recall approved")
          : (ar ? "تم رفض الاستدعاء" : "Recall rejected"));
        setNotes("");
        loadRecalls();
      } else {
        toast.error(data.error || (ar ? "فشلت العملية" : "Action failed"));
      }
    } catch {
      toast.error(ar ? "خطأ في الاتصال" : "Network error");
    } finally {
      setActionId(null);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { color: string; label_ar: string; label_en: string }> = {
      pending:  { color: "bg-amber-100 text-amber-700",   label_ar: "قيد المراجعة", label_en: "Pending" },
      approved: { color: "bg-emerald-100 text-emerald-700", label_ar: "معتمد",       label_en: "Approved" },
      rejected: { color: "bg-red-100 text-red-700",       label_ar: "مرفوض",         label_en: "Rejected" },
    };
    const s = map[status] || { color: "bg-slate-100 text-slate-600", label_ar: status, label_en: status };
    return <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${s.color}`}>{ar ? s.label_ar : s.label_en}</span>;
  };

  return (
    <div className="space-y-6 pb-6" dir={ar ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{ar ? "استدعاء الإجازات" : "Leave Recalls"}</h1>
        <p className="text-muted-foreground mt-1">{ar ? "مراجعة واعتماد طلبات استدعاء الموظفين من إجازاتهم" : "Review and approve employee leave recall requests"}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : recalls.length === 0 ? (
        <div className="text-center py-16 border rounded-xl bg-white">
          <RefreshCw className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">{ar ? "لا توجد طلبات استدعاء" : "No recall requests"}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recalls.map((r) => (
            <div key={r.id} className="border rounded-xl p-5 bg-white space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold">{r.employee_name}</p>
                    {statusBadge(r.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {ar ? "تاريخ الاستدعاء:" : "Recall Date:"} {r.recall_date}
                  </p>
                  {r.reason && <p className="text-sm mt-1">{ar ? "السبب:" : "Reason:"} {r.reason}</p>}
                  {r.reviewed_by && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {ar ? "راجعه:" : "Reviewed by:"} {r.reviewed_by} · {r.reviewed_at}
                    </p>
                  )}
                  {r.review_notes && <p className="text-xs text-muted-foreground">{ar ? "ملاحظات:" : "Notes:"} {r.review_notes}</p>}
                </div>
                <Clock className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
              </div>

              {r.status === "pending" && (
                <div className="space-y-3 pt-3 border-t">
                  <textarea
                    className="w-full border rounded-lg px-3 py-2 text-sm min-h-[60px]"
                    placeholder={ar ? "ملاحظات المراجعة (اختياري)" : "Review notes (optional)"}
                    value={actionId === r.id ? notes : ""}
                    onChange={(e) => { setActionId(r.id); setNotes(e.target.value); }}
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => review(r.id, "reject")}
                      disabled={actionId !== null}
                      className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-60 text-sm"
                    >
                      {actionId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      {ar ? "رفض" : "Reject"}
                    </button>
                    <button
                      onClick={() => review(r.id, "approve")}
                      disabled={actionId !== null}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60 text-sm"
                    >
                      {actionId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      {ar ? "اعتماد الاستدعاء" : "Approve Recall"}
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
