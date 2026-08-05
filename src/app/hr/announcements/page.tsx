"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Bell, Plus, Search, Loader2, Trash2, Edit2,
  BarChart2, CheckCircle, Clock, AlertCircle,
  Info, X, Eye, EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: "low" | "medium" | "high";
  priority_display?: string;
  is_read?: boolean;
  created_at: string;
  created_by_name?: string;
  read_count?: number;
  total_recipients?: number;
}

const PRIORITY_CONFIG = {
  high:   { color: "text-red-700",   bg: "bg-red-500/10",   border: "border-red-400",   icon: AlertCircle },
  medium: { color: "text-amber-700", bg: "bg-amber-500/10", border: "border-amber-400", icon: Info },
  low:    { color: "text-blue-700",  bg: "bg-blue-500/10",  border: "border-blue-400",  icon: CheckCircle },
};

const EMPTY_FORM = { title: "", content: "", priority: "medium" as "low" | "medium" | "high" };

export default function AnnouncementsPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState("");
  const [filter, setFilter]               = useState<"all" | "unread" | "read">("all");

  // Dialogs
  const [showCreate, setShowCreate]   = useState(false);
  const [editItem, setEditItem]       = useState<Announcement | null>(null);
  const [deleteId, setDeleteId]       = useState<number | null>(null);
  const [statsItem, setStatsItem]     = useState<Announcement | null>(null);
  const [statsData, setStatsData]     = useState<{ read_count: number; total: number } | null>(null);

  const [form, setForm]         = useState({ ...EMPTY_FORM });
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  // ── Load ────────────────────────────────────────────────
  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetch("/api/announcements", { headers: { Authorization: authHeader } })
      .then(r => r.json())
      .then(data => setAnnouncements(data?.announcements || data || []))
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, []);

  // ── Create ──────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.title || !form.content) {
      toast.error(ar ? "العنوان والمحتوى مطلوبين" : "Title and content are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(ar ? "تم إنشاء الإعلان" : "Announcement created");
        setShowCreate(false);
        setForm({ ...EMPTY_FORM });
        load();
      } else {
        toast.error(data.message || (ar ? "فشل" : "Failed"));
      }
    } catch {
      toast.error(ar ? "خطأ" : "Error");
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ─────────────────────────────────────────────────
  const handleEdit = async () => {
    if (!editItem || !form.title || !form.content) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/hr/announcements/${editItem.id}`, {
        method: "PUT",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(ar ? "تم التعديل" : "Updated");
        setEditItem(null);
        load();
      } else {
        toast.error(data.message || (ar ? "فشل" : "Failed"));
      }
    } catch {
      toast.error(ar ? "خطأ" : "Error");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/hr/announcements/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: authHeader },
      });
      if (res.ok) {
        toast.success(ar ? "تم الحذف" : "Deleted");
        setDeleteId(null);
        load();
      } else {
        toast.error(ar ? "فشل الحذف" : "Delete failed");
      }
    } catch {
      toast.error(ar ? "خطأ" : "Error");
    } finally {
      setDeleting(false);
    }
  };

  // ── Stats ────────────────────────────────────────────────
  const loadStats = async (item: Announcement) => {
    setStatsItem(item);
    setStatsData(null);
    try {
      const res = await fetch(`/api/hr/announcements/${item.id}`, {
        headers: { Authorization: authHeader },
      });
      const data = await res.json();
      setStatsData({
        read_count: data.read_count || 0,
        total: data.total_recipients || 0,
      });
    } catch {
      toast.error(ar ? "فشل تحميل الإحصائيات" : "Failed to load stats");
    }
  };

  // ── Filter ───────────────────────────────────────────────
  const filtered = announcements.filter(a => {
    if (filter === "unread" && a.is_read)  return false;
    if (filter === "read"   && !a.is_read) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const unreadCount = announcements.filter(a => !a.is_read).length;
  const todayCount  = announcements.filter(a =>
    new Date(a.created_at).toDateString() === new Date().toDateString()
  ).length;

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString(ar ? "ar-EG" : "en-US", {
      year: "numeric", month: "short", day: "numeric",
    });

  const openEdit = (item: Announcement) => {
    setForm({ title: item.title, content: item.content, priority: (item.priority as "low" | "medium" | "high") });
    setEditItem(item);
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.announcementsTitle}</h1>
          <p className="text-muted-foreground mt-1">{d.announcementsDesc}</p>
        </div>
        <Button
          onClick={() => { setForm({ ...EMPTY_FORM }); setShowCreate(true); }}
          className="gap-2 bg-brand-primary hover:bg-brand-secondary"
        >
          <Plus className="w-4 h-4" />
          {d.createAnnouncement}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: ar ? "الكل" : "Total",      value: announcements.length, icon: Bell,         color: "text-brand-primary bg-brand-primary/10" },
          { label: ar ? "غير مقروء" : "Unread", value: unreadCount,          icon: EyeOff,        color: "text-amber-600 bg-amber-500/10" },
          { label: ar ? "اليوم" : "Today",      value: todayCount,            icon: CheckCircle,   color: "text-emerald-600 bg-emerald-500/10" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={ar ? "بحث في الإعلانات..." : "Search announcements..."}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
            <div className="flex gap-1 border rounded-lg p-1">
              {(["all", "unread", "read"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                    filter === f
                      ? "bg-brand-primary text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f === "all"    ? (ar ? "الكل"        : "All")    : ""}
                  {f === "unread" ? (ar ? "غير مقروء"   : "Unread") : ""}
                  {f === "read"   ? (ar ? "مقروء"        : "Read")   : ""}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-24 text-center">
            <Bell className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {ar ? "لا توجد إعلانات" : "No announcements"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => {
            const pc = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.low;
            const PIcon = pc.icon;
            return (
              <Card
                key={item.id}
                className={`border-r-4 ${pc.border} hover:shadow-md transition`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-lg ${pc.bg} flex items-center justify-center mt-0.5`}>
                        <PIcon className={`w-5 h-5 ${pc.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-semibold">{item.title}</p>
                          {!item.is_read && (
                            <Badge className="bg-brand-primary/10 text-brand-primary border-0 text-[10px]">
                              {ar ? "جديد" : "New"}
                            </Badge>
                          )}
                          <Badge className={`${pc.bg} ${pc.color} border-0 text-[10px]`}>
                            {item.priority_display || item.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.content}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {item.created_by_name && <span>{item.created_by_name}</span>}
                          <span>{fmtDate(item.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon" variant="ghost"
                        onClick={() => loadStats(item)}
                        className="w-8 h-8 text-muted-foreground hover:text-brand-primary"
                        title={ar ? "الإحصائيات" : "Stats"}
                      >
                        <BarChart2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon" variant="ghost"
                        onClick={() => openEdit(item)}
                        className="w-8 h-8 text-muted-foreground hover:text-amber-600"
                        title={ar ? "تعديل" : "Edit"}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon" variant="ghost"
                        onClick={() => setDeleteId(item.id)}
                        className="w-8 h-8 text-muted-foreground hover:text-red-600"
                        title={ar ? "حذف" : "Delete"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Create Dialog ── */}
      <Dialog open={showCreate} onOpenChange={v => !v && setShowCreate(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{ar ? "إنشاء إعلان جديد" : "Create Announcement"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium mb-1 block">{ar ? "العنوان *" : "Title *"}</label>
              <Input
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder={ar ? "عنوان الإعلان" : "Announcement title"}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{ar ? "المحتوى *" : "Content *"}</label>
              <textarea
                value={form.content}
                onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                rows={4}
                placeholder={ar ? "نص الإعلان..." : "Announcement content..."}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background resize-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{ar ? "الأهمية" : "Priority"}</label>
              <select
                value={form.priority}
                onChange={e => setForm(p => ({ ...p, priority: e.target.value as "low" | "medium" | "high" }))}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="low">{ar ? "منخفضة" : "Low"}</option>
                <option value="medium">{ar ? "متوسطة" : "Medium"}</option>
                <option value="high">{ar ? "عالية" : "High"}</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleCreate} disabled={saving}
                className="flex-1 bg-brand-primary hover:bg-brand-secondary gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {ar ? "إنشاء" : "Create"}
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1">
                {ar ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog open={!!editItem} onOpenChange={v => !v && setEditItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{ar ? "تعديل الإعلان" : "Edit Announcement"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium mb-1 block">{ar ? "العنوان *" : "Title *"}</label>
              <Input
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{ar ? "المحتوى *" : "Content *"}</label>
              <textarea
                value={form.content}
                onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                rows={4}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background resize-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{ar ? "الأهمية" : "Priority"}</label>
              <select
                value={form.priority}
                onChange={e => setForm(p => ({ ...p, priority: e.target.value as "low" | "medium" | "high" }))}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="low">{ar ? "منخفضة" : "Low"}</option>
                <option value="medium">{ar ? "متوسطة" : "Medium"}</option>
                <option value="high">{ar ? "عالية" : "High"}</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleEdit} disabled={saving}
                className="flex-1 bg-amber-600 hover:bg-amber-700 gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
                {ar ? "حفظ التعديلات" : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={() => setEditItem(null)} className="flex-1">
                {ar ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {ar ? "حذف الإعلان" : "Delete Announcement"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {ar ? "هتحذف الإعلان ده نهائياً. مش هيرجع." : "This will permanently delete the announcement."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{ar ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {ar ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Stats Dialog ── */}
      <Dialog open={!!statsItem} onOpenChange={v => !v && setStatsItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-brand-primary" />
              {ar ? "إحصائيات الإعلان" : "Announcement Stats"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="font-medium text-sm">{statsItem?.title}</p>
            {!statsData ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Eye className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-emerald-700">{statsData.read_count}</p>
                    <p className="text-xs text-muted-foreground">{ar ? "قرأوا" : "Read"}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Eye className="w-6 h-6 text-brand-primary mx-auto mb-1" />
                    <p className="text-2xl font-bold">{statsData.total}</p>
                    <p className="text-xs text-muted-foreground">{ar ? "الكل" : "Total"}</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}





