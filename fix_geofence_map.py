import sys
sys.stdout.reconfigure(encoding='utf-8')
from pathlib import Path

# ═══════════════════════════════════════════════
# FILE 1: LocationPickerMap Component (with My Location button)
# ═══════════════════════════════════════════════
map_dir = Path("src/components/maps")
map_dir.mkdir(parents=True, exist_ok=True)

map_component = r'''"use client";

import { useEffect, useRef, useState } from "react";

interface LocationPickerMapProps {
  lat: number | null;
  lng: number | null;
  radius: number;
  onChange: (lat: number, lng: number) => void;
  height?: string;
  lang?: string;
}

export default function LocationPickerMap({
  lat,
  lng,
  radius,
  onChange,
  height = "400px",
  lang = "ar",
}: LocationPickerMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const [locating, setLocating] = useState(false);

  const defaultLat = lat || 30.0444;
  const defaultLng = lng || 31.2357;
  const ar = lang === "ar";

  const updatePosition = (newLat: number, newLng: number) => {
    if (markerRef.current) markerRef.current.setLatLng([newLat, newLng]);
    if (circleRef.current) circleRef.current.setLatLng([newLat, newLng]);
    if (mapInstanceRef.current) mapInstanceRef.current.setView([newLat, newLng], 16);
    onChange(newLat, newLng);
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      alert(ar ? "المتصفح لا يدعم تحديد الموقع" : "Browser doesn't support geolocation");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updatePosition(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      (err) => {
        console.error("Geolocation error:", err);
        alert(
          ar
            ? "فشل تحديد الموقع. تأكد من تفعيل الـ GPS والسماح للمتصفح"
            : "Failed to get location. Enable GPS and allow browser access"
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (mapInstanceRef.current) return;

    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    import("leaflet").then((L) => {
      if (!mapRef.current || mapInstanceRef.current) return;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current).setView([defaultLat, defaultLng], 15);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);
      markerRef.current = marker;

      const circle = L.circle([defaultLat, defaultLng], {
        radius: radius || 100,
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.15,
        weight: 2,
      }).addTo(map);
      circleRef.current = circle;

      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        circle.setLatLng([lat, lng]);
        onChange(lat, lng);
      });

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        circle.setLatLng([pos.lat, pos.lng]);
        onChange(pos.lat, pos.lng);
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (circleRef.current) circleRef.current.setRadius(radius || 100);
  }, [radius]);

  useEffect(() => {
    if (!lat || !lng) return;
    if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
    if (circleRef.current) circleRef.current.setLatLng([lat, lng]);
    if (mapInstanceRef.current) mapInstanceRef.current.setView([lat, lng], 15);
  }, [lat, lng]);

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={mapRef}
        style={{ height, width: "100%", borderRadius: "0.5rem", zIndex: 0 }}
        className="border border-border overflow-hidden"
      />
      {/* My Location Button */}
      <button
        type="button"
        onClick={handleMyLocation}
        disabled={locating}
        style={{
          position: "absolute",
          bottom: "20px",
          right: "12px",
          zIndex: 1000,
          width: "44px",
          height: "44px",
          borderRadius: "8px",
          border: "2px solid rgba(0,0,0,0.15)",
          backgroundColor: "white",
          cursor: locating ? "wait" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          transition: "all 0.2s",
        }}
        title={ar ? "موقعي الحالي" : "My current location"}
        onMouseEnter={(e) => {
          (e.target as HTMLElement).style.backgroundColor = "#f0f7ff";
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLElement).style.backgroundColor = "white";
        }}
      >
        {locating ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="animate-spin">
            <circle cx="12" cy="12" r="10" stroke="#3b82f6" strokeWidth="3" opacity="0.3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" fill="#4285F4" />
            <circle cx="12" cy="12" r="7" stroke="#4285F4" strokeWidth="2" fill="none" />
            <line x1="12" y1="1" x2="12" y2="5" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" />
            <line x1="12" y1="19" x2="12" y2="23" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" />
            <line x1="1" y1="12" x2="5" y2="12" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" />
            <line x1="19" y1="12" x2="23" y2="12" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>
    </div>
  );
}
'''

map_file = map_dir / "location-picker-map.tsx"
map_file.write_text(map_component, encoding="utf-8")
print(f"[OK] Map component with MyLocation button: {map_file.stat().st_size} bytes")

# ═══════════════════════════════════════════════
# FILE 2: Geofence Page
# ═══════════════════════════════════════════════
geo_file = Path("src/app/hr/geofence/page.tsx")

