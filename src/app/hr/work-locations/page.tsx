"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Map, Loader2, Plus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  useEffect(() => {
    const token = typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEYS.token) : null;
    if (!token) return;
    const authHeader = token.startsWith("Token") ? token : `Token ${token}`;

    Promise.all([
      fetch("/api/hr/work-locations", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/hr/work-location-types", { headers: { Authorization: authHeader } }).then(r => r.json()),
    ]).then(([locData, typesData]) => {
      setLocations(locData?.locations || []);
      setTypes(typesData?.types || []);
    })
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.workLocationsTitle}</h1>
          <p className="text-muted-foreground mt-1">{d.workLocationsDesc}</p>
        </div>
        <Button className="bg-brand-primary hover:bg-brand-primary/90 gap-2">
          <Plus className="w-4 h-4" />
          {d.addWorkLocation}
        </Button>
      </div>

      {/* Types Overview */}
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

      {/* Locations */}
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
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              {d.addWorkLocation}
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
                      <Badge variant="outline" className="mt-1 text-[10px]">{loc.location_type}</Badge>
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
    </div>
  );
}
