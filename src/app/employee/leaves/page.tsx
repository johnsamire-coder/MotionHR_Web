"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Calendar, Plus, Loader2, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface LeaveItem {
  id: number;
  leave_type?: string;
  leave_type_en?: string;
  start_date?: string;
  end_date?: string;
  days_count?: number;
  status?: string;
  reason?: string;
}

export default function MyLeavesPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEYS.token) : null;
    if (!token) return;
    const authHeader = token.startsWith("Token") ? token : `Token ${token}`;

    fetch("/api/employee/my-leaves", { headers: { Authorization: authHeader } })
      .then(r => r.json())
      .then(data => setLeaves(data?.leaves || data?.items || []))
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
    const map: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
      approved: { label: d.leaveApproved, color: "bg-emerald-500/10 text-emerald-700", icon: CheckCircle2 },
      pending: { label: d.leavePending, color: "bg-amber-500/10 text-amber-700", icon: Clock },
      rejected: { label: d.leaveRejected, color: "bg-red-500/10 text-red-700", icon: XCircle },
    };
    const info = map[status || ""] || map.pending;
    const Icon = info.icon;
    return (
      <Badge className={`${info.color} border-0 gap-1`}>
        <Icon className="w-3 h-3" />
        {info.label}
      </Badge>
    );
  };

  const getLeaveType = (lv: LeaveItem) => {
    return lang === "en" && lv.leave_type_en ? lv.leave_type_en : (lv.leave_type || "—");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.myLeaves}</h1>
          <p className="text-muted-foreground mt-1">{d.leavesDesc}</p>
        </div>
        <Button className="bg-brand-primary hover:bg-brand-primary/90 gap-2">
          <Plus className="w-4 h-4" />
          {d.requestLeave}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : leaves.length === 0 ? (
        <Card>
          <CardContent className="py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 mx-auto">
              <Calendar className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="font-medium">{d.noLeavesData}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {leaves.map(lv => (
            <Card key={lv.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-brand-primary" />
                    </div>
                    <div>
                      <p className="font-semibold mb-1">{getLeaveType(lv)}</p>
                      <p className="text-xs text-muted-foreground font-mono" dir="ltr">
                        {formatDate(lv.start_date)} → {formatDate(lv.end_date)}
                      </p>
                      {lv.reason && (
                        <p className="text-sm text-muted-foreground mt-2">{lv.reason}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(lv.status)}
                    <span className="text-xs font-mono text-muted-foreground">
                      {lv.days_count || 0} {d.daysUnit}
                    </span>
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
