"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ScrollText, CheckCircle2, Loader2, Download, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

export function CharterGuard() {
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";
  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;

  const [mustAccept, setMustAccept] = useState(false);
  const [charter, setCharter] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch("/api/employee/charter", { headers: { Authorization: authH } })
      .then((r) => r.json())
      .then((data) => {
        if (data?.has_charter && data?.needs_acceptance && !data?.accepted) {
          setCharter(data.charter);
          setMustAccept(true);
        }
      })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, [token]);

  const handleAccept = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/employee/charter/accept", {
        method: "POST",
        headers: { Authorization: authH },
      });
      const data = await res.json();
      if (data.success) {
        toast.success(ar ? "تم تسجيل موافقتك على اللائحة بنجاح" : "Regulations accepted successfully");
        setMustAccept(false);
      } else {
        toast.error(data.error || (ar ? "فشل تسجيل الموافقة" : "Failed to accept"));
      }
    } catch {
      toast.error(ar ? "خطأ في الاتصال بالسيرفر" : "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!mustAccept || !charter) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4" dir={ar ? "rtl" : "ltr"}>
      <div className="bg-card border shadow-2xl rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-brand-primary text-white flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <ScrollText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold leading-tight">{charter.title}</h2>
            <p className="text-xs text-white/80 mt-0.5">
              {ar ? "الموافقة على لائحة العمل إلزامية لمتابعة استخدام النظام" : "Acceptance is required to continue using the system"}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {charter.introduction && (
            <div className="p-4 rounded-xl bg-muted/60 text-xs text-muted-foreground leading-relaxed">
              {charter.introduction}
            </div>
          )}

          <div className="p-4 rounded-xl border bg-background text-sm leading-loose whitespace-pre-wrap max-h-60 overflow-y-auto">
            {charter.content}
          </div>

          {charter.attachment_url && (
            <div className="p-3 rounded-xl bg-muted/40 border flex items-center justify-between gap-3 text-xs">
              <span className="font-medium truncate">{charter.attachment_name || (ar ? "ملف اللائحة المرفق" : "Attached File")}</span>
              <Button variant="outline" size="sm" asChild className="h-8 gap-1.5 shrink-0">
                <a href={charter.attachment_url} target="_blank" rel="noopener noreferrer">
                  <Download className="w-3.5 h-3.5" />
                  {ar ? "عرض الملف" : "View File"}
                </a>
              </Button>
            </div>
          )}

          <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-700 dark:text-amber-400 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              {ar
                ? "بالضغط على زر الموافقة، فإنك تقر بقراءة اللائحة التنظيمية وتتعهد بالالتزام بكافة بنودها."
                : "By clicking accept, you acknowledge reading and committing to all terms of this charter."}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-muted/20 border-t flex justify-end shrink-0">
          <Button
            onClick={handleAccept}
            disabled={submitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-11 text-sm font-semibold"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            {ar ? "أوافق وأتعهد بالالتزام بلائحة الشركة" : "I Accept & Commit to the Regulations"}
          </Button>
        </div>
      </div>
    </div>
  );
}
