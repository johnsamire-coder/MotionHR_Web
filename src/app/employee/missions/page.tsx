"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Briefcase, Plus, Loader2, MapPin, Calendar,
  User, Clock, ChevronRight, Send, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Mission {
  id: number;
  title: string;
  description?: string;
  status: string;
  status_display?: string;
  location_name?: string;
  client_name?: string;
  client_phone?: string;
  planned_start_time?: string;
  planned_end_time?: string;
  assignments?: MissionAssignment[];
}

interface MissionAssignment {
  id: number;
  status: string;
  started_at?: string;
  ended_at?: string;
  feedback?: string;
}

interface MissionsData {
  missions: Mission[];
  count: number;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label_ar: string; label_en: string }> = {
  pending:   { color: "text-amber-700",   bg: "bg-amber-500/10",   label_ar: "معلق",    label_en: "Pending" },
  active:    { color: "text-emerald-700", bg: "bg-emerald-500/10", label_ar: "نشط",     label_en: "Active" },
  completed: { color: "text-blue-700",    bg: "bg-blue-500/10",    label_ar: "منتهي",   label_en: "Completed" },
  cancelled: { color: "text-red-700",     bg: "bg-red-500/10",     label_ar: "ملغي",    label_en: "Cancelled" },
  assigned:  { color: "text-purple-700",  bg: "bg-purple-500/10",  label_ar: "مُعيّن",  label_en: "Assigned" },
};

const EMPTY_FORM = {
  title: "", description: "",
  location_name: "", location_lat: "", location_lng: "",
  client_name: "", client_phone: "",
  planned_start_time: "", planned_end_time: "",
  reason: "",
};