new_geo = '''"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { MapPin, Loader2, Save, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

const LocationPickerMap = dynamic(
  () => import("@/components/maps/location-picker-map"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[420px] border rounded-lg bg-muted/30">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">Loading map...</p>
        </div>
      </div>
    ),
  }
);

interface Geofence {
  latitude?: number | null;
  longitude?: number | null;
  radius?: number;
  enabled?: boolean;
  address?: string;
}

export default function GeofencePage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";

  const [geofence, setGeofence] = useState<Geofence>({
    latitude: null, longitude: null, radius: 100, enabled: false, address: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEYS.token) : null;
    if (!token) return;
    const authHeader = token.startsWith("Token") ? token : `Token ${token}`;

    fetch("/api/hr/geofence", { headers: { Authorization: authHeader } })
      .then((r) => r.json())
      .then((data) => setGeofence(data?.geofence || geofence))
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const token = typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEYS.token) : null;
    if (!token) return;
    const auth = token.startsWith("Token") ? token : `Token ${token}`;

    setSaving(true);
    try {
      const res = await fetch("/api/hr/geofence-set", {
        method: "POST",
        headers: { Authorization: auth, "Content-Type": "application/json" },
        body: JSON.stringify(geofence),
      });
      const data = await res.json();
      if (data.success) toast.success(d.settingsSaved);
      else toast.error(data.message || d.settingsSaveFailed);
    } catch {
      toast.error(d.settingsSaveFailed);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasLocation = geofence.latitude && geofence.longitude;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{d.geofenceTitle}</h1>
        <p className="text-muted-foreground mt-1">{d.geofenceDesc}</p>
      </div>

      {/* Enable Toggle */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-primary/20 flex items-center justify-center">
                <Radio className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <p className="font-semibold">{d.geofenceEnabled}</p>
                <p className="text-xs text-muted-foreground">
                  {ar ? "تفعيل قواعد الموقع الجغرافي للحضور" : "Enable geographic rules for attendance"}
                </p>
              </div>
            </div>
            <Switch
              checked={geofence.enabled || false}
              onCheckedChange={(v) => setGeofence({ ...geofence, enabled: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="w-5 h-5 text-brand-primary" />
              {ar ? "اختر الموقع من الخريطة" : "Pick Location from Map"}
            </CardTitle>
            {hasLocation ? (
              <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                {ar ? "تم تحديد الموقع" : "Location Set"}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-orange-500 border-orange-300 bg-orange-50">
                {ar ? "لم يتم التحديد" : "Not Set"}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {ar
              ? "اضغط على الخريطة لتحديد الموقع، او اسحب العلامة، او اضغط زر الموقع الحالي"
              : "Click on map, drag marker, or press the location button"}
          </p>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <LocationPickerMap
            lat={geofence.latitude ?? null}
            lng={geofence.longitude ?? null}
            radius={geofence.radius || 100}
            onChange={(lat, lng) =>
              setGeofence((prev) => ({ ...prev, latitude: lat, longitude: lng }))
            }
            height="420px"
            lang={lang}
          />
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {ar ? "اعدادات النطاق الجغرافي" : "Geofence Settings"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                {d.geofenceLat}
                <span className="text-xs text-muted-foreground">
                  ({ar ? "يتحدث من الخريطة" : "from map"})
                </span>
              </Label>
              <Input
                type="number" step="0.0001"
                value={geofence.latitude ?? ""}
                onChange={(e) => setGeofence({ ...geofence, latitude: parseFloat(e.target.value) || null })}
                dir="ltr" placeholder="30.0444" className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                {d.geofenceLng}
                <span className="text-xs text-muted-foreground">
                  ({ar ? "يتحدث من الخريطة" : "from map"})
                </span>
              </Label>
              <Input
                type="number" step="0.0001"
                value={geofence.longitude ?? ""}
                onChange={(e) => setGeofence({ ...geofence, longitude: parseFloat(e.target.value) || null })}
                dir="ltr" placeholder="31.2357" className="font-mono text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{d.geofenceRadius}</Label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                value={geofence.radius || 100}
                onChange={(e) => setGeofence({ ...geofence, radius: parseInt(e.target.value) || 100 })}
                className="max-w-[160px]"
              />
              <span className="text-sm text-muted-foreground">{ar ? "متر" : "meters"}</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-primary/60 rounded-full transition-all"
                  style={{ width: `${Math.min(((geofence.radius || 100) / 1000) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{geofence.radius || 100}m</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{d.geofenceAddress}</Label>
            <Input
              value={geofence.address || ""}
              onChange={(e) => setGeofence({ ...geofence, address: e.target.value })}
              placeholder={ar ? "عنوان الشركة" : "Company address"}
            />
          </div>

          <div className="flex justify-end pt-2 border-t">
            <Button
              onClick={handleSave} disabled={saving}
              className="bg-brand-primary hover:bg-brand-primary/90 gap-2"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" />{d.saving}</>
              ) : (
                <><Save className="w-4 h-4" />{d.updateGeofence}</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
'''

geo_file.write_text(new_geo, encoding="utf-8")
print(f"[OK] Geofence page updated: {geo_file.stat().st_size} bytes")
print("[SUCCESS] Geofence with Map + MyLocation button ready!")
