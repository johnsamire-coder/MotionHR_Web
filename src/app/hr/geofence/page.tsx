"use client";

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