export default function EmployeeMissionsPage() {
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";

  const [data, setData]           = useState<MissionsData>({ missions: [], count: 0 });
  const [loading, setLoading]     = useState(true);
  const [showRequest, setShowRequest] = useState(false);
  const [form, setForm]           = useState({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab]             = useState<"active" | "completed" | "pending">("active");
  const [useMap, setUseMap]       = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;
  const langHeader = ar ? "ar" : "en";

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/employee/missions", {
        headers: { Authorization: authHeader, "Accept-Language": langHeader },
      });
      const d = await res.json();
      setData({ missions: d?.missions || [], count: d?.count || 0 });
    } catch {
      toast.error(ar ? "فشل تحميل المهمات" : "Failed to load missions");
    } finally {
      setLoading(false);
    }
  }, [token, ar]);

  useEffect(() => { load(); }, [load]);

  // ── Get Location ────────────────────────────────────────
  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error(ar ? "المتصفح لا يدعم الموقع" : "Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(p => ({
          ...p,
          location_lat: String(pos.coords.latitude),
          location_lng: String(pos.coords.longitude),
        }));
        toast.success(ar ? "تم تحديد الموقع ✅" : "Location captured ✅");
      },
      () => toast.error(ar ? "فشل تحديد الموقع" : "Failed to get location")
    );
  };

  // ── Submit Mission Request ──────────────────────────────
  const handleSubmit = async () => {
    if (!form.title) {
      toast.error(ar ? "عنوان المهمة مطلوب" : "Title is required");
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        description: form.description,
        location_name: form.location_name,
        client_name: form.client_name,
        client_phone: form.client_phone,
        reason: form.reason,
      };
      if (form.location_lat && form.location_lng) {
        payload.location_lat = parseFloat(form.location_lat);
        payload.location_lng = parseFloat(form.location_lng);
      }
      if (form.planned_start_time) payload.planned_start_time = form.planned_start_time;
      if (form.planned_end_time)   payload.planned_end_time   = form.planned_end_time;

      const res = await fetch("/api/employee/missions", {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
          "Accept-Language": langHeader,
        },
        body: JSON.stringify(payload),
      });
      const d = await res.json();

      if (res.ok && d.success !== false) {
        toast.success(ar ? "تم تقديم طلب المهمة ✅" : "Mission request submitted ✅");
        setShowRequest(false);
        setForm({ ...EMPTY_FORM });
        await load();
      } else {
        toast.error(d.message || d.error || (ar ? "فشل التقديم" : "Submission failed"));
      }
    } catch {
      toast.error(ar ? "خطأ في الشبكة" : "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMissions = data.missions.filter(m => {
    if (tab === "active")    return ["active", "assigned"].includes(m.status);
    if (tab === "completed") return m.status === "completed";
    if (tab === "pending")   return m.status === "pending";
    return true;
  });

  const fmtDateTime = (dt?: string) => {
    if (!dt) return "—";
    return new Date(dt).toLocaleDateString(ar ? "ar-EG" : "en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const tabCounts = {
    active:    data.missions.filter(m => ["active","assigned"].includes(m.status)).length,
    completed: data.missions.filter(m => m.status === "completed").length,
    pending:   data.missions.filter(m => m.status === "pending").length,
  };

  return (
    <div className="space-y-6 pb-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {ar ? "مهماتي" : "My Missions"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {ar ? "تابع وطلب المهمات" : "Track and request missions"}
          </p>
        </div>
        <Button
          onClick={() => { setForm({ ...EMPTY_FORM }); setShowRequest(true); }}
          className="gap-2 bg-brand-primary hover:bg-brand-secondary"
        >
          <Plus className="w-4 h-4" />
          {ar ? "طلب مهمة" : "Request Mission"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {[
          { key: "active",    label: ar ? "نشطة"   : "Active",    count: tabCounts.active },
          { key: "pending",   label: ar ? "معلقة"  : "Pending",   count: tabCounts.pending },
          { key: "completed", label: ar ? "منتهية" : "Completed", count: tabCounts.completed },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as "active" | "completed" | "pending")}
            className={`pb-3 px-3 text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              tab === t.key
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <Badge className="bg-muted text-muted-foreground border-0 text-[10px]">
                {t.count}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredMissions.length === 0 ? (
        <Card>
          <CardContent className="py-24 text-center">
            <Briefcase className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {ar ? "لا توجد مهمات" : "No missions"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredMissions.map(m => {
            const sc = STATUS_CONFIG[m.status] || STATUS_CONFIG.pending;
            return (
              <Card key={m.id} className="hover:shadow-md transition">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{m.title}</p>
                        <Badge className={`${sc.bg} ${sc.color} border-0 text-[10px]`}>
                          {ar ? sc.label_ar : sc.label_en}
                        </Badge>
                      </div>
                      {m.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{m.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {m.client_name && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <User className="w-3.5 h-3.5" />
                        <span>{m.client_name}</span>
                      </div>
                    )}
                    {m.location_name && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate">{m.location_name}</span>
                      </div>
                    )}
                    {m.planned_start_time && (
                      <div className="flex items-center gap-1.5 text-muted-foreground col-span-2" dir="ltr">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-xs font-mono">
                          {fmtDateTime(m.planned_start_time)}
                          {m.planned_end_time && ` → ${fmtDateTime(m.planned_end_time)}`}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Request Mission Dialog ── */}
      <Dialog open={showRequest} onOpenChange={v => !v && setShowRequest(false)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-brand-primary" />
              {ar ? "طلب مهمة جديدة" : "Request New Mission"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Title */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                {ar ? "عنوان المهمة *" : "Mission Title *"}
              </label>
              <Input
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder={ar ? "عنوان المهمة" : "Mission title"}
              />
            </div>

            {/* Client */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  {ar ? "اسم العميل" : "Client Name"}
                </label>
                <Input
                  value={form.client_name}
                  onChange={e => setForm(p => ({ ...p, client_name: e.target.value }))}
                  placeholder={ar ? "اسم العميل" : "Client name"}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  {ar ? "هاتف العميل" : "Client Phone"}
                </label>
                <Input
                  value={form.client_phone}
                  onChange={e => setForm(p => ({ ...p, client_phone: e.target.value }))}
                  placeholder="01..."
                  dir="ltr"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                {ar ? "الموقع" : "Location"}
              </label>
              <div className="flex gap-2">
                <Input
                  value={form.location_name}
                  onChange={e => setForm(p => ({ ...p, location_name: e.target.value }))}
                  placeholder={ar ? "اسم الموقع" : "Location name"}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={getLocation}
                  className="gap-1 shrink-0"
                >
                  <MapPin className="w-4 h-4" />
                  {ar ? "تحديد" : "GPS"}
                </Button>
              </div>
              {form.location_lat && form.location_lng && (
                <p className="text-xs text-emerald-700 mt-1 font-mono" dir="ltr">
                  📍 {parseFloat(form.location_lat).toFixed(5)}, {parseFloat(form.location_lng).toFixed(5)}
                </p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  {ar ? "من" : "From"}
                </label>
                <Input
                  type="datetime-local"
                  value={form.planned_start_time}
                  onChange={e => setForm(p => ({ ...p, planned_start_time: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  {ar ? "إلى" : "To"}
                </label>
                <Input
                  type="datetime-local"
                  value={form.planned_end_time}
                  onChange={e => setForm(p => ({ ...p, planned_end_time: e.target.value }))}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                {ar ? "تفاصيل المهمة" : "Description"}
              </label>
              <textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={3}
                placeholder={ar ? "تفاصيل..." : "Details..."}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background resize-none"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                {ar ? "سبب الطلب" : "Reason"}
              </label>
              <textarea
                value={form.reason}
                onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                rows={2}
                placeholder={ar ? "سبب طلب المهمة..." : "Reason for requesting..."}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-brand-primary hover:bg-brand-secondary gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {ar ? "تقديم الطلب" : "Submit"}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setShowRequest(false); setForm({ ...EMPTY_FORM }); }}
                className="flex-1"
              >
                {ar ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
