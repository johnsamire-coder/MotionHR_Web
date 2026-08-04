"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  MapPin, Loader2, Plus, Send, Clock,
  CheckCircle2, XCircle, Navigation,
  History, Building2, Calendar, Check,
  Search,
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

// ── Types ─────────────────────────────────────────
interface Visit {
  id: number;
  visit_type_display?: string;
  location_name: string;
  purpose: string;
  status: string;
  arrival_time?: string;
  arrival_date?: string;
  arrival_address?: string;
  departure_time?: string;
  duration_minutes?: number;
  is_active: boolean;
}

interface WorkLocation {
  id: number;
  name?: string;
  location_type?: string;
  location_type_display?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
}

interface AttStatus {
  worker_type?: string;
}

interface SearchResult { lat: string; lon: string; display_name: string }

const EGYPT_BOUNDS: [[number, number], [number, number]] = [[22.0, 24.7], [31.6, 36.9]];

const LOC_STATUS: Record<string, { label_ar: string; label_en: string; color: string }> = {
  approved: { label_ar: "معتمد",             label_en: "Approved", color: "bg-emerald-500/10 text-emerald-700" },
  pending:  { label_ar: "بانتظار الموافقة",  label_en: "Pending",  color: "bg-amber-500/10 text-amber-700" },
  rejected: { label_ar: "مرفوض",             label_en: "Rejected", color: "bg-red-500/10 text-red-700" },
};

function fmtMins(m?: number | null, ar = true) {
  if (!m || m <= 0) return "—";
  const h = Math.floor(m / 60), min = m % 60;
  if (h > 0) return ar ? `${h}س ${min}د` : `${h}h ${min}m`;
  return ar ? `${min}د` : `${min}m`;
}

