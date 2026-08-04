"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  Briefcase, Plus, Loader2, MapPin, Calendar,
  User, Phone, CheckCircle2, XCircle, Clock,
  Send, Navigation, Search, Check, Eye, X,
  Users as UsersIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

// ── Types ─────────────────────────────────────────
interface Mission {
  id: number;
  title: string;
  description?: string;
  status: string;
  status_display: string;
  source?: string;
  priority?: string;
  priority_display?: string;
  location_name?: string;
  location_lat?: string;
  location_lng?: string;
  client_name?: string;
  client_phone?: string;
  planned_start_time?: string;
  planned_end_time?: string;
  created_at?: string;
  assignments?: Assignment[];
  has_feedback?: boolean;
}

interface Assignment {
  id: number;
  employee_id?: number;
  employee_name?: string;
  role_in_mission?: string;
  is_lead?: boolean;
  status?: string;
}

interface TeamMember {
  id: number;
  employee_code: string;
  full_name: string;
  job_title?: string;
  department?: string;
  phone?: string;
}

interface SearchResult { lat: string; lon: string; display_name: string }

const STATUS_CONFIG: Record<string, {
  color: string; bg: string; label_ar: string; label_en: string;
}> = {
  pending_approval: { color: "text-amber-700",   bg: "bg-amber-500/10",   label_ar: "في انتظار الموافقة", label_en: "Awaiting Approval" },
  approved:         { color: "text-emerald-700", bg: "bg-emerald-500/10", label_ar: "معتمد",              label_en: "Approved" },
  active:           { color: "text-blue-700",    bg: "bg-blue-500/10",    label_ar: "نشط",                label_en: "Active" },
  completed:        { color: "text-slate-600",   bg: "bg-slate-100",      label_ar: "منتهي",              label_en: "Completed" },
  cancelled:        { color: "text-red-700",     bg: "bg-red-500/10",     label_ar: "ملغي",               label_en: "Cancelled" },
};

const EGYPT_CENTER: [number, number] = [30.0444, 31.2357];
const EGYPT_BOUNDS: [[number, number], [number, number]] = [[22.0, 24.7], [31.6, 36.9]];

const EMPTY_CREATE = {
  title: "",
  description: "",
  client_name: "",
  client_phone: "",
  location_name: "",
  lat: "",
  lng: "",
  start_date: "",
  start_time: "",
  end_date: "",
  end_time: "",
  priority: "normal",
  employee_ids: [] as number[],
};

