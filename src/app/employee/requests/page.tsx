"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { FileText, Plus, Loader2, CheckCircle2, Clock, XCircle } from "lucide-react";
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

interface RequestItem {
  id: number;
  request_type?: string;
  request_type_en?: string;
  submitted_at?: string;
  status?: string;
  reason?: string;
}

interface RequestType {
  id: number;
  name: string;
  name_en?: string;
  category_name?: string;
  requires_date_range?: boolean;
  requires_amount?: boolean;
}

interface RequestCategory {
  id: number;
  name: string;
  name_en?: string;
  types: RequestType[];
}

export default function MyRequestsPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [categories, setCategories] = useState<RequestCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    request_type_id: "",
    reason: "",
    start_date: "",
    end_date: "",
    amount: "",
  });

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  const loadData = () => {
    if (!token) return;
    Promise.all([
      fetch("/api/employee/my-requests", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/employee/request-types", { headers: { Authorization: authHeader } }).then(r => r.json()),
    ]).then(([reqData, typesData]) => {
      setRequests(reqData?.requests || reqData?.items || []);
      setCategories(typesData?.categories || []);
    })
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const allTypes: RequestType[] = categories.flatMap(c =>
    (c.types || []).map(t => ({ ...t, category_name: lang === "en" && c.name_en ? c.name_en : c.name }))
  );

  const selectedType = allTypes.find(t => String(t.id) === form.request_type_id);

  const handleSubmit = async () => {
    if (!form.request_type_id || !form.reason) {
      toast.error(lang === "ar" ? "املأ الحقول المطلوبة" : "Fill required fields");
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        request_type_id: parseInt(form.request_type_id),
        reason: form.reason,
      };
      if (selectedType?.requires_date_range) {
        body.start_date = form.start_date;
        body.end_date = form.end_date;
      }
      if (selectedType?.requires_amount) {
        body.amount = parseFloat(form.amount);
      }

      const res = await fetch("/api/employee/submit-request", {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(lang === "ar" ? "تم تقديم الطلب" : "Request submitted");
        setDialogOpen(false);
        setForm({ request_type_id: "", reason: "", start_date: "", end_date: "", amount: "" });
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
    return new Date(dateStr).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US");
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.myRequests}</h1>
          <p className="text-muted-foreground mt-1">{d.requestsDesc}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-brand-primary hover:bg-brand-primary/90 gap-2">
          <Plus className="w-4 h-4" />{d.submitRequest}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 mx-auto">
              <FileText className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="font-medium mb-4">{d.noRequestsData}</p>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />{d.submitRequest}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <Card key={req.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-brand-primary" />
                    </div>
                    <div>
                      <p className="font-semibold mb-1">
                        {lang === "en" && req.request_type_en ? req.request_type_en : (req.request_type || "—")}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono" dir="ltr">
                        {formatDate(req.submitted_at)}
                      </p>
                      {req.reason && <p className="text-sm text-muted-foreground mt-2">{req.reason}</p>}
                    </div>
                  </div>
                  {getStatusBadge(req.status)}
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
            <DialogTitle>{d.submitRequest}</DialogTitle>
            <DialogDescription>
              {lang === "ar" ? "قدم طلب جديد" : "Submit a new request"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{d.requestType}</Label>
              <Select value={form.request_type_id} onValueChange={v => setForm({ ...form, request_type_id: v })}>
                <SelectTrigger><SelectValue placeholder={lang === "ar" ? "اختر النوع" : "Select type"} /></SelectTrigger>
                <SelectContent>
                  {allTypes.map(t => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {lang === "en" && t.name_en ? t.name_en : t.name}
                      {t.category_name && (
                        <span className="text-[10px] text-muted-foreground mr-2">
                          ({t.category_name})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
