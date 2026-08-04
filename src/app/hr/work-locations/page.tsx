"use client";

import { useState, useEffect } from "react";
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

export default function WorkLocationsPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [types, setTypes] = useState<LocationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    location_type: "office",
    address: "",
    radius: 100,
    latitude: 30.0444,
    longitude: 31.2357,
  });

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  const loadData = () => {
    if (!token) return;
    Promise.all([
      fetch("/api/hr/work-locations", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/hr/work-location-types", { headers: { Authorization: authHeader } }).then(r => r.json()),
    ]).then(([locData, typesData]) => {
      setLocations(locData?.locations || []);
      setTypes(typesData?.types || []);
    })
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.address) {
      toast.error(lang === "ar" ? "املأ الحقول" : "Fill fields");
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
        toast.success(lang === "ar" ? "تم إضافة الموقع" : "Location added");
        setDialog(false);
        setForm({ name: "", location_type: "office", address: "", radius: 100, latitude: 30.0444, longitude: 31.2357 });
        loadData();
      } else {
        toast.error(data.message || (lang === "ar" ? "فشل" : "Failed"));
      }
    } catch {
      toast.error(lang === "ar" ? "خطأ" : "Error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.workLocationsTitle}</h1>
          <p className="text-muted-foreground mt-1">{d.workLocationsDesc}</p>
        </div>
        <Button onClick={() => setDialog(true)} className="bg-brand-primary hover:bg-brand-primary/90 gap-2">
          <Plus className="w-4 h-4" />{d.addWorkLocation}
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {lang === "ar" ? "أنواع المواقع المتاحة" : "Available Location Types"}
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
                    {loc.location_type && <Badge variant="outline" className="mt-1 text-[10px]">{loc.location_type}</Badge>}
                    {loc.address && <p className="text-sm text-muted-foreground mt-2">{loc.address}</p>}
                    {loc.radius && <p className="text-xs text-muted-foreground mt-1">{d.workLocationRadius}: {loc.radius}m</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{d.addWorkLocation}</DialogTitle>
            <DialogDescription>
              {lang === "ar" ? "أضف موقع عمل جديد" : "Add a new work location"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{d.workLocationName}</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{d.workLocationType}</Label>
              <Select value={form.location_type} onValueChange={v => setForm({ ...form, location_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {types.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{d.workLocationAddress}</Label>
              <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{d.geofenceLat}</Label>
                <Input type="number" step="0.0001" value={form.latitude} dir="ltr"
                  onChange={e => setForm({ ...form, latitude: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>{d.geofenceLng}</Label>
                <Input type="number" step="0.0001" value={form.longitude} dir="ltr"
                  onChange={e => setForm({ ...form, longitude: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{d.workLocationRadius}</Label>
              <Input type="number" value={form.radius}
                onChange={e => setForm({ ...form, radius: parseInt(e.target.value) || 100 })} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialog(false)} disabled={submitting}>
                {d.cancel}
              </Button>
              <Button onClick={handleSubmit} disabled={submitting} className="bg-brand-primary hover:bg-brand-primary/90">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : d.addWorkLocation}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
