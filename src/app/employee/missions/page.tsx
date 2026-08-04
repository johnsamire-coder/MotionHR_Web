"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Briefcase, Loader2, MapPin, Calendar, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Mission {
  id: number;
  title?: string;
  location?: string;
  scheduled_date?: string;
  status?: string;
}

export default function MyMissionsPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEYS.token) : null;
    if (!token) return;
    const authHeader = token.startsWith("Token") ? token : `Token ${token}`;

    fetch("/api/employee/my-missions", { headers: { Authorization: authHeader } })
      .then(r => r.json())
      .then(data => setMissions(data?.missions || []))
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  const getStatusBadge = (status?: string) => {
    const map: Record<string, { label: string; color: string }> = {
      pending: { label: d.missionStatusPending, color: "bg-amber-500/10 text-amber-700" },
      active: { label: d.missionStatusActive, color: "bg-purple-500/10 text-purple-700" },
      completed: { label: d.missionStatusCompleted, color: "bg-emerald-500/10 text-emerald-700" },
      cancelled: { label: d.missionStatusCancelled, color: "bg-red-500/10 text-red-700" },
    };
    const info = map[status || ""] || map.pending;
    return <Badge className={`${info.color} border-0`}>{info.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{d.myMissions}</h1>
        <p className="text-muted-foreground mt-1">
          {lang === "ar" ? "المهمات المكلف بيها" : "Missions assigned to you"}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : missions.length === 0 ? (
        <Card>
          <CardContent className="py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 mx-auto">
              <Briefcase className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="font-medium">{d.noMissionsData}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {missions.map(m => (
            <Card key={m.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-brand-primary" />
                    <h3 className="font-semibold">{m.title || `#${m.id}`}</h3>
                  </div>
                  {getStatusBadge(m.status)}
                </div>
                <div className="space-y-2 text-sm">
                  {m.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{m.location}</span>
                    </div>
                  )}
                  {m.scheduled_date && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span className="font-mono" dir="ltr">{formatDate(m.scheduled_date)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
