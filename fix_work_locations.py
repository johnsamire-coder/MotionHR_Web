import sys
sys.stdout.reconfigure(encoding="utf-8")
from pathlib import Path

wl_file = Path("src/app/hr/work-locations/page.tsx")

new_content = '''"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Map, Loader2, Plus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

const LocationPickerMap = dynamic(
  () => import("@/components/maps/location-picker-map"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[300px] border rounded-lg bg-muted/30">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p className="text-xs">Loading map...</p>
        </div>
      </div>
    ),
  }
);

interface WorkLocation {
  id: number;
  name?: string;
  location_type?: string;
  address?: string;
  radius?: number;
}

interface LocationType {
  value: string;
  label: string;
}

// Fallback types لو الـ API مرجعش حاجة
const DEFAULT_TYPES: LocationType[] = [
  { value: "office",   label: "مكتب / Office" },
  { value: "branch",   label: "فرع / Branch" },
  { value: "remote",   label: "عن بُعد / Remote" },
  { value: "field",    label: "ميداني / Field" },
  { value: "warehouse",label: "مستودع / Warehouse" },
  { value: "other",    label: "أخرى / Other" },
];

export default function WorkLocationsPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";

  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [types, setTypes] = useState<LocationType[]>(DEFAULT_TYPES);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    location_type: "office",
    address: "",
    radius: 100,
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const token = typeof window !== "undefined"
    ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  const loadData = () => {
    if (!token) return;
    Promise.all([
      fetch("/api/hr/work-locations", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/hr/work-location-types", { headers: { Authorization: authHeader } }).then(r => r.json()),
    ]).then(([locData, typesData]) => {
      setLocations(locData?.locations || []);
      // لو الـ API رجع types نستخدمهم، لو لا نفضل بالـ defaults
      if (typesData?.types && typesData.types.length > 0) {
        setTypes(typesData.types);
      }
    })
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.address) {
      toast.error(ar ? "املأ الحقول المطلوبة" : "Fill required fields");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/hr/propose-location", {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(ar ? "تم إضافة الموقع" : "Location added");
        setDialog(false);
        setForm({
          name: "", location_type: "office", address: "",
          radius: 100, latitude: null, longitude: null,
        });
        loadData();
      } else {
        toast.error(data.message || (ar ? "فشل الحفظ" : "Save failed"));
      }
    } catch {
      toast.error(ar ? "خطأ في الاتصال" : "Connection error");
    } finally {
      setSubmitting(false);
    }
  };

  const hasLocation = form.latitude && form.longitude;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.workLocationsTitle}</h1>
          <p className="text-muted-foreground mt-1">{d.workLocationsDesc}</p>
        </div>
        <Button
          onClick={() => setDialog(true)}
          className="bg-brand-primary hover:bg-brand-primary/90 gap-2"
        >
          <Plus className="w-4 h-4" />{d.addWorkLocation}
        </Button>
      </div>

      {/* Types */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {ar ? "أنواع المواقع المتاحة" : "Available Location Types"}
          </h3>
          <div className="flex flex-wrap gap-2">
            {types.map(t => (
              <Badge key={t.value} className="bg-brand-primary/10 text-brand-primary border-0">
                {t.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Locations List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : locations.length === 0 ? (
        <Card>
          <CardContent className="py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 mx-auto">
              <Map className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="font-medium mb-4">{d.noWorkLocations}</p>
            <Button onClick={() => setDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />{d.addWorkLocation}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {locations.map(loc => (
            <Card key={loc.id}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-brand-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{loc.name || `#${loc.id}`}</p>
                    {loc.location_type && (
                      <Badge variant="outline" className="mt-1 text-[10px]">
                        {loc.location_type}
                      </Badge>
                    )}
                    {loc.address && (
                      <p className="text-sm text-muted-foreground mt-2">{loc.address}</p>
                    )}
                    {loc.radius && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {d.workLocationRadius}: {loc.radius}m
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{d.addWorkLocation}</DialogTitle>
            <DialogDescription>
              {ar ? "اختر الموقع من الخريطة أو أدخل الإحداثيات يدوياً" : "Pick location from map or enter coordinates manually"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label>{d.workLocationName} <span className="text-red-500">*</span></Label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder={ar ? "مثال: المقر الرئيسي" : "e.g. Head Office"}
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>{d.workLocationType}</Label>
              <Select
                value={form.location_type}
                onValueChange={v => setForm({ ...form, location_type: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={ar ? "اختر النوع" : "Select type"} />
                </SelectTrigger>
                <SelectContent>
                  {types.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label>{d.workLocationAddress} <span className="text-red-500">*</span></Label>
              <Input
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                placeholder={ar ? "العنوان التفصيلي" : "Detailed address"}
              />
            </div>

            {/* Map */}
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-brand-primary" />
                  {ar ? "اختر الموقع من الخريطة" : "Pick Location from Map"}
                </span>
                {hasLocation ? (
                  <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 text-xs">
                    ✅ {ar ? "تم التحديد" : "Selected"}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-orange-500 border-orange-300 bg-orange-50 text-xs">
                    ⚠️ {ar ? "لم يتم التحديد" : "Not Selected"}
                  </Badge>
                )}
              </Label>
              <p className="text-xs text-muted-foreground">
                {ar
                  ? "اضغط على الخريطة أو اسحب العلامة أو اضغط زر موقعي الحالي"
                  : "Click map, drag marker, or use my location button"}
              </p>
              <LocationPickerMap
                lat={form.latitude}
                lng={form.longitude}
                radius={form.radius}
                onChange={(lat, lng) => setForm(prev => ({ ...prev, latitude: lat, longitude: lng }))}
                height="300px"
                lang={lang}
              />
            </div>

            {/* Coordinates - auto updated */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">
                  {d.geofenceLat}
                  <span className="text-muted-foreground ms-1">({ar ? "من الخريطة" : "from map"})</span>
                </Label>
                <Input
                  type="number" step="0.0001" dir="ltr"
                  value={form.latitude ?? ""}
                  onChange={e => setForm({ ...form, latitude: parseFloat(e.target.value) || null })}
                  placeholder="30.0444"
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">
                  {d.geofenceLng}
                  <span className="text-muted-foreground ms-1">({ar ? "من الخريطة" : "from map"})</span>
                </Label>
                <Input
                  type="number" step="0.0001" dir="ltr"
                  value={form.longitude ?? ""}
                  onChange={e => setForm({ ...form, longitude: parseFloat(e.target.value) || null })}
                  placeholder="31.2357"
                  className="font-mono text-sm"
                />
              </div>
            </div>

            {/* Radius */}
            <div className="space-y-2">
              <Label>{d.workLocationRadius}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={form.radius}
                  onChange={e => setForm({ ...form, radius: parseInt(e.target.value) || 100 })}
                  className="max-w-[140px]"
                />
                <span className="text-sm text-muted-foreground">{ar ? "متر" : "meters"}</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 justify-end pt-2 border-t">
              <Button variant="outline" onClick={() => setDialog(false)} disabled={submitting}>
                {d.cancel}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-brand-primary hover:bg-brand-primary/90 gap-2"
              >
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" />{d.saving}</>
                  : <><Plus className="w-4 h-4" />{d.addWorkLocation}</>
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
'''

wl_file.write_text(new_content, encoding="utf-8")
print(f"[OK] work-locations/page.tsx updated: {wl_file.stat().st_size} bytes")
print("[SUCCESS] Map + fixed dropdown added to work-locations!")
