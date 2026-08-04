"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Bell, Loader2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Notification {
  id: number;
  title?: string;
  message?: string;
  type?: string;
  is_read?: boolean;
  created_at?: string;
}

export default function NotificationsPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
    if (!token) return;
    const authHeader = token.startsWith("Token") ? token : `Token ${token}`;

    fetch("/api/employee/notifications", { headers: { Authorization: authHeader } })
      .then(r => r.json())
      .then(data => setNotifications(data?.notifications || data?.items || []))
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, []);

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return lang === "ar" ? `منذ ${mins} د` : `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return lang === "ar" ? `منذ ${hours} س` : `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return lang === "ar" ? `منذ ${days} يوم` : `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{d.notifications}</h1>
        <p className="text-muted-foreground mt-1">
          {lang === "ar" ? "جميع إشعاراتك" : "All your notifications"}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="py-24 text-center">
            <Bell className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <p className="font-medium">{lang === "ar" ? "لا يوجد إشعارات" : "No notifications"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <Card key={n.id} className={n.is_read ? "" : "border-brand-primary/30 bg-brand-primary/5"}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    n.is_read ? "bg-muted" : "bg-brand-primary/20"
                  }`}>
                    <Bell className={`w-5 h-5 ${n.is_read ? "text-muted-foreground" : "text-brand-primary"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm">{n.title || n.message}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimeAgo(n.created_at)}
                      </span>
                    </div>
                    {n.title && n.message && <p className="text-xs text-muted-foreground mt-1">{n.message}</p>}
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
