"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Briefcase, Loader2, MapPin, Calendar, Clock, Plus,
  Play, Square, CheckCircle2, XCircle, Send,
} from "lucide-react";
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
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Mission {
  id: number;
  assignment_id?: number;
  title?: string;
  location?: string;
  scheduled_date?: string;
  status?: string;
  started_at?: string;
  ended_at?: string;
}

export default function MyMissionsPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);

  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "upcoming" | "completed">("active");
  const [requestDialog, setRequestDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "", location: "", scheduled_date: "", reason: "",
  });

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  const loadData = () => {
    if (!token) return;
    fetch("/api/employee/my-missions", { headers: { Authorization: authHeader } })
      .then(r => r.json())
      .then(data => setMissions(data?.missions || []))
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const activeMissions = missions.filter(m => m.status === "in_progress" || m.status === "active");
  const upcomingMissions = missions.filter(m => m.status === "assigned" || m.status === "pending");
  const completedMissions = missions.filter(m => m.status === "completed" || m.status === "cancelled");

  const currentList = activeTab === "active" ? activeMissions :
                       activeTab === "upcoming" ? upcomingMissions : completedMissions;

  const handleStartEnd = async (assignmentId: number, action: "start" | "end") => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
      });

      const endpoint = action === "start" ? "mission-start" : "mission-end";
      const res = await fetch(`/api/employee/${endpoint}`, {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({
          assignment_id: assignmentId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(action === "start"
          ? (lang === "ar" ? "بدأت المهمة" : "Mission started")
          : (lang === "ar" ? "أنهيت المهمة" : "Mission ended"));
        loadData();
      } else {
        toast.error(data.message || (lang === "ar" ? "فشل" : "Failed"));
      }
    } catch {
      toast.error(lang === "ar" ? "خطأ" : "Error");
    }
  };

  const handleRequestMission = async () => {
    if (!form.title || !form.scheduled_date) {
      toast.error(lang === "ar" ? "املأ الحقول" : "Fill fields");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/employee/mission-request", {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(lang === "ar" ? "تم إرسال الطلب للمدير" : "Request sent to manager");
        setRequestDialog(false);
        setForm({ title: "", location: "", scheduled_date: "", reason: "" });
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

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  const getStatusBadge = (status?: string) => {
    const map: Record<string, { label: string; color: string }> = {
      pending: { label: d.missionStatusPending, color: "bg-amber-500/10 text-amber-700" },
      assigned: { label: d.missionStatusAssigned, color: "bg-blue-500/10 text-blue-700" },
      in_progress: { label: d.missionStatusActive, color: "bg-purple-500/10 text-purple-700" },
      active: { label: d.missionStatusActive, color: "bg-purple-500/10 text-purple-700" },
      completed: { label: d.missionStatusCompleted, color: "bg-emerald-500/10 text-emerald-700" },
      cancelled: { label: d.missionStatusCancelled, color: "bg-red-500/10 text-red-700" },
    };
    const info = map[status || ""] || map.pending;
    return <Badge className={`${info.color} border-0`}>{info.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.myMissions}</h1>
          <p className="text-muted-foreground mt-1">
            {lang === "ar" ? "المهمات المكلف بيها" : "Missions assigned to you"}
          </p>
        </div>
        <Button onClick={() => setRequestDialog(true)} className="bg-brand-primary hover:bg-brand-primary/90 gap-2">
          <Plus className="w-4 h-4" />
          {lang === "ar" ? "طلب مهمة جديدة" : "Request New Mission"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[
          { key: "active", label: lang === "ar" ? `قائمة (${activeMissions.length})` : `Active (${activeMissions.length})` },
          { key: "upcoming", label: lang === "ar" ? `قادمة (${upcomingMissions.length})` : `Upcoming (${upcomingMissions.length})` },
          { key: "completed", label: lang === "ar" ? `مكتملة (${completedMissions.length})` : `Completed (${completedMissions.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              activeTab === tab.key
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : currentList.length === 0 ? (
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
          {currentList.map(m => (
            <Card key={m.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-brand-primary" />
                    <h3 className="font-semibold">{m.title || `#${m.id}`}</h3>
                  </div>
                  {getStatusBadge(m.status)}
                </div>
                <div className="space-y-2 text-sm mb-4">
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

                {/* Actions */}
                {(m.status === "assigned" || m.status === "pending") && m.assignment_id && (
                  <Button
                    onClick={() => handleStartEnd(m.assignment_id!, "start")}
                    className="w-full gap-2 bg-brand-primary hover:bg-brand-primary/90"
                  >
                    <Play className="w-4 h-4" />
                    {lang === "ar" ? "بدء الزيارة" : "Start Visit"}
                  </Button>
                )}
                {(m.status === "in_progress" || m.status === "active") && m.assignment_id && (
                  <Button
                    onClick={() => handleStartEnd(m.assignment_id!, "end")}
                    variant="outline"
                    className="w-full gap-2 border-red-500/20 text-red-700 hover:bg-red-50"
                  >
                    <Square className="w-4 h-4" />
                    {lang === "ar" ? "إنهاء الزيارة" : "End Visit"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Request Mission Dialog */}
      <Dialog open={requestDialog} onOpenChange={setRequestDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{lang === "ar" ? "طلب مهمة جديدة" : "Request New Mission"}</DialogTitle>
            <DialogDescription>
              {lang === "ar" ? "سيتم إرسال الطلب للمدير للموافقة" : "Request will be sent to manager"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{d.missionTitle}</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{d.missionLocation}</Label>
              <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                placeholder={lang === "ar" ? "موقع العميل" : "Client location"} />
            </div>
            <div className="space-y-2">
              <Label>{d.missionDate}</Label>
              <Input type="date" value={form.scheduled_date}
                onChange={e => setForm({ ...form, scheduled_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{d.requestReason}</Label>
              <Textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} rows={3} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setRequestDialog(false)} disabled={submitting}>
                {d.cancel}
              </Button>
              <Button onClick={handleRequestMission} disabled={submitting} className="bg-brand-primary hover:bg-brand-primary/90 gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {d.submitRequest}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