export default function ManagerMissionsPage() {
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";

  const [missions, setMissions]         = useState<Mission[]>([]);
  const [team, setTeam]                 = useState<TeamMember[]>([]);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState<"pending" | "active" | "completed">("pending");

  const [viewMission, setViewMission]   = useState<Mission | null>(null);
  const [showCreate, setShowCreate]     = useState(false);
  const [createForm, setCreateForm]     = useState({ ...EMPTY_CREATE });

  const [submitting, setSubmitting]     = useState(false);
  const [approvingId, setApprovingId]   = useState<number | null>(null);
  const [gettingLoc, setGettingLoc]     = useState(false);

  const [searchQuery, setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching]   = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");

  const mapRef        = useRef<HTMLDivElement>(null);
  const mapInst       = useRef<unknown>(null);
  const markerRef     = useRef<unknown>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;
  const langH = ar ? "ar" : "en";

  // ── Load ─────────────────────────────────────────
  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: authH, "Accept-Language": langH };
      const [misRes, teamRes] = await Promise.all([
        fetch("/api/manager/missions", { headers }),
        fetch("/api/manager/team-simple", { headers }),
      ]);
      const [misData, teamData] = await Promise.all([misRes.json(), teamRes.json()]);
      setMissions(Array.isArray(misData?.missions) ? misData.missions : []);
      setTeam(Array.isArray(teamData?.employees) ? teamData.employees : []);
    } catch {
      toast.error(ar ? "فشل تحميل البيانات" : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token, ar, authH, langH]);

  useEffect(() => { load(); }, [load]);

  // ── Approve / Reject ─────────────────────────────
  const handleAction = async (missionId: number, action: "approve" | "reject") => {
    setApprovingId(missionId);
    try {
      // نجيب الـ mission request id من الـ mission
      // الـ mission نفسه ما فيهوش request_id فبنستخدم missionId كمرجع
      // الـ backend بيبحث بالـ mission
      const res = await fetch("/api/manager/mission-approve", {
        method: "POST",
        headers: { Authorization: authH, "Content-Type": "application/json", "Accept-Language": langH },
        body: JSON.stringify({ request_id: missionId, action }),
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        toast.success(action === "approve"
          ? (ar ? "تم قبول المهمة ✅" : "Mission approved ✅")
          : (ar ? "تم رفض المهمة" : "Mission rejected"));
        setViewMission(null);
        await load();
      } else {
        toast.error(data.message || data.error || (ar ? "فشل" : "Failed"));
      }
    } catch { toast.error(ar ? "خطأ" : "Error"); }
    finally { setApprovingId(null); }
  };

  // ── Create Mission ───────────────────────────────
  const initMap = async () => {
    if (!mapRef.current || mapInst.current) return;
    try {
      await import("leaflet/dist/leaflet.css");
      const L = await import("leaflet");
      const map = L.map(mapRef.current, {
        maxBounds: L.latLngBounds(EGYPT_BOUNDS[0], EGYPT_BOUNDS[1]),
        maxBoundsViscosity: 1.0,
        minZoom: 5,
      }).setView(EGYPT_CENTER, 6);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);
      const marker = L.marker(EGYPT_CENTER, { draggable: true }).addTo(map);
      const update = (lat: number, lng: number) => {
        setCreateForm(p => ({ ...p, lat: lat.toFixed(6), lng: lng.toFixed(6) }));
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
    } catch (e) { console.error(e); }
  };

  const openCreate = () => {
    setCreateForm({ ...EMPTY_CREATE });
    setSearchQuery(""); setSearchResults([]); setEmployeeSearch("");
    mapInst.current = null; markerRef.current = null;
    setShowCreate(true);
    setTimeout(() => initMap(), 300);
  };

  const doSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery)}`);
      const data: SearchResult[] = await res.json();
      setSearchResults(data || []);
      if (!data?.length) toast.error(ar ? "لم يتم إيجاد نتائج" : "No results");
    } catch { toast.error(ar ? "فشل البحث" : "Search failed"); }
    finally { setIsSearching(false); }
  };

  const selectResult = (item: SearchResult) => {
    const lat = parseFloat(item.lat), lng = parseFloat(item.lon);
    setCreateForm(p => ({
      ...p,
      lat: lat.toFixed(6),
      lng: lng.toFixed(6),
      location_name: item.display_name,
    }));
    setSearchQuery(""); setSearchResults([]);
    const map = mapInst.current as { setView: (p: [number, number], z: number) => void } | null;
    const mk  = markerRef.current as { setLatLng: (p: [number, number]) => void } | null;
    if (map) map.setView([lat, lng], 15);
    if (mk)  mk.setLatLng([lat, lng]);
  };

  const getGPS = async () => {
    setGettingLoc(true);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
      );
      const lat = pos.coords.latitude, lng = pos.coords.longitude;
      setCreateForm(p => ({ ...p, lat: lat.toFixed(6), lng: lng.toFixed(6) }));
      const map = mapInst.current as { setView: (p: [number, number], z: number) => void } | null;
      const mk  = markerRef.current as { setLatLng: (p: [number, number]) => void } | null;
      if (map) map.setView([lat, lng], 15);
      if (mk)  mk.setLatLng([lat, lng]);
      toast.success(ar ? "تم تحديد موقعك ✅" : "Location captured ✅");
    } catch { toast.error(ar ? "فشل" : "Failed"); }
    finally { setGettingLoc(false); }
  };

  const toggleEmployee = (id: number) => {
    setCreateForm(p => ({
      ...p,
      employee_ids: p.employee_ids.includes(id)
        ? p.employee_ids.filter(x => x !== id)
        : [...p.employee_ids, id],
    }));
  };

  const handleCreate = async () => {
    if (!createForm.title) {
      toast.error(ar ? "عنوان المهمة مطلوب" : "Title is required");
      return;
    }
    if (createForm.employee_ids.length === 0) {
      toast.error(ar ? "اختر موظف واحد على الأقل" : "Select at least one employee");
      return;
    }
    if (!createForm.start_date || !createForm.start_time || !createForm.end_date || !createForm.end_time) {
      toast.error(ar ? "التاريخ والوقت مطلوبين" : "Date and time required");
      return;
    }
    if (!createForm.lat || !createForm.lng) {
      toast.error(ar ? "الموقع مطلوب" : "Location required");
      return;
    }

    setSubmitting(true);
    try {
      const startDT = `${createForm.start_date}T${createForm.start_time}:00`;
      const endDT   = `${createForm.end_date}T${createForm.end_time}:00`;

      const payload = {
        title: createForm.title,
        description: createForm.description,
        client_name: createForm.client_name,
        client_phone: createForm.client_phone,
        location_name: createForm.location_name,
        location_lat: parseFloat(createForm.lat),
        location_lng: parseFloat(createForm.lng),
        planned_start_time: startDT,
        planned_end_time: endDT,
        priority: createForm.priority,
        employee_ids: createForm.employee_ids,
      };

      const res = await fetch("/api/manager/missions", {
        method: "POST",
        headers: { Authorization: authH, "Content-Type": "application/json", "Accept-Language": langH },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        toast.success(ar ? "تم إنشاء المهمة ✅" : "Mission created ✅");
        setShowCreate(false);
        mapInst.current = null;
        await load();
      } else {
        toast.error(data.message || data.error || (ar ? "فشل" : "Failed"));
      }
    } catch { toast.error(ar ? "خطأ" : "Error"); }
    finally { setSubmitting(false); }
  };

  // ── Filters ──────────────────────────────────────
  const pending   = missions.filter(m => m.status === "pending_approval");
  const active    = missions.filter(m => ["approved", "active"].includes(m.status));
  const completed = missions.filter(m => ["completed", "cancelled"].includes(m.status));

  const currentList = tab === "pending" ? pending : tab === "active" ? active : completed;

  const fmtDT = (dt?: string) => {
    if (!dt) return "—";
    return new Date(dt).toLocaleString(ar ? "ar-EG" : "en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const filteredTeam = team.filter(t =>
    !employeeSearch ||
    t.full_name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    t.employee_code.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {ar ? "مهمات الفريق" : "Team Missions"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {ar ? "إدارة مهمات فريقك واعتماد الطلبات" : "Manage team missions and approve requests"}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-brand-primary hover:bg-brand-secondary">
          <Plus className="w-4 h-4" />
          {ar ? "إنشاء مهمة" : "Create Mission"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {[
          { key: "pending" as const,   label: ar ? "معلق"   : "Pending",   count: pending.length,   color: "text-amber-700" },
          { key: "active" as const,    label: ar ? "نشط"    : "Active",    count: active.length,    color: "text-emerald-700" },
          { key: "completed" as const, label: ar ? "منتهي" : "Completed", count: completed.length, color: "text-slate-600" },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-3 px-3 text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              tab === t.key
                ? `border-brand-primary ${t.color}`
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <Badge className="bg-muted text-muted-foreground border-0 text-[10px]">{t.count}</Badge>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : currentList.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Briefcase className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {ar ? "لا توجد مهمات" : "No missions"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {currentList.map(m => {
            const sc = STATUS_CONFIG[m.status] || STATUS_CONFIG.pending_approval;
            const isPending = m.status === "pending_approval";
            return (
              <Card
                key={m.id}
                onClick={() => setViewMission(m)}
                className="hover:shadow-md transition cursor-pointer"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold">{m.title}</p>
                        <Badge className={`${sc.bg} ${sc.color} border-0 text-[10px]`}>
                          {ar ? sc.label_ar : sc.label_en}
                        </Badge>
                        {m.source === "employee_request" && (
                          <Badge variant="outline" className="text-[10px]">
                            {ar ? "طلب موظف" : "Employee Request"}
                          </Badge>
                        )}
                      </div>
                      {m.client_name && (
                        <p className="text-sm text-muted-foreground">
                          {ar ? "العميل" : "Client"}: {m.client_name}
                        </p>
                      )}
                    </div>
                    {isPending && (
                      <Eye className="w-4 h-4 text-brand-primary shrink-0" />
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mt-2">
                    {m.location_name && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{m.location_name}</span>
                      </div>
                    )}
                    {m.planned_start_time && (
                      <div className="flex items-center gap-1.5" dir="ltr">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
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

      {/* ══ View Mission Dialog ══ */}
      <Dialog open={!!viewMission} onOpenChange={v => !v && setViewMission(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-brand-primary" />
              {viewMission?.title}
            </DialogTitle>
          </DialogHeader>

          {viewMission && (
            <div className="space-y-4 pt-2">

              {/* Status */}
              <div className="flex items-center gap-2 flex-wrap">
                {(() => {
                  const sc = STATUS_CONFIG[viewMission.status] || STATUS_CONFIG.pending_approval;
                  return (
                    <Badge className={`${sc.bg} ${sc.color} border-0`}>
                      {ar ? sc.label_ar : sc.label_en}
                    </Badge>
                  );
                })()}
                {viewMission.source === "employee_request" && (
                  <Badge variant="outline">
                    {ar ? "طلب من موظف" : "Employee Request"}
                  </Badge>
                )}
                {viewMission.priority_display && (
                  <Badge variant="secondary">{viewMission.priority_display}</Badge>
                )}
              </div>

              {/* Description */}
              {viewMission.description && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {ar ? "الوصف" : "Description"}
                  </p>
                  <p className="text-sm">{viewMission.description}</p>
                </div>
              )}

              {/* Client */}
              {(viewMission.client_name || viewMission.client_phone) && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {ar ? "بيانات العميل" : "Client Info"}
                  </p>
                  {viewMission.client_name && (
                    <p className="text-sm font-medium">
                      <User className="w-3.5 h-3.5 inline me-1" />
                      {viewMission.client_name}
                    </p>
                  )}
                  {viewMission.client_phone && (
                    <p className="text-sm font-mono" dir="ltr">
                      <Phone className="w-3.5 h-3.5 inline me-1" />
                      {viewMission.client_phone}
                    </p>
                  )}
                </div>
              )}

              {/* Location */}
              {viewMission.location_name && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {ar ? "الموقع" : "Location"}
                  </p>
                  <p className="text-sm flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 shrink-0 text-brand-primary mt-0.5" />
                    <span>{viewMission.location_name}</span>
                  </p>
                  {viewMission.location_lat && viewMission.location_lng && (
                    <p className="text-xs font-mono text-muted-foreground mt-1" dir="ltr">
                      {Number(viewMission.location_lat).toFixed(5)}, {Number(viewMission.location_lng).toFixed(5)}
                    </p>
                  )}
                </div>
              )}

              {/* Times */}
              {viewMission.planned_start_time && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {ar ? "التوقيت" : "Time"}
                  </p>
                  <p className="text-sm font-mono" dir="ltr">
                    <Calendar className="w-3.5 h-3.5 inline me-1" />
                    {fmtDT(viewMission.planned_start_time)} → {fmtDT(viewMission.planned_end_time)}
                  </p>
                </div>
              )}

              {/* Assignments */}
              {viewMission.assignments && viewMission.assignments.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {ar ? "الموظفين المكلفين" : "Assigned Employees"}
                  </p>
                  <div className="space-y-1">
                    {viewMission.assignments.map(a => (
                      <div key={a.id} className="flex items-center gap-2 text-sm">
                        <UsersIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{a.employee_name}</span>
                        {a.is_lead && <Badge className="bg-brand-primary/10 text-brand-primary border-0 text-[10px]">Lead</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {viewMission.status === "pending_approval" && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => handleAction(viewMission.id, "approve")}
                    disabled={approvingId === viewMission.id}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2"
                  >
                    {approvingId === viewMission.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <CheckCircle2 className="w-4 h-4" />}
                    {ar ? "قبول" : "Approve"}
                  </Button>
                  <Button
                    onClick={() => handleAction(viewMission.id, "reject")}
                    disabled={approvingId === viewMission.id}
                    variant="outline"
                    className="flex-1 border-red-500/30 text-red-700 hover:bg-red-50 gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    {ar ? "رفض" : "Reject"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ══ Create Mission Dialog ══ */}
      <Dialog open={showCreate} onOpenChange={v => { if (!v) { setShowCreate(false); mapInst.current = null; } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-brand-primary" />
              {ar ? "إنشاء مهمة جديدة" : "Create New Mission"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">

            {/* Title */}
            <div>
              <label className="text-sm font-medium mb-1 block">{ar ? "عنوان المهمة *" : "Title *"}</label>
              <Input
                value={createForm.title}
                onChange={e => setCreateForm(p => ({ ...p, title: e.target.value }))}
                placeholder={ar ? "مثال: زيارة عميل هام" : "e.g. Important client visit"}
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium mb-1 block">{ar ? "الوصف" : "Description"}</label>
              <textarea
                value={createForm.description}
                onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))}
                rows={2}
                placeholder={ar ? "تفاصيل المهمة..." : "Mission details..."}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background resize-none"
              />
            </div>

            {/* Client */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">{ar ? "اسم العميل" : "Client Name"}</label>
                <Input
                  value={createForm.client_name}
                  onChange={e => setCreateForm(p => ({ ...p, client_name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{ar ? "هاتف العميل" : "Client Phone"}</label>
                <Input
                  value={createForm.client_phone}
                  onChange={e => setCreateForm(p => ({ ...p, client_phone: e.target.value }))}
                  dir="ltr"
                />
              </div>
            </div>

            {/* Employees Multi-Select */}
            <div className="p-3 bg-brand-primary/5 border border-brand-primary/20 rounded-xl">
              <label className="text-sm font-semibold text-brand-primary mb-2 block flex items-center gap-2">
                <UsersIcon className="w-4 h-4" />
                {ar ? "اختر الموظفين *" : "Select Employees *"}
                {createForm.employee_ids.length > 0 && (
                  <Badge className="bg-brand-primary text-white border-0">
                    {createForm.employee_ids.length}
                  </Badge>
                )}
              </label>

              {/* Search employees */}
              <div className="relative mb-2">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={ar ? "ابحث بالاسم أو الكود..." : "Search by name or code..."}
                  value={employeeSearch}
                  onChange={e => setEmployeeSearch(e.target.value)}
                  className="pr-9"
                />
              </div>

              {/* Selected count */}
              {createForm.employee_ids.length > 0 && (
                <div className="flex items-center gap-1 mb-2 flex-wrap">
                  {createForm.employee_ids.map(id => {
                    const emp = team.find(t => t.id === id);
                    if (!emp) return null;
                    return (
                      <Badge key={id} className="bg-brand-primary text-white gap-1">
                        {emp.full_name}
                        <button onClick={() => toggleEmployee(id)}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}

              {/* Team list */}
              <div className="border border-border rounded-lg max-h-40 overflow-y-auto bg-background">
                {filteredTeam.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    {ar ? "لا يوجد موظفين" : "No employees"}
                  </p>
                ) : (
                  filteredTeam.map(t => {
                    const selected = createForm.employee_ids.includes(t.id);
                    return (
                      <div
                        key={t.id}
                        onClick={() => toggleEmployee(t.id)}
                        className={`p-2 border-b last:border-0 cursor-pointer flex items-center gap-2 transition ${
                          selected ? "bg-brand-primary/10" : "hover:bg-muted/50"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          selected ? "bg-brand-primary border-brand-primary" : "border-border"
                        }`}>
                          {selected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-[10px]">
                            {t.full_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{t.full_name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {t.employee_code} — {t.job_title || t.department}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="p-3 bg-brand-primary/5 border border-brand-primary/20 rounded-xl space-y-3">
              <p className="text-sm font-semibold text-brand-primary flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {ar ? "التاريخ والوقت *" : "Date & Time *"}
              </p>

              <div>
                <p className="text-xs text-muted-foreground mb-2">{ar ? "من:" : "From:"}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input type="date" value={createForm.start_date} onChange={e => setCreateForm(p => ({ ...p, start_date: e.target.value }))} />
                  <Input type="time" value={createForm.start_time} onChange={e => setCreateForm(p => ({ ...p, start_time: e.target.value }))} />
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">{ar ? "إلى:" : "To:"}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input type="date" value={createForm.end_date} onChange={e => setCreateForm(p => ({ ...p, end_date: e.target.value }))} />
                  <Input type="time" value={createForm.end_time} onChange={e => setCreateForm(p => ({ ...p, end_time: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-medium mb-2 block">{ar ? "موقع العميل *" : "Client Location *"}</label>

              <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={ar ? "ابحث عن مكان في مصر..." : "Search in Egypt..."}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && doSearch()}
                    className="pr-9"
                  />
                </div>
                <Button onClick={doSearch} disabled={isSearching} variant="secondary" className="shrink-0">
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : ar ? "بحث" : "Search"}
                </Button>
                <Button onClick={getGPS} disabled={gettingLoc} variant="outline" className="gap-1 shrink-0">
                  {gettingLoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                  {ar ? "GPS" : "GPS"}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="border border-border rounded-lg max-h-32 overflow-y-auto mb-2 bg-background">
                  {searchResults.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => selectResult(item)}
                      className="p-2 text-sm border-b last:border-0 hover:bg-brand-primary/5 cursor-pointer flex items-start gap-2"
                    >
                      <MapPin className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{item.display_name}</span>
                    </div>
                  ))}
                </div>
              )}

              <div ref={mapRef} className="w-full rounded-xl overflow-hidden border border-border" style={{ height: "220px" }} />

              {createForm.lat && createForm.lng && (
                <div className="mt-2 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <p className="text-xs font-mono text-emerald-700" dir="ltr">
                    {createForm.lat}, {createForm.lng}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleCreate}
                disabled={submitting}
                className="flex-1 bg-brand-primary hover:bg-brand-secondary gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {ar ? "إنشاء المهمة" : "Create Mission"}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setShowCreate(false); mapInst.current = null; }}
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
