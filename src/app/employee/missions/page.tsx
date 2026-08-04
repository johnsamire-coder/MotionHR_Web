"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  Briefcase, Plus, Loader2, MapPin, Calendar,
  User, Send, Navigation, Phone,
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
  location_name?: string;
  client_name?: string;
  client_phone?: string;
  planned_start_time?: string;
  planned_end_time?: string;
}

interface MissionsData { missions: Mission[]; count: number }

const STATUS_CONFIG: Record<string, {
  color: string; bg: string; label_ar: string; label_en: string
}> = {
  pending:          { color: "text-amber-700",   bg: "bg-amber-500/10",   label_ar: "معلق",             label_en: "Pending" },
  pending_approval: { color: "text-amber-700",   bg: "bg-amber-500/10",   label_ar: "بانتظار الموافقة", label_en: "Awaiting Approval" },
  active:           { color: "text-emerald-700", bg: "bg-emerald-500/10", label_ar: "نشط",              label_en: "Active" },
  completed:        { color: "text-blue-700",    bg: "bg-blue-500/10",    label_ar: "منتهي",            label_en: "Completed" },
  cancelled:        { color: "text-red-700",     bg: "bg-red-500/10",     label_ar: "ملغي",             label_en: "Cancelled" },
  assigned:         { color: "text-purple-700",  bg: "bg-purple-500/10",  label_ar: "مُعيّن",           label_en: "Assigned" },
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

  const [data, setData]               = useState<MissionsData>({ missions: [], count: 0 });
  const [loading, setLoading]         = useState(true);
  const [showRequest, setShowRequest] = useState(false);
  const [form, setForm]               = useState({ ...EMPTY_FORM });
  const [submitting, setSubmitting]   = useState(false);
  const [gettingLoc, setGettingLoc]   = useState(false);
  const [tab, setTab]                 = useState<"active" | "pending" | "completed">("active");
  const mapRef                        = useRef<HTMLDivElement>(null);
  const mapInstanceRef                = useRef<unknown>(null);
  const markerRef                     = useRef<unknown>(null);

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
      toast.error(ar ? "فشل تحميل المهمات" : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token, ar]);

  useEffect(() => { load(); }, [load]);

  // ── Init Map ─────────────────────────────────────────────
  const initMap = async (lat = 30.0444, lng = 31.2357) => {
    if (!mapRef.current || mapInstanceRef.current) return;
    try {
      await import("leaflet/dist/leaflet.css");
      const L = await import("leaflet");

      const map = L.map(mapRef.current).setView([lat, lng], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);

      const updatePos = (newLat: number, newLng: number) => {
        setForm(p => ({
          ...p,
          location_lat: String(newLat.toFixed(6)),
          location_lng: String(newLng.toFixed(6)),
        }));
      };

      marker.on("dragend", () => {
        const pos = (marker as { getLatLng: () => { lat: number; lng: number } }).getLatLng();
        updatePos(pos.lat, pos.lng);
      });

      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        (marker as { setLatLng: (p: [number, number]) => void }).setLatLng([e.latlng.lat, e.latlng.lng]);
        updatePos(e.latlng.lat, e.latlng.lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      updatePos(lat, lng);
    } catch (e) {
      console.error("Map error:", e);
    }
  };

  const openRequest = () => {
    setForm({ ...EMPTY_FORM });
    mapInstanceRef.current = null;
    markerRef.current = null;
    setShowRequest(true);
    setTimeout(() => initMap(), 300);
  };

  // ── GPS ──────────────────────────────────────────────────
  const getGPS = async () => {
    setGettingLoc(true);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
      );
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      setForm(p => ({
        ...p,
        location_lat: String(lat.toFixed(6)),
        location_lng: String(lng.toFixed(6)),
      }));

      const map = mapInstanceRef.current as { setView: (p: [number, number], z: number) => void } | null;
      const marker = markerRef.current as { setLatLng: (p: [number, number]) => void } | null;
      if (map) map.setView([lat, lng], 15);
      if (marker) marker.setLatLng([lat, lng]);

      toast.success(ar ? "تم تحديد موقعك ✅" : "Location captured ✅");
    } catch {
      toast.error(ar ? "فشل تحديد الموقع" : "Failed to get location");
    } finally {
      setGettingLoc(false);
    }
  };

  // ── Submit ───────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.title) {
      toast.error(ar ? "عنوان المهمة مطلوب" : "Title is required");
      return;
    }
    if (!form.planned_start_time || !form.planned_end_time) {
      toast.error(ar ? "وقت البداية والنهاية مطلوبين" : "Start and end time are required");
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        description: form.description || "",
        location_name: form.location_name || "",
        client_name: form.client_name || "",
        client_phone: form.client_phone || "",
        reason: form.reason || "",
        planned_start_time: form.planned_start_time,
        planned_end_time: form.planned_end_time,
      };
      if (form.location_lat && form.location_lng) {
        payload.location_lat = parseFloat(form.location_lat);
        payload.location_lng = parseFloat(form.location_lng);
      }

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
        toast.success(ar ? "تم إرسال طلب المهمة للمدير ✅" : "Mission request sent to manager ✅");
        setShowRequest(false);
        setForm({ ...EMPTY_FORM });
        mapInstanceRef.current = null;
        await load();
      } else {
        toast.error(d.message || d.error || (ar ? "فشل التقديم" : "Failed"));
      }
    } catch {
      toast.error(ar ? "خطأ في الشبكة" : "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = data.missions.filter(m => {
    if (tab === "active")    return ["active","assigned"].includes(m.status);
    if (tab === "pending")   return ["pending","pending_approval"].includes(m.status);
    if (tab === "completed") return m.status === "completed";
    return true;
  });

  const counts = {
    active:    data.missions.filter(m => ["active","assigned"].includes(m.status)).length,
    pending:   data.missions.filter(m => ["pending","pending_approval"].includes(m.status)).length,
    completed: data.missions.filter(m => m.status === "completed").length,
  };

  const fmtDT = (dt?: string) => {
    if (!dt) return "—";
    return new Date(dt).toLocaleString(ar ? "ar-EG" : "en-US", {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
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
          onClick={openRequest}
          className="gap-2 bg-brand-primary hover:bg-brand-secondary"
        >
          <Plus className="w-4 h-4" />
          {ar ? "طلب مهمة" : "Request Mission"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {[
          { key: "active",    label: ar ? "نشطة"   : "Active",    count: counts.active },
          { key: "pending",   label: ar ? "معلقة"  : "Pending",   count: counts.pending },
          { key: "completed", label: ar ? "منتهية" : "Completed", count: counts.completed },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
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
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-24 text-center">
            <Briefcase className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">{ar ? "لا توجد مهمات" : "No missions"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(m => {
            const sc = STATUS_CONFIG[m.status] || STATUS_CONFIG.pending;
            return (
              <Card key={m.id} className="hover:shadow-md transition">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                    {m.client_phone && (
                      <div className="flex items-center gap-1.5 text-muted-foreground" dir="ltr">
                        <Phone className="w-3.5 h-3.5" />
                        <span className="font-mono text-xs">{m.client_phone}</span>
                      </div>
                    )}
                    {m.location_name && (
                      <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate">{m.location_name}</span>
                      </div>
                    )}
                    {m.planned_start_time && (
                      <div className="flex items-center gap-1.5 text-muted-foreground col-span-2" dir="ltr">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-xs font-mono">
                          {fmtDT(m.planned_start_time)}
                          {m.planned_end_time && ` → ${fmtDT(m.planned_end_time)}`}
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
      <Dialog
        open={showRequest}
        onOpenChange={v => { if (!v) { setShowRequest(false); mapInstanceRef.current = null; } }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

            {/* Location Name */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                {ar ? "اسم موقع العميل" : "Client Location Name"}
              </label>
              <Input
                value={form.location_name}
                onChange={e => setForm(p => ({ ...p, location_name: e.target.value }))}
                placeholder={ar ? "مثال: مكتب العميل - المعادي" : "e.g. Client office - Maadi"}
              />
            </div>

            {/* Map for Location */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">
                  {ar ? "موقع العميل على الخريطة" : "Client Location on Map"}
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={getGPS}
                  disabled={gettingLoc}
                  className="gap-1"
                >
                  {gettingLoc
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Navigation className="w-3 h-3" />}
                  {ar ? "موقعي" : "My GPS"}
                </Button>
              </div>

              <div
                ref={mapRef}
                className="w-full rounded-xl overflow-hidden border border-border"
                style={{ height: "220px" }}
              />

              {form.location_lat && form.location_lng && (
                <p className="text-xs font-mono text-emerald-700 mt-1" dir="ltr">
                  📍 {parseFloat(form.location_lat).toFixed(5)},
                  {parseFloat(form.location_lng).toFixed(5)}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {ar
                  ? "اضغط على الخريطة أو اسحب الـ Pin لتحديد موقع العميل"
                  : "Click on map or drag pin to set client location"}
              </p>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  {ar ? "وقت البداية *" : "Start Time *"}
                </label>
                <Input
                  type="datetime-local"
                  value={form.planned_start_time}
                  onChange={e => setForm(p => ({ ...p, planned_start_time: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  {ar ? "وقت النهاية *" : "End Time *"}
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
                rows={2}
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
                {ar ? "إرسال للمدير" : "Send to Manager"}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setShowRequest(false); mapInstanceRef.current = null; }}
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
