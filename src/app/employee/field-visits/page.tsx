"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MapPin, Loader2, Play, Square, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Location {
  id: number;
  name?: string;
  location_type?: string;
  address?: string;
  status?: string;
}

interface LocationType {
  value: string;
  label: string;
}

export default function MyFieldVisitsPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);

  const [locations, setLocations] = useState<Location[]>([]);
  const [types, setTypes] = useState<LocationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "", location_type: "client", address: "", notes: "",
    latitude: 30.0444, longitude: 31.2357,
  });

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  const loadData = () => {
    if (!token) return;
    Promise.all([
      fetch("/api/employee/my-work-locations", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/hr/work-location-types", { headers: { Authorization: authHeader } }).then(r => r.json()),
    ]).then(([locData, typesData]) => {
      setLocations(locData?.locations || []);
      setTypes(typesData?.types || []);
    }).catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleProposeLocation = async () => {
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
        toast.success(lang === "ar" ? "تم إرسال الاقتراح" : "Location proposed");
        setDialog(false);
        setForm({ name: "", location_type: "client", address: "", notes: "", latitude: 30.0444, longitude: 31.2357 });
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

  const getStatusBadge = (status?: string) => {
    const map: Record<string, { label: string; color: string }> = {
      approved: { label: lang === "ar" ? "معتمد" : "Approved", color: "bg-emerald-500/10 text-emerald-700" },
      pending: { label: lang === "ar" ? "بانتظار الموافقة" : "Pending", color: "bg-amber-500/10 text-amber-700" },
      rejected: { label: lang === "ar" ? "مرفوض" : "Rejected", color: "bg-red-500/10 text-red-700" },
    };
    const info = map[status || ""] || map.pending;
    return <Badge className={`${info.color} border-0`}>{info.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.myFieldVisits}</h1>
          <p className="text-muted-foreground mt-1">
            {lang === "ar" ? "مواقع العمل والزيارات الميدانية" : "Work locations and field visits"}
          </p>
        </div>
        <Button onClick={() => setDialog(true)} className="bg-brand-primary hover:bg-brand-primary/90 gap-2">
          <Plus className="w-4 h-4" />
          {lang === "ar" ? "اقتراح موقع جديد" : "Propose New Location"}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : locations.length === 0 ? (
        <Card>
          <CardContent className="py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 mx-auto">
              <MapPin className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="font-medium mb-2">
              {lang === "ar" ? "لا يوجد مواقع" : "No locations"}
            </p>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              {lang === "ar" ? "اقترح موقع عمل جديد للموافقة عليه من المدير" : "Propose a new location for manager approval"}
            </p>
            <Button onClick={() => setDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              {lang === "ar" ? "اقتراح موقع" : "Propose Location"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {locations.map(loc => (
            <Card key={loc.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-brand-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{loc.name}</p>
                      {loc.location_type && (
                        <Badge variant="outline" className="mt-1 text-[10px]">{loc.location_type}</Badge>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(loc.status)}
                </div>
                {loc.address && (
                  <p className="text-sm text-muted-foreground">{loc.address}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Propose Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{lang === "ar" ? "اقتراح موقع جديد" : "Propose New Location"}</DialogTitle>
            <DialogDescription>
              {lang === "ar" ? "سيتم إرسال الاقتراح للمدير للموافقة" : "Proposal will be sent to manager"}
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
            <div className="space-y-2">
              <Label>{lang === "ar" ? "ملاحظات" : "Notes"}</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialog(false)} disabled={submitting}>{d.cancel}</Button>
              <Button onClick={handleProposeLocation} disabled={submitting} className="bg-brand-primary hover:bg-brand-primary/90 gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {lang === "ar" ? "إرسال" : "Send"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
