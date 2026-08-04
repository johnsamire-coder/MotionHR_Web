"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import {
  MapPin, Users, Clock, Activity, RefreshCw, Search,
  Loader2, Wifi, WifiOff, Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

// Dynamic import للخريطة (client-only)
const LiveMap = dynamic(() => import("@/components/maps/live-map"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px] bg-muted/30 rounded-xl">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  ),
});

interface LocationItem {
  employee_id: number;
  employee_name: string;
  latitude?: number;
  longitude?: number;
  last_update?: string;
  department?: string;
  status?: string;
}

interface LocationsData {
  success: boolean;
  items: LocationItem[];
  total: number;
}

export default function LocationsPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);

  const [data, setData] = useState<LocationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/locations/live", {
        headers: { Authorization: authHeader },
      });
      const result = await res.json();
      setData(result);
      setLastRefresh(new Date());
    } catch {
      toast.error(d.failedLoad);
    } finally {
      setLoading(false);
    }
  }, [token, authHeader, d.failedLoad]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const items = data?.items || [];
  const filtered = items.filter(item =>
    !search || (item.employee_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const markers = items
    .filter(item => item.latitude && item.longitude)
    .map(item => ({
      id: item.employee_id,
      name: item.employee_name,
      lat: item.latitude!,
      lng: item.longitude!,
      lastSeen: item.last_update,
    }));

  const getTimeAgo = (dateStr?: string) => {
    if (!dateStr) return "—";
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return d.justNow;
    if (diffMins < 60) return `${diffMins} ${d.minutesAgo}`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} ${d.hoursAgo}`;
  };

  const isEmployeeActive = (dateStr?: string) => {
    if (!dateStr) return false;
    const diffMs = new Date().getTime() - new Date(dateStr).getTime();
    return diffMs < 5 * 60 * 1000; // 5 minutes
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.locationsTitle}</h1>
          <p className="text-muted-foreground mt-1">{d.locationsDesc}</p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            <span className="text-sm font-medium">{d.autoRefresh}</span>
          </div>

          <Button variant="outline" onClick={fetchData} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {d.refreshNow}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{d.trackedEmployees}</p>
                <p className="text-2xl font-bold">{data?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{d.lastUpdate}</p>
                <p className="text-lg font-bold">
                  {lastRefresh ? lastRefresh.toLocaleTimeString(lang === "ar" ? "ar-EG" : "en-US") : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                autoRefresh ? "bg-emerald-500/10" : "bg-gray-500/10"
              }`}>
                {autoRefresh ? (
                  <Wifi className="w-6 h-6 text-emerald-600" />
                ) : (
                  <WifiOff className="w-6 h-6 text-gray-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{d.liveStatus}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
                  <p className="text-lg font-bold">
                    {autoRefresh ? d.liveActive : d.liveOffline}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content: Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Employees List */}
        <div className="lg:col-span-1">
          <Card className="border-border/50 h-[650px] flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={d.searchEmployees}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <MapPin className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <p className="font-medium text-sm">{d.noLocationsData}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map(item => {
                    const isSelected = selectedId === item.employee_id;
                    const isActive = isEmployeeActive(item.last_update);
                    const hasLocation = item.latitude && item.longitude;

                    return (
                      <button
                        key={item.employee_id}
                        onClick={() => hasLocation && setSelectedId(isSelected ? null : item.employee_id)}
                        disabled={!hasLocation}
                        className={`w-full text-right rounded-lg p-3 transition-all ${
                          isSelected
                            ? "bg-brand-primary/10 border-2 border-brand-primary"
                            : "bg-muted/30 hover:bg-muted/60 border-2 border-transparent"
                        } ${!hasLocation ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-sm font-semibold">
                                {item.employee_name?.[0] || "?"}
                              </AvatarFallback>
                            </Avatar>
                            {isActive && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0 text-start">
                            <div className="font-medium text-sm truncate">{item.employee_name}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {getTimeAgo(item.last_update)}
                            </div>
                          </div>

                          {hasLocation ? (
                            <MapPin className="w-4 h-4 text-brand-primary flex-shrink-0" />
                          ) : (
                            <Badge variant="outline" className="text-[10px] bg-gray-500/10 border-0">
                              —
                            </Badge>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right: Map */}
        <div className="lg:col-span-2">
          <Card className="border-border/50 overflow-hidden">
            {markers.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center h-[650px] text-center p-6">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Navigation className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <p className="font-medium text-lg mb-1">{d.noLocationsData}</p>
                <p className="text-sm text-muted-foreground">
                  {lang === "ar"
                    ? "لا يوجد بيانات مواقع لعرضها على الخريطة"
                    : "No location data to display on the map"}
                </p>
              </div>
            ) : (
              <LiveMap
                markers={markers}
                height="650px"
                selectedId={selectedId}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
