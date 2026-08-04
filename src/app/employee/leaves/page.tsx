"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Calendar, Plus, Loader2, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface LeaveType {
  id: number;
  name: string;
  name_en?: string;
  balance?: { remaining: number };
}

export default function MyLeavesPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    leave_type_id: "",
    start_date: "",
    end_date: "",
    reason: "",
  });

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  const loadData = () => {
    if (!token) return;
    Promise.all([
      fetch("/api/employee/my-leaves", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/leaves/types", { headers: { Authorization: authHeader } }).then(r => r.json()),
    ]).then(([leavesData, typesData]) => {
      setLeaves(leavesData?.leaves || leavesData?.items || []);
      setLeaveTypes(typesData?.leave_types || []);
    })
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async () => {
    if (!form.leave_type_id || !form.start_date || !form.end_date) {
      toast.error(lang === "ar" ? "املأ جميع الحقول" : "Fill all fields");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/employee/submit-leave", {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({
          leave_type_id: parseInt(form.leave_type_id),
          start_date: form.start_date,
          end_date: form.end_date,
          reason: form.reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(lang === "ar" ? "تم تقديم الطلب بنجاح" : "Request submitted");
        setDialogOpen(false);
        setForm({ leave_type_id: "", start_date: "", end_date: "", reason: "" });
        loadData();
      } else {
        toast.error(data.message || (lang === "ar" ? "فشل التقديم" : "Submit failed"));
      }
    } catch {
      toast.error(lang === "ar" ? "خطأ في الاتصال" : "Connection error");
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
    const map: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
      approved: { label: d.leaveApproved, color: "bg-emerald-500/10 text-emerald-700", icon: CheckCircle2 },
      pending: { label: d.leavePending, color: "bg-amber-500/10 text-amber-700", icon: Clock },
      rejected: { label: d.leaveRejected, color: "bg-red-500/10 text-red-700", icon: XCircle },
    };
    const info = map[status || ""] || map.pending;
    const Icon = info.icon;
    return (
      <Badge className={`${info.color} border-0 gap-1`}>
        <Icon className="w-3 h-3" />{info.label}
      </Badge>
    );
  };

  const getLeaveType = (lv: LeaveItem) => {
    return lang === "en" && lv.leave_type_en ? lv.leave_type_en : (lv.leave_type || "—");
  };

  const getTypeName = (t: LeaveType) => lang === "en" && t.name_en ? t.name_en : t.name;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.myLeaves}</h1>
          <p className="text-muted-foreground mt-1">{d.leavesDesc}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-brand-primary hover:bg-brand-primary/90 gap-2">
          <Plus className="w-4 h-4" />{d.requestLeave}
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
            <p className="font-medium mb-4">{d.noLeavesData}</p>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />{d.requestLeave}
            </Button>
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
                      {lv.reason && <p className="text-sm text-muted-foreground mt-2">{lv.reason}</p>}
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

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{d.requestLeave}</DialogTitle>
            <DialogDescription>
              {lang === "ar" ? "قدم طلب إجازة جديد" : "Submit a new leave request"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{d.leaveType}</Label>
              <Select value={form.leave_type_id} onValueChange={v => setForm({ ...form, leave_type_id: v })}>
                <SelectTrigger><SelectValue placeholder={lang === "ar" ? "اختر النوع" : "Select type"} /></SelectTrigger>
                <SelectContent>
                  {leaveTypes.map(t => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {getTypeName(t)}
                      {t.balance && (
                        <span className="text-xs text-muted-foreground mr-2">
                          ({t.balance.remaining} {d.daysUnit})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{d.colStartDate}</Label>
                <Input type="date" value={form.start_date}
                  onChange={e => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{d.colEndDate}</Label>
                <Input type="date" value={form.end_date}
                  onChange={e => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{d.leaveReason}</Label>
              <Textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
                placeholder={lang === "ar" ? "اذكر السبب..." : "Enter reason..."} rows={3} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                {d.cancel}
              </Button>
              <Button onClick={handleSubmit} disabled={submitting} className="bg-brand-primary hover:bg-brand-primary/90">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : d.submitRequest}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
