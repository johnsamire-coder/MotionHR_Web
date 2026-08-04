"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  FileText, ChevronRight, ChevronLeft, Loader2,
  Plus, X, Send, Clock, CheckCircle2, XCircle,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface FormField {
  key: string;
  type: "text" | "textarea" | "number" | "date" | "time" | "select" | "boolean";
  label_ar: string;
  label_en: string;
  required: boolean;
  options?: { value: string; label_ar: string; label_en: string }[];
}

interface RequestType {
  id: number;
  name: string;
  name_en?: string;
  description?: string;
  description_en?: string;
  requires_amount: boolean;
  requires_date_range: boolean;
  requires_document: boolean;
  form_schema?: { fields: FormField[] };
}

interface RequestCategory {
  id: number;
  name: string;
  name_en?: string;
  icon?: string;
  color?: string;
  types: RequestType[];
}

interface MyRequest {
  id: number;
  request_type_name: string;
  status: string;
  status_display?: string;
  created_at: string;
  details?: Record<string, unknown>;
}

const STATUS_COLORS: Record<string, string> = {
  pending:  "bg-amber-500/10 text-amber-700",
  approved: "bg-emerald-500/10 text-emerald-700",
  rejected: "bg-red-500/10 text-red-700",
};

export default function EmployeeRequestsPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";

  const [categories, setCategories]     = useState<RequestCategory[]>([]);
  const [myRequests, setMyRequests]     = useState<MyRequest[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selectedCat, setSelectedCat]  = useState<RequestCategory | null>(null);
  const [selectedType, setSelectedType] = useState<RequestType | null>(null);
  const [formData, setFormData]         = useState<Record<string, string>>({});
  const [submitting, setSubmitting]     = useState(false);
  const [tab, setTab]                   = useState<"new" | "history">("new");

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;
  const langHeader = ar ? "ar" : "en";

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [catRes, myRes] = await Promise.all([
        fetch("/api/employee/request-types", {
          headers: { Authorization: authHeader, "Accept-Language": langHeader },
        }),
        fetch("/api/employee/my-requests", {
          headers: { Authorization: authHeader, "Accept-Language": langHeader },
        }),
      ]);
      const [catData, myData] = await Promise.all([catRes.json(), myRes.json()]);
      setCategories(catData?.categories || []);
      setMyRequests(myData?.requests || myData?.results || myData || []);
    } catch {
      toast.error(ar ? "فشل تحميل البيانات" : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token, ar]);

  useEffect(() => { load(); }, [load]);

  // ── Open Type Dialog ────────────────────────────────────
  const openType = (type: RequestType) => {
    setSelectedType(type);
    setFormData({}); // ← reset كل مرة
  };

  // ── Submit ──────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedType) return;

    // Validate required fields
    const fields = selectedType.form_schema?.fields || [];
    for (const f of fields) {
      if (f.required && !formData[f.key]) {
        toast.error(
          ar
            ? `حقل "${f.label_ar}" مطلوب`
            : `"${f.label_en}" is required`
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        request_type_id: selectedType.id,
        form_data: formData,
      };

      const res = await fetch("/api/employee/request-types", {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
          "Accept-Language": langHeader,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && (data.success !== false)) {
        toast.success(ar ? "تم تقديم الطلب ✅" : "Request submitted ✅");
        setSelectedType(null);
        setSelectedCat(null);
        setFormData({});
        await load();
        setTab("history");
      } else {
        toast.error(data.message || data.error || (ar ? "فشل" : "Failed"));
      }
    } catch {
      toast.error(ar ? "خطأ في الشبكة" : "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render Form Field ───────────────────────────────────
  const renderField = (field: FormField) => {
    const label = ar ? field.label_ar : field.label_en;
    const value = formData[field.key] || "";
    const set = (v: string) => setFormData(p => ({ ...p, [field.key]: v }));

    const baseClass = "w-full border border-border rounded-md px-3 py-2 text-sm bg-background";

    return (
      <div key={field.key}>
        <label className="text-sm font-medium mb-1 block">
          {label} {field.required && <span className="text-red-500">*</span>}
        </label>
        {field.type === "textarea" ? (
          <textarea
            value={value}
            onChange={e => set(e.target.value)}
            rows={3}
            className={`${baseClass} resize-none`}
          />
        ) : field.type === "select" ? (
          <select value={value} onChange={e => set(e.target.value)} className={baseClass}>
            <option value="">{ar ? "اختر..." : "Select..."}</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>
                {ar ? opt.label_ar : opt.label_en}
              </option>
            ))}
          </select>
        ) : field.type === "boolean" ? (
          <div className="flex gap-3">
            {["true", "false"].map(v => (
              <button
                key={v}
                onClick={() => set(v)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${
                  value === v
                    ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                {v === "true" ? (ar ? "نعم" : "Yes") : (ar ? "لا" : "No")}
              </button>
            ))}
          </div>
        ) : (
          <Input
            type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "time" ? "time" : "text"}
            value={value}
            onChange={e => set(e.target.value)}
          />
        )}
      </div>
    );
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString(ar ? "ar-EG" : "en-US", {
      year: "numeric", month: "short", day: "numeric",
    });

  return (
    <div className="space-y-6 pb-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {ar ? "طلباتي" : "My Requests"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {ar ? "قدم طلباتك وتابع حالتها" : "Submit and track your requests"}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {[
          { key: "new",     label: ar ? "طلب جديد"   : "New Request" },
          { key: "history", label: ar ? "سجل الطلبات" : "History",
            badge: myRequests.filter(r => r.status === "pending").length || undefined },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as "new" | "history")}
            className={`pb-3 px-2 text-sm font-medium border-b-2 flex items-center gap-2 transition ${
              tab === t.key
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.badge ? (
              <Badge className="bg-amber-500/10 text-amber-700 border-0 text-[10px]">{t.badge}</Badge>
            ) : null}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : tab === "new" ? (
        !selectedCat ? (
          // ── Categories Grid ───────────────────────────────
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map(cat => (
              <Card
                key={cat.id}
                onClick={() => setSelectedCat(cat)}
                className="cursor-pointer hover:shadow-md transition hover:-translate-y-0.5"
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl"
                        style={{ backgroundColor: cat.color || "#1A1B4B" }}
                      >
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold">
                          {ar ? cat.name : (cat.name_en || cat.name)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {cat.types.length} {ar ? "بنود" : "types"}
                        </p>
                      </div>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // ── Types List ────────────────────────────────────
          <div className="space-y-3">
            <Button
              variant="ghost"
              onClick={() => setSelectedCat(null)}
              className="gap-2 text-muted-foreground"
            >
              <ChevronRight className="w-4 h-4" />
              {ar ? "العودة للأقسام" : "Back to Categories"}
            </Button>
            <h2 className="text-lg font-semibold">
              {ar ? selectedCat.name : (selectedCat.name_en || selectedCat.name)}
            </h2>
            {selectedCat.types.map(type => (
              <Card
                key={type.id}
                onClick={() => openType(type)}
                className="cursor-pointer hover:shadow-md transition"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">
                        {ar ? type.name : (type.name_en || type.name)}
                      </p>
                      {type.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {ar ? type.description : (type.description_en || type.description)}
                        </p>
                      )}
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {type.requires_amount && (
                          <Badge variant="outline" className="text-[10px]">
                            {ar ? "مبلغ" : "Amount"}
                          </Badge>
                        )}
                        {type.requires_document && (
                          <Badge variant="outline" className="text-[10px]">
                            {ar ? "مستند" : "Document"}
                          </Badge>
                        )}
                        {type.requires_date_range && (
                          <Badge variant="outline" className="text-[10px]">
                            {ar ? "فترة" : "Period"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Plus className="w-5 h-5 text-brand-primary" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        // ── History Tab ─────────────────────────────────────
        myRequests.length === 0 ? (
          <Card>
            <CardContent className="py-24 text-center">
              <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {ar ? "لا توجد طلبات" : "No requests yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {myRequests.map(req => {
              const sc = STATUS_COLORS[req.status] || STATUS_COLORS.pending;
              return (
                <Card key={req.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{req.request_type_name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {fmtDate(req.created_at)}
                        </p>
                      </div>
                      <Badge className={`${sc} border-0 text-xs`}>
                        {req.status_display || req.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* ── Request Form Dialog ── */}
      <Dialog open={!!selectedType} onOpenChange={v => !v && setSelectedType(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedType && (ar ? selectedType.name : (selectedType.name_en || selectedType.name))}
            </DialogTitle>
          </DialogHeader>

          {selectedType && (
            <div className="space-y-4 pt-2">
              {/* Description */}
              {selectedType.description && (
                <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                  {ar ? selectedType.description : (selectedType.description_en || selectedType.description)}
                </p>
              )}

              {/* Dynamic Fields from form_schema */}
              {(selectedType.form_schema?.fields || []).map(field => renderField(field))}

              {/* Document Upload hint */}
              {selectedType.requires_document && (
                <div className="border border-dashed border-border rounded-lg p-4 text-center text-sm text-muted-foreground">
                  <Upload className="w-6 h-6 mx-auto mb-2" />
                  {ar ? "رفع مستند (قريباً)" : "Upload document (coming soon)"}
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 bg-brand-primary hover:bg-brand-secondary gap-2"
                >
                  {submitting
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />}
                  {ar ? "تقديم الطلب" : "Submit"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setSelectedType(null); setFormData({}); }}
                  className="flex-1"
                >
                  {ar ? "إلغاء" : "Cancel"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
