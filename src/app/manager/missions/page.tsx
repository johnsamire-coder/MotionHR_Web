"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Briefcase, Plus, Loader2, CheckCircle2, XCircle, Clock,
  MapPin, User, Calendar, ChevronDown, ChevronUp, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Mission {
  id: number;
  title: string;
  location?: string;
  employee_name?: string;
  start_date?: string;
  end_date?: string;
  status: string;
  status_code: string;
  description?: string;
}

interface MissionRequest {
  id: number;
  employee_name: string;
  requested_location?: string;
  reason?: string;
  created_at: string;
}

interface TeamMember {
  id: number;
  full_name: string;
  employee_code: string;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  active:    { color: "text-emerald-700", bg: "bg-emerald-500/10" },
  completed: { color: "text-blue-700",    bg: "bg-blue-500/10" },
  pending:   { color: "text-amber-700",   bg: "bg-amber-500/10" },
  cancelled: { color: "text-red-700",     bg: "bg-red-500/10" },
};

export default function ManagerMissionsPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);

  const [missions, setMissions] = useState<Mission[]>([]);
  const [requests, setRequests] = useState<MissionRequest[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"missions" | "requests">("missions");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    title: "", description: "", location: "",
    start_date: "", end_date: "", employee_id: "",
  });

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  const loadData = () => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      fetch("/api/manager/missions", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/manager/mission-requests", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/manager/team", { headers: { Authorization: authHeader } }).then(r => r.json()),
    ]).then(([missData, reqData, teamData]) => {
      setMissions(missData?.missions || missData || []);
      setRequests(reqData?.requests || reqData || []);
      setTeam(teamData?.employees || []);
    })
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async () => {
    if (!form.title || !form.employee_id) {
      toast.error(lang === "ar" ? "العنوان والموظف مطلوبين" : "Title and employee are required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/manager/missions", {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, employee_id: Number(form.employee_id) }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(lang === "ar" ? "تم إنشاء المهمة" : "Mission created");
        setShowCreate(false);
        setForm({ title: "", description: "", location: "", start_date: "", end_date: "", employee_id: "" });
        loadData();
      } else {
        toast.error(data.message || (lang === "ar" ? "فشل" : "Failed"));
      }
    } catch {
      toast.error(lang === "ar" ? "خطأ" : "Error");
    } finally {
      setCreating(false);
    }
  };

  const handleRequestAction = async (requestId: number, action: "approve" | "reject") => {
    setActionLoading(requestId);
    try {
      const res = await fetch("/api/manager/mission-approve", {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId, action }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(action === "approve"
          ? (lang === "ar" ? "تم القبول" : "Approved")
          : (lang === "ar" ? "تم الرفض" : "Rejected"));
        loadData();
      } else {
        toast.error(data.message || "Failed");
      }
    } catch {
      toast.error("Error");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredMissions = missions.filter(m =>
    !search ||
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    (m.employee_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total:     missions.length,
    active:    missions.filter(m => m.status_code === "active").length,
    completed: missions.filter(m => m.status_code === "completed").length,
    pending:   requests.length,
  };

  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US") : "—";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {lang === "ar" ? "المهمات" : "Missions"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {lang === "ar" ? "أنشئ وتابع مهمات الفريق" : "Create and track team missions"}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2 bg-brand-primary hover:bg-brand-secondary">
          <Plus className="w-4 h-4" />
          {lang === "ar" ? "مهمة جديدة" : "New Mission"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { key: "total",     label: lang === "ar" ? "الكل" : "Total",     color: "brand-primary" },
          { key: "active",    label: lang === "ar" ? "نشطة" : "Active",    color: "emerald" },
          { key: "completed", label: lang === "ar" ? "منتهية" : "Completed", color: "blue" },
          { key: "pending",   label: lang === "ar" ? "طلبات" : "Requests", color: "amber" },
        ].map(s => (
          <Card key={s.key}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold mt-1">{stats[s.key as keyof typeof stats]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { key: "missions",  label: lang === "ar" ? "المهمات" : "Missions" },
          { key: "requests",  label: lang === "ar" ? "الطلبات" : "Requests",
            badge: requests.length > 0 ? requests.length : undefined },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as "missions" | "requests")}
            className={`pb-3 px-1 text-sm font-medium border-b-2 flex items-center gap-2 transition ${
              tab === t.key
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.badge && (
              <Badge className="bg-amber-500/10 text-amber-700 border-0 text-[10px]">{t.badge}</Badge>
            )}
          </button>
        ))}
      </div>

      {/* Search (missions tab) */}
      {tab === "missions" && (
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={lang === "ar" ? "بحث بالعنوان أو الموظف..." : "Search title or employee..."}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : tab === "missions" ? (
        filteredMissions.length === 0 ? (
          <Card>
            <CardContent className="py-24 text-center">
              <Briefcase className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {lang === "ar" ? "لا توجد مهمات" : "No missions"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredMissions.map(m => {
              const sc = STATUS_CONFIG[m.status_code] || STATUS_CONFIG.pending;
              return (
                <Card key={m.id} className="hover:shadow-md transition">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold">{m.title}</p>
                          <Badge className={`${sc.bg} ${sc.color} border-0 text-xs`}>{m.status}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                          {m.employee_name && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>{m.employee_name}</span>
                            </div>
                          )}
                          {m.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{m.location}</span>
                            </div>
                          )}
                          {m.start_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span dir="ltr">{fmtDate(m.start_date)} → {fmtDate(m.end_date)}</span>
                            </div>
                          )}
                        </div>
                        {m.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{m.description}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        // Requests Tab
        requests.length === 0 ? (
          <Card>
            <CardContent className="py-24 text-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-500/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {lang === "ar" ? "لا يوجد طلبات معلقة" : "No pending requests"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {requests.map(req => (
              <Card key={req.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold">{req.employee_name}</p>
                      {req.requested_location && (
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {req.requested_location}
                        </p>
                      )}
                      {req.reason && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{req.reason}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {fmtDate(req.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleRequestAction(req.id, "approve")}
                        disabled={actionLoading === req.id}
                        className="bg-emerald-600 hover:bg-emerald-700 gap-1"
                      >
                        {actionLoading === req.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <CheckCircle2 className="w-3 h-3" />}
                        {lang === "ar" ? "قبول" : "Approve"}
                      </Button>
                      <Button
                        size="sm" variant="outline"
                        onClick={() => handleRequestAction(req.id, "reject")}
                        disabled={actionLoading === req.id}
                        className="border-red-300 text-red-700 hover:bg-red-50 gap-1"
                      >
                        <XCircle className="w-3 h-3" />
                        {lang === "ar" ? "رفض" : "Reject"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Create Mission Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{lang === "ar" ? "إنشاء مهمة جديدة" : "Create New Mission"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium mb-1 block">
                {lang === "ar" ? "العنوان *" : "Title *"}
              </label>
              <Input
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder={lang === "ar" ? "عنوان المهمة" : "Mission title"}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                {lang === "ar" ? "الموظف *" : "Employee *"}
              </label>
              <select
                value={form.employee_id}
                onChange={e => setForm(p => ({ ...p, employee_id: e.target.value }))}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="">{lang === "ar" ? "اختر موظف..." : "Select employee..."}</option>
                {team.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.full_name} — {m.employee_code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                {lang === "ar" ? "الموقع" : "Location"}
              </label>
              <Input
                value={form.location}
                onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                placeholder={lang === "ar" ? "موقع المهمة" : "Mission location"}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  {lang === "ar" ? "تاريخ البداية" : "Start Date"}
                </label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  {lang === "ar" ? "تاريخ النهاية" : "End Date"}
                </label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                {lang === "ar" ? "الوصف" : "Description"}
              </label>
              <textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={3}
                placeholder={lang === "ar" ? "تفاصيل المهمة..." : "Mission details..."}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 bg-brand-primary hover:bg-brand-secondary gap-2"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {lang === "ar" ? "إنشاء" : "Create"}
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1">
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