export default function MyFieldVisitsPage() {
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";

  const [workerType, setWorkerType]       = useState("office");
  const [visits, setVisits]               = useState<Visit[]>([]);
  const [workLocations, setWorkLocations] = useState<WorkLocation[]>([]);
  const [loading, setLoading]             = useState(true);
  const [showPropose, setShowPropose]     = useState(false);
  const [proposeForm, setProposeForm]     = useState({ name: "", location_type: "client", address: "", notes: "", lat: "", lng: "" });
  const [submitting, setSubmitting]       = useState(false);
  const [gettingLoc, setGettingLoc]       = useState(false);
  const [searchQuery, setSearchQuery]     = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching]     = useState(false);

  const mapRef     = useRef<HTMLDivElement>(null);
  const mapInst    = useRef<unknown>(null);
  const markerRef  = useRef<unknown>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;
  const langH = ar ? "ar" : "en";

  const isFieldAssigned = workerType === "field_assigned";
  const isFieldFree     = workerType === "field_free";
  const isField         = isFieldAssigned || isFieldFree;

  // ── Load ─────────────────────────────────────────
  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: authH, "Accept-Language": langH };
      const [stRes, fvRes, locRes] = await Promise.all([
        fetch("/api/employee/status", { headers }),
        fetch("/api/employee/field-visits", { headers }),
        fetch("/api/employee/work-locations", { headers }),
      ]);
      const [stD, fvD, locD] = await Promise.all([stRes.json(), fvRes.json(), locRes.json()]);
      setWorkerType(stD?.worker_type || "office");
      setVisits(fvD?.visits || []);
      setWorkLocations(locD?.locations || []);
    } catch {
      toast.error(ar ? "فشل تحميل البيانات" : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token, ar, authH, langH]);

  useEffect(() => { load(); }, [load]);

  // ── Tab Logic ────────────────────────────────────
  const [tab, setTab] = useState<"history" | "locations">("history");

  // ── Map Init ─────────────────────────────────────
  const initMap = async () => {
    if (!mapRef.current || mapInst.current) return;
    try {
      await import("leaflet/dist/leaflet.css");
      const L = await import("leaflet");
      const center: [number, number] = [30.0444, 31.2357];
      const map = L.map(mapRef.current, {
        maxBounds: L.latLngBounds(EGYPT_BOUNDS[0], EGYPT_BOUNDS[1]),
        maxBoundsViscosity: 1.0,
        minZoom: 5,
      }).setView(center, 6);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);
      const marker = L.marker(center, { draggable: true }).addTo(map);
      const update = (lat: number, lng: number) => {
        setProposeForm(p => ({ ...p, lat: lat.toFixed(6), lng: lng.toFixed(6) }));
      };
      marker.on("dragend", () => {
        const pos = (marker as unknown as { getLatLng: () => { lat: number; lng: number } }).getLatLng();
        update(pos.lat, pos.lng);
      });
      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        (marker as unknown as { setLatLng: (p: [number, number]) => void }).setLatLng([e.latlng.lat, e.latlng.lng]);
        update(e.latlng.lat, e.latlng.lng);
      });
      mapInst.current = map;
      markerRef.current = marker;
    } catch (e) { console.error("Map error:", e); }
  };

  // ── Search ───────────────────────────────────────
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery)}`);
      const data: SearchResult[] = await res.json();
      setSearchResults(data || []);
      if (!data?.length) toast.error(ar ? "لم يتم إيجاد نتائج" : "No results found");
    } catch { toast.error(ar ? "فشل البحث" : "Search failed"); }
    finally { setIsSearching(false); }
  };

  const selectResult = (item: SearchResult) => {
    const lat = parseFloat(item.lat), lng = parseFloat(item.lon);
    setProposeForm(p => ({ ...p, lat: lat.toFixed(6), lng: lng.toFixed(6), address: item.display_name }));
    setSearchQuery("");
    setSearchResults([]);
    const map = mapInst.current as { setView: (p: [number, number], z: number) => void } | null;
    const mk = markerRef.current as { setLatLng: (p: [number, number]) => void } | null;
    if (map) map.setView([lat, lng], 15);
    if (mk) mk.setLatLng([lat, lng]);
  };

  // ── GPS ──────────────────────────────────────────
  const getGPS = async () => {
    setGettingLoc(true);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
      );
      const lat = pos.coords.latitude, lng = pos.coords.longitude;
      setProposeForm(p => ({ ...p, lat: lat.toFixed(6), lng: lng.toFixed(6) }));
      const map = mapInst.current as { setView: (p: [number, number], z: number) => void } | null;
      const mk = markerRef.current as { setLatLng: (p: [number, number]) => void } | null;
      if (map) map.setView([lat, lng], 15);
      if (mk) mk.setLatLng([lat, lng]);
      toast.success(ar ? "تم تحديد موقعك ✅" : "Location captured ✅");
    } catch { toast.error(ar ? "فشل تحديد الموقع" : "Location failed"); }
    finally { setGettingLoc(false); }
  };

  // ── Open Propose ─────────────────────────────────
  const openPropose = () => {
    setProposeForm({ name: "", location_type: "client", address: "", notes: "", lat: "", lng: "" });
    setSearchQuery(""); setSearchResults([]);
    mapInst.current = null; markerRef.current = null;
    setShowPropose(true);
    setTimeout(() => initMap(), 300);
  };

  // ── Submit Propose ───────────────────────────────
  const handlePropose = async () => {
    if (!proposeForm.lat || !proposeForm.lng) {
      toast.error(ar ? "يرجى تحديد الموقع على الخريطة" : "Please pin location on map");
      return;
    }
    setSubmitting(true);
    try {
      // اسم الموقع = العنوان من الخريطة
      const name = proposeForm.name || proposeForm.address || `${proposeForm.lat}, ${proposeForm.lng}`;
      const res = await fetch("/api/employee/work-locations", {
        method: "POST",
        headers: { Authorization: authH, "Content-Type": "application/json", "Accept-Language": langH },
        body: JSON.stringify({
          name,
          location_type: proposeForm.location_type,
          address: proposeForm.address,
          notes: proposeForm.notes,
          latitude: parseFloat(proposeForm.lat),
          longitude: parseFloat(proposeForm.lng),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        toast.success(ar ? "تم إرسال الاقتراح للمدير ✅" : "Proposal sent ✅");
        setShowPropose(false);
        mapInst.current = null;
        await load();
      } else {
        toast.error(data.message || (ar ? "فشل" : "Failed"));
      }
    } catch { toast.error(ar ? "خطأ" : "Error"); }
    finally { setSubmitting(false); }
  };

  // ── Visit Date Groups ────────────────────────────
  const groupByDate = (visits: Visit[]) => {
    const groups: Record<string, Visit[]> = {};
    visits.forEach(v => {
      const date = v.arrival_date || "unknown";
      if (!groups[date]) groups[date] = [];
      groups[date].push(v);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  };

  const fmtDateLabel = (d: string) => {
    if (d === new Date().toISOString().split("T")[0])
      return ar ? "اليوم" : "Today";
    return new Date(d).toLocaleDateString(ar ? "ar-EG" : "en-US", {
      weekday: "short", day: "numeric", month: "short", year: "numeric",
    });
  };

  const visitGroups = groupByDate(visits);

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
              ? isFieldAssigned
                ? "مواقعك المعتمدة وسجل زياراتك"
                : "سجل زياراتك الميدانية"
              : isFieldAssigned
                ? "Your approved locations and visit history"
                : "Your field visit history"}
          </p>
        </div>
        {tab === "locations" && isFieldAssigned && (
          <Button onClick={openPropose} className="gap-2 bg-brand-primary hover:bg-brand-secondary">
            <Plus className="w-4 h-4" />
            {ar ? "اقتراح موقع" : "Propose Location"}
          </Button>
        )}
      </div>

      {/* Tabs — only for field_assigned */}
      {isFieldAssigned && (
        <div className="flex gap-1 border-b">
          {[
            { key: "locations" as const, label: ar ? "مواقعي المعتمدة" : "My Locations", icon: Building2 },
            { key: "history" as const,   label: ar ? "سجل الزيارات"   : "Visit History", icon: History },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-3 px-3 text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
                tab === t.key
                  ? "border-brand-primary text-brand-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (

        // ─── Locations Tab (field_assigned only) ───────────
        tab === "locations" && isFieldAssigned ? (
          <div className="space-y-3">
            {workLocations.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Building2 className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="font-medium mb-2">
                    {ar ? "لا توجد مواقع معتمدة" : "No approved locations"}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {ar ? "اقترح موقع من الخريطة ليوافق عليه المدير" : "Propose from map for manager approval"}
                  </p>
                  <Button onClick={openPropose} className="gap-2">
                    <Plus className="w-4 h-4" />
                    {ar ? "اقتراح موقع" : "Propose"}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              workLocations.map(loc => {
                const sc = LOC_STATUS[loc.status || "pending"];
                return (
                  <Card key={loc.id} className="hover:shadow-md transition">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-brand-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{loc.name}</p>
                            {loc.location_type_display && (
                              <p className="text-xs text-muted-foreground">{loc.location_type_display}</p>
                            )}
                            {loc.address && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{loc.address}</p>
                            )}
                            {loc.latitude && loc.longitude && (
                              <p className="text-xs font-mono text-muted-foreground mt-0.5" dir="ltr">
                                📍 {Number(loc.latitude).toFixed(5)}, {Number(loc.longitude).toFixed(5)}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge className={`${sc.color} border-0 text-[10px] shrink-0`}>
                          {ar ? sc.label_ar : sc.label_en}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

        // ─── History Tab (both field types) ────────────────
        ) : (
          <div className="space-y-4">
            {visits.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <History className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {ar ? "لا يوجد سجل زيارات" : "No visit history"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ar
                      ? "ابدأ زيارة ميدانية من شاشة الحضور والانصراف"
                      : "Start a field visit from Attendance page"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              visitGroups.map(([date, dayVisits]) => (
                <div key={date}>
                  {/* Date Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-brand-primary" />
                    <h3 className="text-sm font-semibold">{fmtDateLabel(date)}</h3>
                    <Badge variant="outline" className="text-[10px]">
                      {dayVisits.length} {ar ? "زيارة" : "visits"}
                    </Badge>
                  </div>

                  {/* Visits */}
                  <div className="space-y-2">
                    {dayVisits.map(v => (
                      <Card key={v.id} className={`${v.is_active ? "border-blue-500/30 bg-blue-500/5" : ""}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              {/* Type + Status */}
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                {v.is_active && (
                                  <span className="flex items-center gap-1 text-[10px] text-blue-700 font-semibold">
                                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                    {ar ? "نشطة" : "Active"}
                                  </span>
                                )}
                                <span className="text-xs font-medium text-muted-foreground">
                                  {v.visit_type_display}
                                </span>
                              </div>

                              {/* Time */}
                              <div className="flex items-center gap-2 text-sm font-mono mb-1">
                                <span className="text-emerald-700">{v.arrival_time || "—"}</span>
                                <span className="text-muted-foreground">→</span>
                                <span className="text-red-700">{v.departure_time || (v.is_active ? (ar ? "..." : "...") : "—")}</span>
                                {v.duration_minutes != null && v.duration_minutes > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    ({fmtMins(v.duration_minutes, ar)})
                                  </span>
                                )}
                              </div>

                              {/* Location */}
                              {v.arrival_address && (
                                <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                  <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-brand-primary" />
                                  <span className="line-clamp-1">{v.arrival_address}</span>
                                </div>
                              )}

                              {/* Purpose — for field_free only */}
                              {isFieldFree && v.purpose && (
                                <p className="text-xs text-brand-primary mt-1">
                                  {ar ? "الغرض" : "Purpose"}: {v.purpose}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )
      )}

      {/* ══ Propose Location Dialog (field_assigned only) ══ */}
      <Dialog open={showPropose} onOpenChange={v => { if (!v) { setShowPropose(false); mapInst.current = null; } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-primary" />
              {ar ? "اقتراح موقع جديد" : "Propose New Location"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">

            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              {ar
                ? "حدد الموقع على الخريطة أو ابحث عنه — سيتم إرساله للمدير للموافقة"
                : "Pin location on map or search — it will be sent to manager for approval"}
            </p>

            {/* Search */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={ar ? "ابحث عن مكان في مصر..." : "Search in Egypt..."}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  className="pr-9"
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching} variant="secondary" className="shrink-0">
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : ar ? "بحث" : "Search"}
              </Button>
              <Button onClick={getGPS} disabled={gettingLoc} variant="outline" className="shrink-0 gap-1">
                {gettingLoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                {ar ? "موقعي" : "GPS"}
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="border border-border rounded-lg max-h-36 overflow-y-auto bg-background shadow-sm">
                {searchResults.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => selectResult(item)}
                    className="p-2.5 text-sm border-b last:border-0 hover:bg-brand-primary/5 cursor-pointer flex items-start gap-2 transition"
                  >
                    <MapPin className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{item.display_name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Map */}
            <div ref={mapRef} className="w-full rounded-xl overflow-hidden border border-border" style={{ height: "250px" }} />
            <p className="text-xs text-muted-foreground">
              {ar ? "اضغط على الخريطة أو اسحب الـ Pin لتحديد الموقع" : "Click map or drag pin to set location"}
            </p>

            {/* Selected */}
            {proposeForm.lat && proposeForm.lng && (
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                {proposeForm.address && (
                  <div className="flex items-center gap-1.5 text-sm text-emerald-800 font-medium mb-1">
                    <Check className="w-4 h-4" />
                    <span className="line-clamp-1">{proposeForm.address}</span>
                  </div>
                )}
                <p className="text-xs font-mono text-emerald-700" dir="ltr">
                  📍 {proposeForm.lat}, {proposeForm.lng}
                </p>
              </div>
            )}

            {/* Type */}
            <div>
              <label className="text-sm font-medium mb-1 block">{ar ? "نوع الموقع" : "Type"}</label>
              <select
                value={proposeForm.location_type}
                onChange={e => setProposeForm(p => ({ ...p, location_type: e.target.value }))}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="client">{ar ? "عميل" : "Client"}</option>
                <option value="supplier">{ar ? "مورد" : "Supplier"}</option>
                <option value="site">{ar ? "موقع عمل" : "Work Site"}</option>
                <option value="office">{ar ? "مكتب" : "Office"}</option>
                <option value="other">{ar ? "أخرى" : "Other"}</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium mb-1 block">{ar ? "ملاحظات" : "Notes"}</label>
              <textarea
                value={proposeForm.notes}
                onChange={e => setProposeForm(p => ({ ...p, notes: e.target.value }))}
                rows={2}
                placeholder={ar ? "أي تفاصيل إضافية..." : "Additional details..."}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button onClick={handlePropose} disabled={submitting} className="flex-1 bg-brand-primary hover:bg-brand-secondary gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {ar ? "إرسال للمدير" : "Send to Manager"}
              </Button>
              <Button variant="outline" onClick={() => { setShowPropose(false); mapInst.current = null; }} className="flex-1">
                {ar ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
