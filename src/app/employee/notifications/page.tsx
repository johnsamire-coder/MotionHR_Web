"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Bell, Loader2, CheckCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const ar = lang === "ar";
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const getAuth = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
    return token?.startsWith("Token") ? token : `Token ${token}`;
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employee/notifications", { headers: { Authorization: getAuth() } });
      const data = await res.json();
      setNotifications(data?.notifications || data?.items || []);
    } catch {
      toast.error(d.failedLoad);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markAllRead = async () => {
    setMarking(true);
    try {
      await fetch("/api/employee/notifications", {
        method: "POST",
        headers: { Authorization: getAuth(), "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success(ar ? "تم تعليم كل الإشعارات كمقروءة" : "All notifications marked as read");
    } catch {
      toast.error(ar ? "فشل" : "Failed");
    } finally {
      setMarking(false);
    }
  };

  const markOneRead = async (id: number) => {
    try {
      await fetch("/api/employee/notifications", {
        method: "POST",
        headers: { Authorization: getAuth(), "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return ar ? `منذ ${mins} د` : `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return ar ? `منذ ${hours} س` : `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return ar ? `منذ ${days} يوم` : `${days}d ago`;
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.notifications}</h1>
          <p className="text-muted-foreground mt-1">
            {ar ? "جميع إشعاراتك" : "All your notifications"}
            {unreadCount > 0 && (
              <span className="mr-2 ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-primary text-white">
                {unreadCount} {ar ? "غير مقروء" : "unread"}
              </span>
            )}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            disabled={marking}
            className="gap-2"
          >
            {marking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
            {ar ? "تعليم الكل كمقروء" : "Mark all as read"}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="py-24 text-center">
            <Bell className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <p className="font-medium">{ar ? "لا يوجد إشعارات" : "No notifications"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <Card
              key={n.id}
              className={`cursor-pointer transition-all ${n.is_read ? "" : "border-brand-primary/30 bg-brand-primary/5 hover:bg-brand-primary/10"}`}
              onClick={() => !n.is_read && markOneRead(n.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    n.is_read ? "bg-muted" : "bg-brand-primary/20"
                  }`}>
                    <Bell className={`w-5 h-5 ${n.is_read ? "text-muted-foreground" : "text-brand-primary"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${n.is_read ? "font-normal text-muted-foreground" : "font-semibold"}`}>
                        {n.title || n.message}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTimeAgo(n.created_at)}
                        </span>
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-brand-primary shrink-0" />
                        )}
                      </div>
                    </div>
                    {n.title && n.message && (
                      <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                    )}
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
