"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MapPin, Loader2, Save, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

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
      .then(r => r.json())
      .then(data => setGeofence(data?.geofence || geofence))
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
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
      if (data.success) {
        toast.success(d.settingsSaved);
      } else {
        toast.error(data.message || d.settingsSaveFailed);
      }
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

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{d.geofenceTitle}</h1>
        <p className="text-muted-foreground mt-1">{d.geofenceDesc}</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border-2 border-brand-primary/20 bg-brand-primary/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-primary/20 flex items-center justify-center">
                <Radio className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <p className="font-semibold">{d.geofenceEnabled}</p>
                <p className="text-xs text-muted-foreground">
                  {lang === "ar" ? "تفعيل قواعد الموقع الجغرافي للحضور" : "Enable geographic rules for attendance"}
                </p>
              </div>
            </div>
            <Switch
              checked={geofence.enabled || false}
              onCheckedChange={(v) => setGeofence({ ...geofence, enabled: v })}
            />
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{d.geofenceLat}</Label>
              <Input
                type="number"
                step="0.0001"
                value={geofence.latitude || ""}
                onChange={e => setGeofence({ ...geofence, latitude: parseFloat(e.target.value) || null })}
                dir="ltr"
                placeholder="30.0444"
              />
            </div>

            <div className="space-y-2">
              <Label>{d.geofenceLng}</Label>
              <Input
                type="number"
                step="0.0001"
                value={geofence.longitude || ""}
                onChange={e => setGeofence({ ...geofence, longitude: parseFloat(e.target.value) || null })}
                dir="ltr"
                placeholder="31.2357"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{d.geofenceRadius}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={geofence.radius || 100}
                onChange={e => setGeofence({ ...geofence, radius: parseInt(e.target.value) || 100 })}
              />
              <span className="text-sm text-muted-foreground">
                {lang === "ar" ? "متر" : "meters"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{d.geofenceAddress}</Label>
            <Input
              value={geofence.address || ""}
              onChange={e => setGeofence({ ...geofence, address: e.target.value })}
              placeholder={lang === "ar" ? "عنوان الشركة" : "Company address"}
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
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
