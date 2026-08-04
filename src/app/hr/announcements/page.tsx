"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Bell, BellRing, Users, Loader2, Plus, Calendar,
  Send, Filter, MessageSquare, Search, AlertCircle,
  CheckCircle2, Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

interface AnnouncementsData {
  announcements: Announcement[];
  unread_count: number;
  total: number;
}

function StatCard({
  icon: Icon, label, value, color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnnouncementsPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);

  const [data, setData] = useState<AnnouncementsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "medium",
  });

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  const fetchAnnouncements = () => {
    if (!token) return;
    setLoading(true);
    fetch("/api/announcements", {
      headers: { Authorization: authHeader },
    })
      .then(r => r.json())
      .then(setData)
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const announcements = data?.announcements || [];

  const filtered = announcements.filter(a => {
    const matchSearch = !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" ||
      (filter === "unread" && !a.is_read) ||
      (filter === "read" && a.is_read);
    return matchSearch && matchFilter;
  });

  const todayCount = announcements.filter(a => {
    if (!a.created_at) return false;
    const today = new Date().toDateString();
    return new Date(a.created_at).toDateString() === today;
  }).length;

  const handleCreate = async () => {
    if (!formData.title.trim()) { toast.error(d.annTitleRequired); return; }
    if (!formData.content.trim()) { toast.error(d.annContentRequired); return; }

    setIsSaving(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();
      toast.success(d.annCreated);
      setDialogOpen(false);
      setFormData({ title: "", content: "", priority: "medium" });
      fetchAnnouncements();
    } catch {
      toast.error(d.annCreateFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const getPriorityInfo = (priority?: string) => {
    const map: Record<string, { label: string; color: string; borderColor: string }> = {
      high: {
        label: d.priorityHigh,
        color: "bg-red-500/10 text-red-700 border-red-500/20",
        borderColor: "border-l-red-500"
      },
      medium: {
        label: d.priorityMedium,
        color: "bg-amber-500/10 text-amber-700 border-amber-500/20",
        borderColor: "border-l-amber-500"
      },
      low: {
        label: d.priorityLow,
        color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
        borderColor: "border-l-emerald-500"
      },
    };
    return map[priority || "medium"] || map.medium;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return lang === "ar" ? "الآن" : "Just now";
    if (diffMins < 1440) {
      const h = Math.floor(diffMins / 60);
      return lang === "ar" ? `منذ ${h} ساعة` : `${h}h ago`;
    }

    return date.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.announcementsTitle}</h1>
          <p className="text-muted-foreground mt-1">{d.announcementsDesc}</p>
        </div>

        <Button onClick={() => setDialogOpen(true)} className="gap-2 bg-brand-primary hover:bg-brand-primary/90">
          <Plus className="w-4 h-4" />
          {d.createAnnouncement}
        </Button>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <Card key={i}><CardContent className="p-4"><div className="h-16 bg-muted animate-pulse rounded" /></CardContent></Card>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard icon={Bell} label={d.totalAnnouncements} value={data?.total || 0} color="bg-blue-500/10 text-blue-600" />
          <StatCard icon={BellRing} label={d.unreadAnnouncements} value={data?.unread_count || 0} color="bg-amber-500/10 text-amber-600" />
          <StatCard icon={Calendar} label={d.todayAnnouncements} value={todayCount} color="bg-emerald-500/10 text-emerald-600" />
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={lang === "ar" ? "بحث في الإعلانات..." : "Search announcements..."}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>

            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{d.filterAllAnn}</SelectItem>
                <SelectItem value="unread">{d.filterUnread}</SelectItem>
                <SelectItem value="read">{d.filterRead}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Announcements List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-24">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <MessageSquare className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <p className="font-medium text-lg mb-2">{d.noAnnouncementsData}</p>
              <Button
                onClick={() => setDialogOpen(true)}
                variant="outline"
                className="gap-2 mt-4"
              >
                <Plus className="w-4 h-4" />
                {d.createFirstAnnouncement}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(ann => {
            const priorityInfo = getPriorityInfo(ann.priority);
            return (
              <Card
                key={ann.id}
                className={`border-l-4 ${priorityInfo.borderColor} hover:shadow-md transition-shadow`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                      {ann.is_read ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <BellRing className="w-5 h-5 text-amber-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-base">
                          {ann.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge className={`${priorityInfo.color} border font-medium text-[10px]`}>
                            <AlertCircle className="w-3 h-3 ml-1" />
                            {priorityInfo.label}
                          </Badge>
                          {!ann.is_read && (
                            <Badge className="bg-brand-primary text-white border-0 text-[10px]">
                              <Circle className="w-2 h-2 ml-1 fill-white" />
                              {d.isUnread}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {ann.content}
                      </p>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-5 h-5">
                            <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-[10px]">
                              {ann.author_name?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span>{ann.author_name || "—"}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(ann.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{d.dialogNewAnnouncement}</DialogTitle>
            <DialogDescription>{d.dialogNewAnnouncementDesc}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{d.annTitleLabel}</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder={lang === "ar" ? "مثال: اجتماع الفريق يوم الأحد" : "Example: Team meeting on Sunday"}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">{d.annContentLabel}</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                placeholder={lang === "ar" ? "اكتب محتوى الإعلان..." : "Write announcement content..."}
                rows={5}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label>{d.annPriorityLabel}</Label>
              <Select
                value={formData.priority}
                onValueChange={v => setFormData({ ...formData, priority: v })}
                disabled={isSaving}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      {d.priorityHigh}
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      {d.priorityMedium}
                    </div>
                  </SelectItem>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      {d.priorityLow}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSaving}
              >
                {d.cancel}
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isSaving}
                className="bg-brand-primary hover:bg-brand-primary/90 gap-2"
              >
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />{d.saving}</>
                ) : (
                  <><Send className="w-4 h-4" />{d.publishAnnouncement}</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
