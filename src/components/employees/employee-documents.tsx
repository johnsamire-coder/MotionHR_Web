"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { FileText, Loader2, Plus, Pencil, Trash2, X, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface EmpDocument {
  id: number;
  document_type: string;
  document_type_code: string;
  title: string;
  file_url?: string | null;
  issue_date?: string | null;
  expiry_date?: string | null;
  is_expired: boolean;
  expires_soon: boolean;
  days_left?: number | null;
  notes?: string | null;
}

const DOC_TYPES: { code: string; ar: string; en: string }[] = [
  { code: "national_id", ar: "صورة البطاقة", en: "National ID" },
  { code: "passport", ar: "جواز السفر", en: "Passport" },
  { code: "contract", ar: "العقد", en: "Contract" },
  { code: "certificate", ar: "شهادة", en: "Certificate" },
  { code: "cv", ar: "السيرة الذاتية", en: "CV" },
  { code: "medical", ar: "ملف طبي", en: "Medical" },
  { code: "license", ar: "رخصة", en: "License" },
  { code: "insurance", ar: "وثيقة تأمين", en: "Insurance" },
  { code: "other", ar: "أخرى", en: "Other" },
];

const BACKEND = "https://jssolutions-eg.com";
const fileHref = (u?: string | null) => (u ? (u.startsWith("/") ? `${BACKEND}${u}` : u) : "");

const EMPTY_FORM = { document_type: "national_id", title: "", issue_date: "", expiry_date: "", notes: "" };

