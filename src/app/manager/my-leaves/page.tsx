"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Calendar, Loader2, CheckCircle2, Clock, XCircle,
  ArrowLeft, ArrowRight, Send,
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface LeaveType {
  id: number;
  name: string;
  name_en?: string;
  color?: string;
  days_allowed?: number;
  is_paid?: boolean;
  balance?: {
    total: number;
    used: number;
    pending: number;
    remaining: number;
  };
}

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

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<LeaveType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    start_date: "",
    end_date: "",
    reason: "",
  });
  const [substitutes, setSubstitutes] = useState<{id: number; name: string; department: string}[]>([]);
  const [selectedSubstituteId, setSelectedSubstituteId] = useState<string>("");

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  const loadData = () => {
    if (!token) return;
    Promise.all([
      fetch("/api/leaves/types", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/employee/my-leaves", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/leaves/substitutes", { headers: { Authorization: authHeader } }).then(r => r.json()),
    ]).then(([typesData, leavesData, subData]) => {
      setLeaveTypes(typesData?.leave_types || []);
      setLeaves(leavesData?.leaves || leavesData?.items || []);
      setSubstitutes(subData?.substitutes || []);
    })
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async () => {
    if (!selectedType || !form.start_date || !form.end_date) {
      toast.error(lang === "ar" ? "املأ الحقول" : "Fill fields");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/employee/submit-leave", {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({
          leave_type_id: selectedType.id,
          start_date: form.start_date,
          end_date: form.end_date,
          reason: form.reason,
          ...(selectedSubstituteId ? { substitute_employee_id: selectedSubstituteId } : {}),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(lang === "ar" ? "تم تقديم الطلب" : "Submitted");
        setSelectedType(null);
        setForm({ start_date: "", end_date: "", reason: "" });
        setSelectedSubstituteId("");
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

  const getTypeName = (t: LeaveType) => lang === "en" && t.name_en ? t.name_en : t.name;

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

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{d.myLeaves}</h1>
        <p className="text-muted-foreground mt-1">
          {lang === "ar" ? "اختر نوع الإجازة لتقديم طلب" : "Choose leave type to submit request"}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Leave Types Cards */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-primary" />
              {lang === "ar" ? "أنواع الإجازات" : "Leave Types"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leaveTypes.map(type => {
                const balance = type.balance || { total: type.days_allowed || 0, used: 0, pending: 0, remaining: type.days_allowed || 0 };
                const usedPercentage = balance.total > 0 ? (balance.used / balance.total) * 100 : 0;
                return (
                  <Card
                    key={type.id}
                    onClick={() => setSelectedType(type)}
                    className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5 border-2"
                    style={{ borderColor: type.color ? `${type.color}40` : undefined }}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: type.color ? `${type.color}20` : "#e0e7ff" }}
                          >
                            <Calendar className="w-5 h-5" style={{ color: type.color || "#6366f1" }} />
                          </div>
                          <div>
                            <p className="font-semibold">{getTypeName(type)}</p>
                            {!type.is_paid && (
                              <Badge variant="outline" className="text-[10px] mt-1">
                                {lang === "ar" ? "بدون مرتب" : "Unpaid"}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Badge className="bg-brand-primary text-white border-0">
                          {balance.remaining} {d.daysUnit}
                        </Badge>
                      </div>

                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {lang === "ar" ? "المستخدم" : "Used"}: <span className="font-semibold text-foreground">{balance.used}</span>
                          </span>
                          <span className="text-muted-foreground">
                            {lang === "ar" ? "الرصيد" : "Total"}: <span className="font-semibold text-foreground">{balance.total}</span>
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full transition-all"
                            style={{
                              width: `${usedPercentage}%`,
                              backgroundColor: type.color || "#6366f1",
                            }}
                          />
                        </div>
                        {balance.pending > 0 && (
                          <p className="text-[10px] text-amber-600">
                            {lang === "ar" ? "معلق" : "Pending"}: {balance.pending}
                          </p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-3 gap-2 hover:bg-brand-primary/10"
                      >
                        <Send className="w-3 h-3" />
                        {d.requestLeave}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* History */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-primary" />
              {lang === "ar" ? "طلباتي السابقة" : "My Previous Requests"}
            </h2>

            {leaves.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
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
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-semibold">
                            {lang === "en" && lv.leave_type_en ? lv.leave_type_en : lv.leave_type}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono mt-1" dir="ltr">
                            {formatDate(lv.start_date)} → {formatDate(lv.end_date)}
                          </p>
                          {lv.reason && (
                            <p className="text-sm text-muted-foreground mt-2">{lv.reason}</p>
                          )}
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
        </>
      )}

      {/* Dialog */}
      <Dialog open={!!selectedType} onOpenChange={(open) => !open && setSelectedType(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedType && (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: selectedType.color ? `${selectedType.color}20` : "#e0e7ff" }}
                >
                  <Calendar className="w-4 h-4" style={{ color: selectedType.color || "#6366f1" }} />
                </div>
              )}
              {selectedType && getTypeName(selectedType)}
            </DialogTitle>
            <DialogDescription>
              {lang === "ar"
                ? `الرصيد المتبقي: ${selectedType?.balance?.remaining || 0} يوم`
                : `Remaining: ${selectedType?.balance?.remaining || 0} days`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
              <Textarea value={form.reason}
                onChange={e => setForm({ ...form, reason: e.target.value })}
                placeholder={lang === "ar" ? "اذكر السبب..." : "Enter reason..."}
                rows={3} />
            </div>
            {substitutes.length > 0 && (
              <div className="space-y-2">
                <Label>{lang === "ar" ? "الموظف البديل (اختياري)" : "Substitute Employee (Optional)"}</Label>
                <Select value={selectedSubstituteId} onValueChange={setSelectedSubstituteId}>
                  <SelectTrigger>
                    <SelectValue placeholder={lang === "ar" ? "اختر موظف بديل..." : "Select substitute..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {substitutes.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}{s.department ? ` — ${s.department}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setSelectedType(null)} disabled={submitting}>
                {d.cancel}
              </Button>
              <Button onClick={handleSubmit} disabled={submitting} className="bg-brand-primary hover:bg-brand-primary/90 gap-2">
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
