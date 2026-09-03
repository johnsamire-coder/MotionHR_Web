"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { ScrollText, CheckCircle2, Loader2, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Charter {
  id: number;
  title: string;
  introduction: string;
  content: string;
  is_mandatory: boolean;
  accepted: boolean;
  needs_acceptance: boolean;
  attachment_url?: string;
  attachment_name?: string;
}

export default function RegulationsPage() {
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";
  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;

  const [charters, setCharters] = useState<Charter[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/hr/my-charters", { headers: { Authorization: authH } });
      const data = await res.json();
      setCharters(data.charters || []);
    } catch {
      toast.error(ar ? "فشل تحميل اللوائح" : "Failed to load regulations");
    } finally {
      setLoading(false);
    }
  }, [token, authH, ar]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAccept = async (charterId: number) => {
    setAcceptingId(charterId);
    try {
      const res = await fetch(`/api/hr/charters/${charterId}/accept`, {
        method: "POST",
        headers: { Authorization: authH },
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || (ar ? "فشلت الموافقة" : "Acceptance failed"));
      }
      toast.success(ar ? "تم تسجيل موافقتك بنجاح" : "Your acceptance has been recorded");
      load();
    } catch (e: any) {
      toast.error(e.message || (ar ? "فشلت الموافقة" : "Acceptance failed"));
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{ar ? "لوائح العمل" : "Work Regulations"}</h1>
        <p className="text-muted-foreground mt-1">
          {ar ? "اللوائح والسياسات الخاصة بك" : "Regulations and policies that apply to you"}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : charters.length === 0 ? (
        <Card>
          <CardContent className="py-24 text-center">
            <ScrollText className="w-20 h-20 text-brand-primary/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {ar ? "لا توجد لوائح منشورة حالياً" : "No regulations published yet"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {ar ? "سيقوم قسم الموارد البشرية بنشر اللوائح هنا عند توفرها" : "HR will publish regulations here when available"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {charters.map((c) => (
            <Card key={c.id} className={c.needs_acceptance ? "border-amber-400" : ""}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-bold text-lg">{c.title}</h3>
                      {c.accepted ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-0 gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {ar ? "تمت الموافقة" : "Accepted"}
                        </Badge>
                      ) : c.is_mandatory ? (
                        <Badge className="bg-amber-100 text-amber-700 border-0">
                          {ar ? "بانتظار موافقتك" : "Awaiting your acceptance"}
                        </Badge>
                      ) : null}
                    </div>
                    {c.introduction && <p className="text-sm text-muted-foreground mb-3">{c.introduction}</p>}
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">{c.content}</div>
                    {c.attachment_url && (
                      <a
                      
                        href={c.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-brand-primary hover:underline mt-3"
                      >
                        <Download className="w-4 h-4" />
                        {c.attachment_name || (ar ? "تحميل المرفق" : "Download attachment")}
                      </a>
                    )}
                  </div>
                </div>
                {c.needs_acceptance && (
                  <div className="mt-4 pt-4 border-t flex justify-end">
                    <Button onClick={() => handleAccept(c.id)} disabled={acceptingId === c.id} className="gap-2">
                      {acceptingId === c.id && <Loader2 className="w-4 h-4 animate-spin" />}
                      <CheckCircle2 className="w-4 h-4" />
                      {ar ? "أوافق على اللائحة" : "I Accept"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
