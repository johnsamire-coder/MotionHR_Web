"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Megaphone, Loader2, BellRing, CheckCircle2, AlertCircle, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Announcement {
  id: number;
  title: string;
  content: string;
  author_name?: string;
  created_at?: string;
  priority?: string;
  is_read?: boolean;
}

export default function EmployeeAnnouncementsPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
    if (!token) return;
    const authHeader = token.startsWith("Token") ? token : `Token ${token}`;

    fetch("/api/employee/announcements", { headers: { Authorization: authHeader } })
      .then(r => r.json())
      .then(data => setAnnouncements(data?.announcements || []))
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, []);

  const getPriorityColor = (p?: string) => {
    if (p === "high") return "border-l-red-500";
    if (p === "medium") return "border-l-amber-500";
    return "border-l-emerald-500";
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{d.announcementsTitle}</h1>
        <p className="text-muted-foreground mt-1">
          {lang === "ar" ? "إعلانات الشركة والإشعارات المهمة" : "Company announcements and important notices"}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="py-24 text-center">
            <Megaphone className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <p className="font-medium">{lang === "ar" ? "لا يوجد إعلانات" : "No announcements"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map(ann => (
            <Card key={ann.id} className={`border-l-4 ${getPriorityColor(ann.priority)}`}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                    {ann.is_read ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <BellRing className="w-5 h-5 text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold">{ann.title}</h3>
                      {!ann.is_read && (
                        <Badge className="bg-brand-primary text-white border-0 text-[10px]">
                          {lang === "ar" ? "جديد" : "New"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{ann.content}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(ann.created_at)}</span>
                      {ann.author_name && (
                        <>
                          <span>•</span>
                          <span>{ann.author_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
