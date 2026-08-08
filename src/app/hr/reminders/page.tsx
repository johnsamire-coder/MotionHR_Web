"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Bell, Play, Loader2, CheckCircle2 } from "lucide-react";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface ReminderSetting {
  type: string;
  name: string;
  description: string;
  schedule: string;
  enabled: boolean;
}

export default function RemindersPage() {
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";
  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;

  const [reminders, setReminders] = useState<ReminderSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);

  const loadSettings = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/hr/reminders", { headers: { Authorization: authH } });
      const data = await res.json();
      setReminders(data.reminders || []);
    } catch {
      toast.error(ar ? "فشل تحميل الإعدادات" : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSettings(); }, []);

  const trigger = async (type: string) => {
    setTriggering(type);
    try {
      const res = await fetch("/api/hr/reminders", {
        method: "POST",
        headers: { Authorization: authH, "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(ar ? `تم إرسال تذكير: ${type}` : `Reminder sent: ${type}`);
      } else {
        toast.error(data.error || (ar ? "فشل الإرسال" : "Trigger failed"));
      }
    } catch {
      toast.error(ar ? "خطأ في الاتصال" : "Network error");
    } finally {
      setTriggering(null);
    }
  };

  return (
    <div className="space-y-6 pb-6" dir={ar ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{ar ? "إعدادات التذكيرات" : "Reminder Settings"}</h1>
        <p className="text-muted-foreground mt-1">
          {ar ? "عرض وتشغيل التذكيرات التلقائية للموظفين" : "View and trigger automatic employee reminders"}
        </p>
      </div>

      <div className="border rounded-xl p-4 bg-amber-50 border-amber-200 flex items-start gap-3">
        <Bell className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-700">
          {ar
            ? "التذكيرات تعمل تلقائياً حسب الجدول. يمكنك تشغيلها يدوياً من هنا في أي وقت."
            : "Reminders run automatically on schedule. You can trigger them manually here anytime."}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => trigger("all")}
              disabled={triggering !== null}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 disabled:opacity-60"
            >
              {triggering === "all" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {ar ? "تشغيل الكل" : "Trigger All"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reminders.map((r) => (
              <div key={r.type} className="border rounded-xl p-4 bg-white space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${r.enabled ? "bg-emerald-100" : "bg-slate-100"}`}>
                      {r.enabled
                        ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        : <Bell className="w-5 h-5 text-slate-400" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{r.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        🕐 {r.schedule}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-semibold shrink-0 ${r.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {r.enabled ? (ar ? "مفعّل" : "Active") : (ar ? "معطّل" : "Inactive")}
                  </span>
                </div>
                <div className="pt-2 border-t flex justify-end">
                  <button
                    onClick={() => trigger(r.type)}
                    disabled={triggering !== null}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm hover:bg-slate-50 disabled:opacity-60"
                  >
                    {triggering === r.type ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    {ar ? "تشغيل الآن" : "Trigger Now"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
