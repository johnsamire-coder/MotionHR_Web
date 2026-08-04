"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { MapPin, Loader2, RefreshCw, Users, Wifi, WifiOff, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface LiveEmployee {
  employee_id: number;
  employee_name: string;
  employee_code: string;
  latitude: number;
  longitude: number;
  last_update?: string;
  accuracy?: number;
  speed?: number;
  status?: string;
}

export default function ManagerLocationsPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);

  const [employees, setEmployees] = useState<LiveEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LiveEmployee | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markersRef = useRef<Map<number, unknown>>(new Map());

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  const loadData = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/manager/live-locations", {
        headers: { Authorization: authHeader },
      });
      const data = await res.json();
      const emps = Array.isArray(data?.employees) ? data.employees : (Array.isArray(data) ? data : []);
      setEmployees(Array.isArray(emps) ? emps : []);
      setLastUpdate(new Date());
      if (emps.length > 0) updateMapMarkers(emps);
    } catch {
      toast.error(d.failedLoad);
    } finally {
      setLoading(false);
    }
  };

  const updateMapMarkers = (emps: LiveEmployee[]) => {
    if (!mapInstanceRef.current) return;
    const L = (window as { L?: unknown }).L as {
      marker: (pos: [number, number], opts?: unknown) => {
        addTo: (m: unknown) => unknown;
        bindPopup: (html: string) => unknown;
        setLatLng: (pos: [number, number]) => void;
      };
      divIcon: (opts: unknown) => unknown;
    };
    if (!L) return;

    emps.forEach(emp => {
      const icon = L.divIcon({
        html: `<div style="
          width:36px;height:36px;border-radius:50%;
          background:#1A1B4B;border:3px solid #00D4A0;
          display:flex;align-items:center;justify-content:center;
          color:white;font-weight:bold;font-size:14px;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
        ">${emp.employee_name?.[0] || "?"}</div>`,
        className: "",
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      if (markersRef.current.has(emp.employee_id)) {
        const marker = markersRef.current.get(emp.employee_id) as {
          setLatLng: (pos: [number, number]) => void
        };
        marker.setLatLng([emp.latitude, emp.longitude]);
      } else {
        const marker = L.marker([emp.latitude, emp.longitude], { icon })
          .addTo(mapInstanceRef.current);
        (marker as { bindPopup: (html: string) => unknown }).bindPopup(
          `<b>${emp.employee_name}</b><br/>${emp.employee_code}`
        );
        markersRef.current.set(emp.employee_id, marker);
      }
    });
  };

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current || mapInstanceRef.current) return;
      await import("leaflet/dist/leaflet.css");
      const L = await import("leaflet");

      const center: [number, number] = employees.length > 0
        ? [employees[0].latitude, employees[0].longitude]
        : [30.0444, 31.2357];

      const map = L.map(mapRef.current, { zoomControl: true }).setView(center, 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      mapInstanceRef.current = map;
      if (employees.length > 0) updateMapMarkers(employees);
    };

    initMap();
  }, []);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const focusOnEmployee = (emp: LiveEmployee) => {
    setSelected(emp);
    const map = mapInstanceRef.current as {
      setView: (pos: [number, number], zoom: number) => void
    } | null;
    if (map) {
      map.setView([emp.latitude, emp.longitude], 16);
    }
  };

  const fmtTime = (t?: string) => {
    if (!t) return "—";
    return new Date(t).toLocaleTimeString(lang === "ar" ? "ar-EG" : "en-US", {
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {lang === "ar" ? "المواقع المباشرة" : "Live Locations"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {lang === "ar" ? "تتبع فريقك على الخريطة" : "Track your team in real-time"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="sm"
            onClick={() => setAutoRefresh(p => !p)}
            className={`gap-2 ${autoRefresh ? "border-emerald-500 text-emerald-700" : ""}`}
          >
            {autoRefresh ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {lang === "ar" ? (autoRefresh ? "تحديث تلقائي" : "إيقاف") : (autoRefresh ? "Auto" : "Manual")}
          </Button>
          <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            {lang === "ar" ? "تحديث" : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-brand-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {lang === "ar" ? "موظفين يُتتبعون" : "Tracked Employees"}
              </p>
              <p className="text-xl font-bold">{employees.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {lang === "ar" ? "آخر تحديث" : "Last Update"}
              </p>
              <p className="text-sm font-semibold">
                {lastUpdate ? fmtTime(lastUpdate.toISOString()) : "—"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              autoRefresh ? "bg-emerald-500/10" : "bg-slate-100"
            }`}>
              <div className={`w-3 h-3 rounded-full ${autoRefresh ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {lang === "ar" ? "الحالة" : "Status"}
              </p>
              <p className="text-sm font-semibold">
                {autoRefresh
                  ? (lang === "ar" ? "مباشر" : "Live")
                  : (lang === "ar" ? "متوقف" : "Paused")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: "600px" }}>
        {/* Employees List */}
        <Card className="overflow-hidden">
          <CardContent className="p-0 h-full flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-semibold">{lang === "ar" ? "الفريق" : "Team"}</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : employees.length === 0 ? (
                <div className="p-6 text-center">
                  <MapPin className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {lang === "ar" ? "لا يوجد مواقع" : "No locations"}
                  </p>
                </div>
              ) : (
                employees.map(emp => (
                  <div
                    key={emp.employee_id}
                    onClick={() => focusOnEmployee(emp)}
                    className={`p-4 border-b cursor-pointer transition hover:bg-muted/50 ${
                      selected?.employee_id === emp.employee_id ? "bg-brand-primary/5 border-r-4 border-r-brand-primary" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-brand-primary/10 text-brand-primary">
                            {emp.employee_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{emp.employee_name}</p>
                        <p className="text-xs text-muted-foreground">{emp.employee_code}</p>
                        {emp.last_update && (
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {fmtTime(emp.last_update)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Map */}
        <Card className="lg:col-span-2 overflow-hidden">
          <div ref={mapRef} className="w-full h-full" style={{ minHeight: "500px" }} />
        </Card>
      </div>
    </div>
  );
}

