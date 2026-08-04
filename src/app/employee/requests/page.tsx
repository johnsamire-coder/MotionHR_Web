"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  FileText, Loader2, CheckCircle2, Clock, XCircle,
  ChevronDown, ChevronUp, Send,
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

interface RequestType {
  id: number;
  name: string;
  name_en?: string;
  description?: string;
  description_en?: string;
  requires_date_range?: boolean;
  requires_amount?: boolean;
}

interface RequestCategory {
  id: number;
  name: string;
  name_en?: string;
  icon?: string;
  color?: string;
  types: RequestType[];
}

interface RequestItem {
  id: number;
  request_type?: string;
  request_type_en?: string;
  submitted_at?: string;
  status?: string;
  reason?: string;
}

export default function MyRequestsPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);

  const [categories, setCategories] = useState<RequestCategory[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<RequestType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    reason: "", start_date: "", end_date: "", amount: "",
  });

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  const loadData = () => {
    if (!token) return;
    Promise.all([
      fetch("/api/employee/request-types", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/employee/my-requests", { headers: { Authorization: authHeader } }).then(r => r.json()),
    ]).then(([typesData, reqData]) => {
      setCategories(typesData?.categories || []);
      setRequests(reqData?.requests || reqData?.items || []);
    })
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  // نحسب عدد المرات اللي عمل الموظف الطلب ده
  const getTypeCount = (typeName: string, typeNameEn?: string) => {
    return requests.filter(r =>
      r.request_type === typeName ||
      (typeNameEn && r.request_type_en === typeNameEn)
    ).length;
  };

  // نجيب آخر تاريخ للطلب
  const getLastRequest = (typeName: string) => {
    const list = requests.filter(r => r.request_type === typeName);
    if (list.length === 0) return null;
    return list[0];
  };

  const handleSubmit = async () => {
    if (!selectedType || !form.reason) {
      toast.error(lang === "ar" ? "املأ الحقول" : "Fill fields");
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        request_type_id: selectedType.id,
        reason: form.reason,
      };
      if (selectedType.requires_date_range) {
        body.start_date = form.start_date;
        body.end_date = form.end_date;
      }
      if (selectedType.requires_amount) {
        body.amount = parseFloat(form.amount);
      }

      const res = await fetch("/api/employee/submit-request", {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(lang === "ar" ? "تم تقديم الطلب" : "Submitted");
        setSelectedType(null);
        setForm({ reason: "", start_date: "", end_date: "", amount: "" });
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
    const map: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
      approved: { label: d.reqApproved, color: "bg-emerald-500/10 text-emerald-700", icon: CheckCircle2 },
      pending: { label: d.reqPending, color: "bg-amber-500/10 text-amber-700", icon: Clock },
      rejected: { label: d.reqRejected, color: "bg-red-500/10 text-red-700", icon: XCircle },
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
    return new Date(dateStr).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US");
  };

  const getCatName = (c: RequestCategory) => lang === "en" && c.name_en ? c.name_en : c.name;
  const getTypeName = (t: RequestType) => lang === "en" && t.name_en ? t.name_en : t.name;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{d.myRequests}</h1>
        <p className="text-muted-foreground mt-1">
          {lang === "ar" ? "اختر قسم لتقديم طلب" : "Choose category to submit request"}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Categories with expandable types */}
          <div className="space-y-3">
            {categories.map(cat => {
              const isExpanded = expandedCategory === cat.id;
              return (
                <Card key={cat.id} className="border-2 overflow-hidden" style={{ borderColor: cat.color ? `${cat.color}40` : undefined }}>
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                    className="w-full p-5 hover:bg-muted/30 transition text-start"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: cat.color ? `${cat.color}20` : "#e0e7ff" }}
                        >
                          <FileText className="w-6 h-6" style={{ color: cat.color || "#6366f1" }} />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{getCatName(cat)}</p>
                          <p className="text-xs text-muted-foreground">
                            {cat.types?.length || 0} {lang === "ar" ? "نوع" : "types"}
                          </p>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border p-4 bg-muted/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {cat.types?.map(type => {
                          const count = getTypeCount(type.name, type.name_en);
                          const last = getLastRequest(type.name);
                          return (
                            <div
                              key={type.id}
                              onClick={() => setSelectedType(type)}
                              className="p-4 rounded-lg bg-white border border-border hover:border-brand-primary hover:shadow-md cursor-pointer transition"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <p className="font-medium text-sm">{getTypeName(type)}</p>
                                {count > 0 && (
                                  <Badge variant="outline" className="text-[10px]">
                                    {count}× {lang === "ar" ? "مرة" : "times"}
                                  </Badge>
                                )}
                              </div>
                              {last && (
                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                                  <span className="text-[10px] text-muted-foreground">
                                    {lang === "ar" ? "آخر طلب" : "Last"}:
                                  </span>
                                  {getStatusBadge(last.status)}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* History */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-primary" />
              {lang === "ar" ? "طلباتي السابقة" : "My Previous Requests"}
            </h2>
            {requests.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 mx-auto">
                    <FileText className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <p className="font-medium">{d.noRequestsData}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {requests.slice(0, 10).map(req => (
                  <Card key={req.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-semibold">
                            {lang === "en" && req.request_type_en ? req.request_type_en : req.request_type}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono mt-1" dir="ltr">
                            {formatDate(req.submitted_at)}
                          </p>
                          {req.reason && <p className="text-sm text-muted-foreground mt-2">{req.reason}</p>}
                        </div>
                        {getStatusBadge(req.status)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Submit Dialog */}
      <Dialog open={!!selectedType} onOpenChange={(open) => !open && setSelectedType(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedType && getTypeName(selectedType)}</DialogTitle>
            <DialogDescription>
              {selectedType?.description && (lang === "en" && selectedType.description_en ? selectedType.description_en : selectedType.description)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedType?.requires_date_range && (
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
            )}
            {selectedType?.requires_amount && (
              <div className="space-y-2">
                <Label>{d.requestAmount}</Label>
                <Input type="number" value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
            )}
            <div className="space-y-2">
              <Label>{d.requestReason}</Label>
              <Textarea value={form.reason}
                onChange={e => setForm({ ...form, reason: e.target.value })}
                rows={3} />
            </div>
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
