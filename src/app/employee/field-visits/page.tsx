"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  MapPin, Loader2, Plus, Send, Clock,
  CheckCircle2, XCircle, Navigation, Building2,
  Play, Square, Camera,
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

interface WorkLocation {
  id: number;
  name?: string;
  location_type?: string;
  location_type_display?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
  notes?: string;
  visit_count?: number;
}

interface LocationType {
  value: string;
  label: string;
  label_en?: string;
}

const EMPTY_FORM = {
  name: "",
  location_type: "client",
  address: "",
  notes: "",
  latitude: "",
  longitude: "",
};

const STATUS_CONFIG: Record<string, { label_ar: string; label_en: string; color: string }> = {
  approved: { label_ar: "معتمد",          label_en: "Approved", color: "bg-emerald-500/10 text-emerald-700" },
  pending:  { label_ar: "بانتظار الموافقة", label_en: "Pending",  color: "bg-amber-500/10 text-amber-700" },
  rejected: { label_ar: "مرفوض",          label_en: "Rejected", color: "bg-red-500/10 text-red-700" },
};

export default function MyFieldVisitsPage() {
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";

  const [locations, setLocations]   = useState<WorkLocation[]>([]);
  const [locTypes, setLocTypes]     = useState<LocationType[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm]             = useState({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [gettingLoc, setGettingLoc] = useState(false);
  const mapRef                      = useRef<HTMLDivElement>(null);
  const mapInstanceRef              = useRef<unknown>(null);
  const markerRef                   = useRef<unknown>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;
  const langHeader = ar ? "ar" : "en";

  // ── Load Data ────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [locsRes, typesRes] = await Promise.all([
        fetch("/api/employee/work-locations", {
          headers: { Authorization: authHeader, "Accept-Language": langHeader },
        }),
        fetch("/api/employee/work-locations?types=true", {
          headers: { Authorization: authHeader, "Accept-Language": langHeader },
        }),
      ]);
      const [locsData, typesData] = await Promise.all([locsRes.json(), typesRes.json()]);
      setLocations(locsData?.locations || []);
      setLocTypes(typesData?.types || [
        { value: "client",  label: ar ? "عميل"      : "Client"      },
        { value: "office",  label: ar ? "مكتب"      : "Office"      },
        { value: "site",    label: ar ? "موقع عمل"  : "Work Site"   },
        { value: "branch",  label: ar ? "فرع"       : "Branch"      },
        { value: "other",   label: ar ? "أخرى"      : "Other"       },
      ]);
    } catch {
      toast.error(ar ? "فشل تحميل البيانات" : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token, ar]);

  useEffect(() => { load(); }, [load]);

  // ── Init Map in Dialog ───────────────────────────────────
  const initMap = async (lat = 30.0444, lng = 31.2357) => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) return;

    try {
      await import("leaflet/dist/leaflet.css");
      const L = await import("leaflet");

      const map = L.map(mapRef.current).setView([lat, lng], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);

      marker.on("dragend", () => {
        const pos = (marker as { getLatLng: () => { lat: number; lng: number } }).getLatLng();
        setForm(p => ({
          ...p,
          latitude: String(pos.lat.toFixed(6)),
          longitude: String(pos.lng.toFixed(6)),
        }));
      });

      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        (marker as { setLatLng: (pos: [number, number]) => void }).setLatLng([e.latlng.lat, e.latlng.lng]);
        setForm(p => ({
          ...p,
          latitude: String(e.latlng.lat.toFixed(6)),
          longitude: String(e.latlng.lng.toFixed(6)),
        }));
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      setForm(p => ({
        ...p,
        latitude: String(lat.toFixed(6)),
        longitude: String(lng.toFixed(6)),
      }));
    } catch (e) {
      console.error("Map init error:", e);
    }
  };

  // ── Open Dialog + Init Map ───────────────────────────────
  const openDialog = () => {
    setForm({ ...EMPTY_FORM });
    mapInstanceRef.current = null;
    markerRef.current = null;
    setShowDialog(true);
    setTimeout(() => initMap(), 300);
  };

  // ── Get GPS Location ─────────────────────────────────────
  const getGPS = async () => {
    setGettingLoc(true);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
      );
      const { latitude: lat, longitude: lng } = pos.coords;
      setForm(p => ({
        ...p,
        latitude: String(lat.toFixed(6)),
        longitude: String(lng.toFixed(6)),
      }));

      const map = mapInstanceRef.current as {
        setView: (pos: [number, number], zoom: number) => void
      } | null;
      const marker = markerRef.current as {
        setLatLng: (pos: [number, number]) => void
      } | null;

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
    if (!form.name) {
      toast.error(ar ? "اسم الموقع مطلوب" : "Location name is required");
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        location_type: form.location_type,
        address: form.address,
        notes: form.notes,
      };
      if (form.latitude && form.longitude) {
        payload.latitude = parseFloat(form.latitude);
        payload.longitude = parseFloat(form.longitude);
      }

      const res = await fetch("/api/employee/work-locations", {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
          "Accept-Language": langHeader,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success !== false) {
        toast.success(ar ? "تم إرسال الاقتراح للمدير ✅" : "Proposal sent to manager ✅");
        setShowDialog(false);
        setForm({ ...EMPTY_FORM });
        mapInstanceRef.current = null;
        await load();
      } else {
        toast.error(data.message || data.error || (ar ? "فشل" : "Failed"));
      }
    } catch {
      toast.error(ar ? "خطأ في الشبكة" : "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusInfo = (s?: string) =>
    STATUS_CONFIG[s || "pending"] || STATUS_CONFIG.pending;

  const stats = {
    total:    locations.length,
    approved: locations.filter(l => l.status === "approved").length,
    pending:  locations.filter(l => l.status === "pending").length,
    rejected: locations.filter(l => l.status === "rejected").length,
  };

  return (
    <div className="space-y-6 pb-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {ar ? "زياراتي الميدانية" : "My Field Visits"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {ar
              ? "مواقع عملك الميدانية — اقترح مواقع للمدير ليوافق عليها"
              : "Your field work locations — propose locations for manager approval"}
          </p>
        </div>
        <Button
          onClick={openDialog}
          className="gap-2 bg-brand-primary hover:bg-brand-secondary"
        >
          <Plus className="w-4 h-4" />
          {ar ? "اقتراح موقع جديد" : "Propose Location"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: ar ? "الكل"     : "Total",    value: stats.total,    color: "text-brand-primary bg-brand-primary/10", icon: MapPin },
          { label: ar ? "معتمدة"  : "Approved", value: stats.approved, color: "text-emerald-700 bg-emerald-500/10",    icon: CheckCircle2 },
          { label: ar ? "معلقة"   : "Pending",  value: stats.pending,  color: "text-amber-700 bg-amber-500/10",        icon: Clock },
          { label: ar ? "مرفوضة" : "Rejected", value: stats.rejected, color: "text-red-700 bg-red-500/10",            icon: XCircle },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Card */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="p-4">
          <p className="text-sm text-blue-700 font-medium mb-1">
            {ar ? "كيف تعمل الزيارات الميدانية؟" : "How do field visits work?"}
          </p>
          <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
            <li>{ar ? "اقترح موقع عمل وحدد الـ GPS بدقة" : "Propose a location and set GPS accurately"}</li>
            <li>{ar ? "المدير يوافق على الموقع" : "Manager approves the location"}</li>
            <li>{ar ? "بعد الموافقة تقدر تسجل حضور من الموقع ده في الموبايل" : "After approval you can check-in from this location on mobile"}</li>
            <li>{ar ? "الموظف الميداني المحدد لازم يسجل حضور من موقعه المعتمد" : "Field-assigned employees must check-in from approved locations"}</li>
          </ul>
        </CardContent>
      </Card>

      {/* Locations List */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : locations.length === 0 ? (
        <Card>
          <CardContent className="py-24 text-center">
            <MapPin className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="font-medium mb-2">
              {ar ? "لا يوجد مواقع مقترحة" : "No locations proposed"}
            </p>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              {ar
                ? "اقترح موقع عمل وحدد الـ GPS على الخريطة ليوافق عليه المدير"
                : "Propose a work location and set GPS on the map for manager approval"}
            </p>
            <Button onClick={openDialog} className="gap-2">
              <Plus className="w-4 h-4" />
              {ar ? "اقتراح موقع" : "Propose Location"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {locations.map(loc => {
            const sc = getStatusInfo(loc.status);
            return (
              <Card key={loc.id} className="hover:shadow-md transition">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-brand-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{loc.name}</p>
                        {loc.location_type_display && (
                          <Badge variant="outline" className="mt-1 text-[10px]">
                            {loc.location_type_display}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge className={`${sc.color} border-0 text-[10px]`}>
                      {ar ? sc.label_ar : sc.label_en}
                    </Badge>
                  </div>

                  {loc.address && (
                    <p className="text-sm text-muted-foreground mb-2">
                      📍 {loc.address}
                    </p>
                  )}

                  {loc.latitude && loc.longitude && (
                    <p className="text-xs font-mono text-muted-foreground" dir="ltr">
                      {Number(loc.latitude).toFixed(5)}, {Number(loc.longitude).toFixed(5)}
                    </p>
                  )}

                  {loc.visit_count !== undefined && loc.visit_count > 0 && (
                    <div className="mt-3 pt-3 border-t flex items-center gap-1 text-sm text-muted-foreground">
                      <Navigation className="w-3.5 h-3.5" />
                      <span>
                        {loc.visit_count} {ar ? "زيارة" : "visits"}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Propose Location Dialog ── */}
      <Dialog
        open={showDialog}
        onOpenChange={v => {
          if (!v) { setShowDialog(false); mapInstanceRef.current = null; }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-primary" />
              {ar ? "اقتراح موقع جديد" : "Propose New Location"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Name + Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  {ar ? "اسم الموقع *" : "Location Name *"}
                </label>
                <Input
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder={ar ? "مثال: مكتب العميل أحمد" : "e.g. Client Ahmed Office"}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  {ar ? "نوع الموقع" : "Location Type"}
                </label>
                <select
                  value={form.location_type}
                  onChange={e => setForm(p => ({ ...p, location_type: e.target.value }))}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                >
                  {locTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                {ar ? "العنوان" : "Address"}
              </label>
              <Input
                value={form.address}
                onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                placeholder={ar ? "العنوان التفصيلي" : "Detailed address"}
              />
            </div>

            {/* Map */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">
                  {ar ? "حدد الموقع على الخريطة *" : "Pin Location on Map *"}
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
                  {ar ? "موقعي الحالي" : "My Location"}
                </Button>
              </div>

              {/* Leaflet Map */}
              <div
                ref={mapRef}
                className="w-full rounded-xl overflow-hidden border border-border"
                style={{ height: "280px" }}
              />

              {/* Coordinates */}
              {form.latitude && form.longitude && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <p className="text-xs font-mono text-muted-foreground" dir="ltr">
                    {parseFloat(form.latitude).toFixed(5)}, {parseFloat(form.longitude).toFixed(5)}
                  </p>
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-1">
                {ar
                  ? "اضغط على الخريطة أو اسحب الـ Pin لتحديد الموقع بدقة"
                  : "Click on map or drag the pin to set exact location"}
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                {ar ? "ملاحظات" : "Notes"}
              </label>
              <textarea
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                rows={2}
                placeholder={ar ? "أي معلومات إضافية..." : "Additional info..."}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSubmit}
                disabled={submitting || !form.name}
                className="flex-1 bg-brand-primary hover:bg-brand-secondary gap-2"
              >
                {submitting
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />}
                {ar ? "إرسال للمدير" : "Send to Manager"}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setShowDialog(false); mapInstanceRef.current = null; }}
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