export default function EmployeeDocuments({ employeeId, ar, authH }: { employeeId: number; ar: boolean; authH: string }) {
  const [docs, setDocs] = useState<EmpDocument[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EmpDocument | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hr/employees/${employeeId}/documents`, { headers: { Authorization: authH } });
      const data = await res.json();
      setDocs(Array.isArray(data?.documents) ? data.documents : []);
      setCanEdit(!!data?.can_edit);
    } catch {
      toast.error(ar ? "تعذر تحميل المستندات" : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [employeeId, authH, ar]);

  useEffect(() => { load(); }, [load]);

  const typeLabel = (code: string, fallback: string) => {
    const t = DOC_TYPES.find((x) => x.code === code);
    return t ? (ar ? t.ar : t.en) : fallback;
  };

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFile(null);
    setShowForm(true);
  };

  const openEdit = (d: EmpDocument) => {
    setEditing(d);
    setForm({
      document_type: d.document_type_code || "other",
      title: d.title || "",
      issue_date: d.issue_date || "",
      expiry_date: d.expiry_date || "",
      notes: d.notes || "",
    });
    setFile(null);
    setShowForm(true);
  };

  const save = async () => {
    if (!editing && !file) {
      toast.error(ar ? "اختار الملف الأول" : "Choose a file first");
      return;
    }
    if (form.issue_date && form.expiry_date && form.expiry_date < form.issue_date) {
      toast.error(ar ? "تاريخ الانتهاء لازم يكون بعد تاريخ الإصدار" : "Expiry must be after issue date");
      return;
    }
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append("file", file);
    setSaving(true);
    try {
      const res = await fetch(
        `/api/hr/employees/${employeeId}/documents${editing ? `/${editing.id}` : ""}`,
        { method: editing ? "PATCH" : "POST", headers: { Authorization: authH }, body: fd },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        toast.error(data?.message || (ar ? "حصلت مشكلة في الحفظ" : "Save failed"));
        return;
      }
      toast.success(ar ? "تم حفظ المستند" : "Document saved");
      setShowForm(false);
      load();
    } catch {
      toast.error(ar ? "حصلت مشكلة في الحفظ" : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (d: EmpDocument) => {
    if (!window.confirm(ar ? `مسح المستند "${d.title}"؟` : `Delete "${d.title}"?`)) return;
    const res = await fetch(`/api/hr/employees/${employeeId}/documents/${d.id}`, {
      method: "DELETE", headers: { Authorization: authH },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.success === false) {
      toast.error(data?.message || (ar ? "تعذر المسح" : "Delete failed"));
      return;
    }
    toast.success(ar ? "تم مسح المستند" : "Document deleted");
    load();
  };

  const expiryBadge = (d: EmpDocument) => {
    if (!d.expiry_date) return null;
    if (d.is_expired) return <Badge variant="destructive" className="text-[10px]">{ar ? "منتهي" : "Expired"}</Badge>;
    if (d.expires_soon) {
      const n = d.days_left ?? 0;
      return (
        <Badge className="text-[10px] bg-amber-100 text-amber-700 hover:bg-amber-100">
          {n === 0 ? (ar ? "بينتهي النهارده" : "Expires today") : ar ? `باقي ${n} يوم` : `${n} days left`}
        </Badge>
      );
    }
    return <Badge variant="secondary" className="text-[10px]">{ar ? "ساري" : "Valid"}</Badge>;
  };

  const expiredCount = docs.filter((d) => d.is_expired).length;
  const soonCount = docs.filter((d) => d.expires_soon && !d.is_expired).length;
  const inputCls = "w-full border rounded-md px-3 py-2 text-sm bg-background";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-lg font-semibold">{ar ? "ملف الموظف - المستندات" : "Employee Folder - Documents"}</h3>
        {canEdit && (
          <Button size="sm" onClick={openAdd} className="gap-1">
            <Plus className="w-4 h-4" />{ar ? "إضافة مستند" : "Add Document"}
          </Button>
        )}
      </div>

      {(expiredCount > 0 || soonCount > 0) && (
        <div className="flex gap-2 flex-wrap text-xs">
          {expiredCount > 0 && <Badge variant="destructive">{ar ? `${expiredCount} منتهي` : `${expiredCount} expired`}</Badge>}
          {soonCount > 0 && (
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
              {ar ? `${soonCount} بينتهي خلال شهر` : `${soonCount} expiring within a month`}
            </Badge>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : docs.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">{ar ? "لا توجد مستندات" : "No documents"}</p>
      ) : (
        <div className="space-y-2">
          {docs.map((d) => (
            <Card key={d.id}>
              <CardContent className="p-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <FileText className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm break-words">{d.title || typeLabel(d.document_type_code, d.document_type)}</p>
                    <p className="text-xs text-muted-foreground">{typeLabel(d.document_type_code, d.document_type)}</p>
                    <div className="text-xs text-muted-foreground mt-1 flex gap-3 flex-wrap">
                      {d.issue_date && <span>{ar ? "إصدار:" : "Issued:"} {d.issue_date}</span>}
                      {d.expiry_date && <span>{ar ? "انتهاء:" : "Expires:"} {d.expiry_date}</span>}
                    </div>
                    {d.notes && <p className="text-xs text-muted-foreground mt-1 break-words">{d.notes}</p>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {expiryBadge(d)}
                  <div className="flex items-center gap-2">
                    {d.file_url && (
                      <a href={fileHref(d.file_url)} target="_blank" rel="noopener noreferrer"
                        className="text-brand-primary text-xs hover:underline">
                        {ar ? "فتح" : "Open"}
                      </a>
                    )}
                    {canEdit && (
                      <>
                        <button type="button" onClick={() => openEdit(d)} title={ar ? "تعديل" : "Edit"}
                          className="text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                        <button type="button" onClick={() => remove(d)} title={ar ? "مسح" : "Delete"}
                          className="text-red-500 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir={ar ? "rtl" : "ltr"}>
          <div className="bg-background rounded-xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {editing ? (ar ? "تعديل مستند" : "Edit Document") : (ar ? "إضافة مستند" : "Add Document")}
              </h3>
              <button type="button" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">{ar ? "نوع المستند *" : "Document Type *"}</label>
                <select className={inputCls} value={form.document_type}
                  onChange={(e) => setForm((p) => ({ ...p, document_type: e.target.value }))}>
                  {DOC_TYPES.map((t) => <option key={t.code} value={t.code}>{ar ? t.ar : t.en}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">{ar ? "اسم المستند" : "Title"}</label>
                <input className={inputCls} value={form.title} maxLength={200}
                  placeholder={ar ? "مثلاً: رخصة القيادة" : "e.g. Driving license"}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  {editing ? (ar ? "استبدال الملف (اختياري)" : "Replace file (optional)") : (ar ? "الملف *" : "File *")}
                </label>
                <input type="file" className={inputCls} accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.gif,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">{ar ? "تاريخ الإصدار" : "Issue Date"}</label>
                  <input type="date" className={inputCls} value={form.issue_date}
                    onChange={(e) => setForm((p) => ({ ...p, issue_date: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">{ar ? "تاريخ الانتهاء" : "Expiry Date"}</label>
                  <input type="date" className={inputCls} value={form.expiry_date}
                    onChange={(e) => setForm((p) => ({ ...p, expiry_date: e.target.value }))} />
                </div>
              </div>
              {form.expiry_date && (
                <p className="text-xs text-muted-foreground flex items-start gap-1">
                  <BellRing className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  {ar
                    ? "هيوصل تنبيه للموظف ومديره المباشر والموارد البشرية قبل الانتهاء بشهر، وبأسبوع، وبيوم، ويوم الانتهاء نفسه."
                    : "The employee, their manager and HR get reminders a month, a week and a day before expiry, and on the day."}
                </p>
              )}
              <div>
                <label className="text-xs text-muted-foreground block mb-1">{ar ? "ملاحظات" : "Notes"}</label>
                <textarea className={inputCls} rows={2} value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)} disabled={saving}>{ar ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={save} disabled={saving} className="gap-1">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}{ar ? "حفظ" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
