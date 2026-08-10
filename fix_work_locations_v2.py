import sys
sys.stdout.reconfigure(encoding="utf-8")
from pathlib import Path

wl_file = Path("src/app/hr/work-locations/page.tsx")

new_content = '''"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import {
  Map, Loader2, Plus, MapPin, Users,
  CheckCircle, Clock, XCircle, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

interface WorkLocation {
  id: number;
  name?: string;
  location_type?: string;
  location_type_display?: string;
  address?: string;
  radius?: number;
  status?: string;
  status_display?: string;
  employee_name?: string;
  employee_id?: number;
  latitude?: number;
  longitude?: number;
}

interface LocationType {
  value: string;
  label: string;
}

const DEFAULT_TYPES: LocationType[] = [
  { value: "office",    label: "مكتب / Office" },
  { value: "branch",    label: "فرع / Branch" },
  { value: "remote",    label: "عن بُعد / Remote" },
  { value: "field",     label: "ميداني / Field" },
  { value: "warehouse", label: "مستودع / Warehouse" },
  { value: "other",     label: "أخرى / Other" },
];

export default function WorkLocationsPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";

  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [allLocations, setAllLocations] = useState<WorkLocation[]>([]);
  const [types, setTypes] = useState<LocationType[]>(DEFAULT_TYPES);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("locations");
  const [searchEmployee, setSearchEmployee] = useState("");

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

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [locRes, allRes, typesRes] = await Promise.all([
        fetch("/api/hr/work-locations", { headers: { Authorization: authHeader } }),
        fetch("/api/hr/work-locations?pending=false", { headers: { Authorization: authHeader } }),
        fetch("/api/hr/work-location-types", { headers: { Authorization: authHeader } }),
      ]);
      const locData = await locRes.json();
      const allData = await allRes.json();
      const typesData = await typesRes.json();

      setLocations(locData?.locations || []);
      setAllLocations(allData?.locations || []);
      if (typesData?.types?.length > 0) setTypes(typesData.types);
    } catch {
      toast.error(d.failedLoad);
    } finally {
      setLoading(false);
    }
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
        setForm({ name: "", location_type: "office", address: "", radius: 100, latitude: null, longitude: null });
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

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-700 border-green-300 gap-1"><CheckCircle className="w-3 h-3" />{ar ? "معتمد" : "Approved"}</Badge>;
      case "pending":
        return <Badge className="bg-orange-100 text-orange-700 border-orange-300 gap-1"><Clock className="w-3 h-3" />{ar ? "معلق" : "Pending"}</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-700 border-red-300 gap-1"><XCircle className="w-3 h-3" />{ar ? "مرفوض" : "Rejected"}</Badge>;
      default:
        return <Badge variant="outline">{status || "—"}</Badge>;
    }
  };

  // Group locations by employee
  const employeeMap = new Map<number, { name: string; locations: WorkLocation[] }>();
  allLocations.forEach((loc) => {
    if (!loc.employee_id) return;
    if (!employeeMap.has(loc.employee_id)) {
      employeeMap.set(loc.employee_id, { name: loc.employee_name || "—", locations: [] });
    }
    employeeMap.get(loc.employee_id)!.locations.push(loc);
  });

  const employeeEntries = Array.from(employeeMap.entries()).filter(([, emp]) =>
    !searchEmployee || emp.name.toLowerCase().includes(searchEmployee.toLowerCase())
  );

  const hasLocation = form.latitude && form.longitude;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.workLocationsTitle}</h1>
          <p className="text-muted-foreground mt-1">{d.workLocationsDesc}</p>
        </div>
        <Button onClick={() => setDialog(true)} className="bg-brand-primary hover:bg-brand-primary/90 gap-2">
          <Plus className="w-4 h-4" />{d.addWorkLocation}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: ar ? "إجمالي المواقع" : "Total Locations", value: allLocations.length, color: "blue", icon: MapPin },
          { label: ar ? "معتمدة" : "Approved", value: allLocations.filter(l => l.status === "approved").length, color: "green", icon: CheckCircle },
          { label: ar ? "معلقة" : "Pending", value: allLocations.filter(l => l.status === "pending").length, color: "orange", icon: Clock },
          { label: ar ? "موظفين لديهم مواقع" : "Employees with Locations", value: employeeMap.size, color: "purple", icon: Users },
        ].map((stat, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-${stat.color}-500/10 flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="locations" className="gap-2">
            <MapPin className="w-4 h-4" />
            {ar ? "المواقع" : "Locations"}
          </TabsTrigger>
          <TabsTrigger value="employees" className="gap-2">
            <Users className="w-4 h-4" />
            {ar ? "الموظفون والمواقع" : "Employees & Locations"}
            {employeeMap.size > 0 && (
              <Badge className="ms-1 text-xs bg-brand-primary/20 text-brand-primary">
                {employeeMap.size}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Locations */}
        <TabsContent value="locations" className="mt-4">
          {/* Types */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-3">
                {ar ? "أنواع المواقع المتاحة" : "Available Location Types"}
              </p>
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
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : locations.length === 0 ? (
            <Card>
              <CardContent className="py-20 text-center">
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
                      <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-brand-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold">{loc.name || `#${loc.id}`}</p>
                          {getStatusBadge(loc.status)}
                        </div>
                        {loc.location_type_display && (
                          <Badge variant="outline" className="mt-1 text-[10px]">
                            {loc.location_type_display}
                          </Badge>
                        )}
                        {loc.address && (
                          <p className="text-sm text-muted-foreground mt-2">{loc.address}</p>
                        )}
                        {loc.employee_name && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Users className="w-3 h-3" />{loc.employee_name}
                          </p>
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
        </TabsContent>

        {/* Tab 2: Employees & Locations */}
        <TabsContent value="employees" className="mt-4">
          <div className="mb-4">
            <Input
              placeholder={ar ? "ابحث باسم الموظف..." : "Search by employee name..."}
              value={searchEmployee}
              onChange={(e) => setSearchEmployee(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : employeeEntries.length === 0 ? (
            <Card>
              <CardContent className="py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 mx-auto">
                  <Users className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="font-medium text-muted-foreground">
                  {ar ? "لا يوجد موظفون لديهم مواقع عمل مخصصة" : "No employees with assigned work locations"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {employeeEntries.map(([empId, emp]) => (
                <Card key={empId} className="border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-brand-primary/10 text-brand-primary font-semibold">
                          {emp.name[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{emp.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {emp.locations.length} {ar ? "موقع" : "location(s)"}
                        </p>
                      </div>
                      <div className="ms-auto flex gap-1 flex-wrap">
                        {emp.locations.filter(l => l.status === "approved").length > 0 && (
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            {emp.locations.filter(l => l.status === "approved").length} {ar ? "معتمد" : "approved"}
                          </Badge>
                        )}
                        {emp.locations.filter(l => l.status === "pending").length > 0 && (
                          <Badge className="bg-orange-100 text-orange-700 text-xs">
                            {emp.locations.filter(l => l.status === "pending").length} {ar ? "معلق" : "pending"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {emp.locations.map((loc) => (
                        <div
                          key={loc.id}
                          className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-muted/20"
                        >
                          <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-4 h-4 text-brand-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="font-medium text-sm truncate">{loc.name}</p>
                              {getStatusBadge(loc.status)}
                            </div>
                            {loc.location_type_display && (
                              <p className="text-xs text-muted-foreground">{loc.location_type_display}</p>
                            )}
                            {loc.address && (
                              <p className="text-xs text-muted-foreground truncate mt-1">{loc.address}</p>
                            )}
                            {loc.radius && (
                              <p className="text-xs text-muted-foreground">
                                {ar ? "نطاق" : "Radius"}: {loc.radius}m
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Location Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{d.addWorkLocation}</DialogTitle>
            <DialogDescription>
              {ar ? "اختر الموقع من الخريطة أو أدخل الإحداثيات يدوياً" : "Pick location from map or enter coordinates manually"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{d.workLocationName} <span className="text-red-500">*</span></Label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder={ar ? "مثال: المقر الرئيسي" : "e.g. Head Office"}
              />
            </div>

            <div className="space-y-2">
              <Label>{d.workLocationType}</Label>
              <Select value={form.location_type} onValueChange={v => setForm({ ...form, location_type: v })}>
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

            <div className="space-y-2">
              <Label>{d.workLocationAddress} <span className="text-red-500">*</span></Label>
              <Input
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                placeholder={ar ? "العنوان التفصيلي" : "Detailed address"}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-brand-primary" />
                  {ar ? "اختر الموقع من الخريطة" : "Pick from Map"}
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
              <LocationPickerMap
                lat={form.latitude}
                lng={form.longitude}
                radius={form.radius}
                onChange={(lat, lng) => setForm(prev => ({ ...prev, latitude: lat, longitude: lng }))}
                height="280px"
                lang={lang}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">{d.geofenceLat}</Label>
                <Input type="number" step="0.0001" dir="ltr"
                  value={form.latitude ?? ""}
                  onChange={e => setForm({ ...form, latitude: parseFloat(e.target.value) || null })}
                  placeholder="30.0444" className="font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">{d.geofenceLng}</Label>
                <Input type="number" step="0.0001" dir="ltr"
                  value={form.longitude ?? ""}
                  onChange={e => setForm({ ...form, longitude: parseFloat(e.target.value) || null })}
                  placeholder="31.2357" className="font-mono text-sm" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{d.workLocationRadius}</Label>
              <div className="flex items-center gap-2">
                <Input type="number" value={form.radius}
                  onChange={e => setForm({ ...form, radius: parseInt(e.target.value) || 100 })}
                  className="max-w-[140px]" />
                <span className="text-sm text-muted-foreground">{ar ? "متر" : "meters"}</span>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t">
              <Button variant="outline" onClick={() => setDialog(false)} disabled={submitting}>
                {d.cancel}
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}
                className="bg-brand-primary hover:bg-brand-primary/90 gap-2">
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
print("[SUCCESS] Employees & Locations tab added!")
