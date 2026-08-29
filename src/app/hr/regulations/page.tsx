"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  ScrollText, Plus, Loader2, Edit2, Trash2, Upload, X,
  Users, Building2, GitBranch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Charter {
  id: number;
  title: string;
  introduction: string;
  content: string;
  version: number;
  is_active: boolean;
  is_mandatory: boolean;
  target_roles: string[];
  target_departments: number[];
  target_department_names: string[];
  target_branches: number[];
  target_branch_names: string[];
  attachment_url?: string;
  attachment_name?: string;
  created_at: string;
}

interface Department {
  id: number;
  name_ar: string;
}

interface Branch {
  id: number;
  name_ar: string;
}

const ROLE_OPTIONS = [
  { key: "employee", label_ar: "موظف", label_en: "Employee" },
  { key: "manager", label_ar: "مدير", label_en: "Manager" },
  { key: "hr_manager", label_ar: "مدير موارد بشرية", label_en: "HR Manager" },
  { key: "company_admin", label_ar: "صاحب الشركة", label_en: "Company Admin" },
];

export default function HRRegulationsPage() {
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";
  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;

  const [charters, setCharters] = useState<Charter[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [content, setContent] = useState("");
  const [isMandatory, setIsMandatory] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedDepts, setSelectedDepts] = useState<number[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<number[]>([]);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [charterRes, deptRes, branchRes] = await Promise.all([
        fetch("/api/hr/charters", { headers: { Authorization: authH } }).then((r) => r.json()),
        fetch("/api/departments", { headers: { Authorization: authH } }).then((r) => r.json()),
        fetch("/api/branches", { headers: { Authorization: authH } }).then((r) => r.json()),
      ]);
      setCharters(charterRes.charters || []);
      setDepartments(deptRes.departments || []);
      setBranches(branchRes.branches || []);
    } catch {
      toast.error(ar ? "فشل تحميل البيانات" : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [token, authH, ar]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setTitle("");
    setIntroduction("");
    setContent("");
    setIsMandatory(true);
    setSelectedRoles([]);
    setSelectedDepts([]);
    setSelectedBranches([]);
    setAttachmentFile(null);
    setEditingId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (c: Charter) => {
    setTitle(c.title);
    setIntroduction(c.introduction);
    setContent(c.content);
    setIsMandatory(c.is_mandatory);
    setSelectedRoles(c.target_roles || []);
    setSelectedDepts(c.target_departments || []);
    setSelectedBranches(c.target_branches || []);
    setAttachmentFile(null);
    setEditingId(c.id);
    setModalOpen(true);
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const toggleDept = (id: number) => {
    setSelectedDepts((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const toggleBranch = (id: number) => {
    setSelectedBranches((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error(ar ? "العنوان والمحتوى مطلوبين" : "Title and content are required");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("introduction", introduction);
      fd.append("content", content);
      fd.append("is_mandatory", isMandatory ? "true" : "false");
      fd.append("target_roles", JSON.stringify(selectedRoles));
      fd.append("target_departments", JSON.stringify(selectedDepts));
      fd.append("target_branches", JSON.stringify(selectedBranches));
      if (attachmentFile) {
        fd.append("attachment", attachmentFile);
      }

      const url = editingId ? `/api/hr/charters/${editingId}/update` : "/api/hr/charters/create";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { Authorization: authH },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || (ar ? "فشل الحفظ" : "Save failed"));
      }
      toast.success(editingId ? (ar ? "تم تحديث اللائحة" : "Charter updated") : (ar ? "تم إنشاء اللائحة" : "Charter created"));
      setModalOpen(false);
      resetForm();
      load();
    } catch (e: any) {
      toast.error(e.message || (ar ? "فشل الحفظ" : "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(ar ? "هل أنت متأكد من حذف هذه اللائحة؟" : "Are you sure you want to delete this charter?")) return;
    try {
      const res = await fetch(`/api/hr/charters/${id}/delete`, {
        method: "DELETE",
        headers: { Authorization: authH },
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || (ar ? "فشل الحذف" : "Delete failed"));
      }
      toast.success(ar ? "تم حذف اللائحة" : "Charter deleted");
      load();
    } catch (e: any) {
      toast.error(e.message || (ar ? "فشل الحذف" : "Delete failed"));
    }
  };

  const targetSummary = (c: Charter) => {
    const parts: string[] = [];
    if (c.target_roles?.length) {
      const roleLabels = c.target_roles.map(
        (r) => ROLE_OPTIONS.find((o) => o.key === r)?.[ar ? "label_ar" : "label_en"] || r
      );
      parts.push(roleLabels.join("، "));
    }
    if (c.target_department_names?.length) {
      parts.push(c.target_department_names.join("، "));
    }
    if (c.target_branch_names?.length) {
      parts.push(c.target_branch_names.join("، "));
    }
    if (!parts.length) return ar ? "كل الموظفين" : "All Employees";
    return parts.join(" | ");
  };

  return (
    <div className="space-y-6 max-w-5xl" dir={ar ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{ar ? "لوائح العمل" : "Work Regulations"}</h1>
          <p className="text-muted-foreground mt-1">
            {ar ? "إدارة لوائح العمل الموجهة لفئات مختلفة من الموظفين" : "Manage work charters targeted at different employee groups"}
          </p>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="w-4 h-4" />
          {ar ? "إنشاء لائحة جديدة" : "New Charter"}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : charters.length === 0 ? (
        <Card>
          <CardContent className="py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 mx-auto">
              <ScrollText className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="font-medium mb-2">{ar ? "لا توجد لوائح بعد" : "No charters yet"}</p>
            <Button onClick={openCreateModal} className="gap-2">
              <Plus className="w-4 h-4" />
              {ar ? "إنشاء أول لائحة" : "Create First Charter"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {charters.map((c) => (
            <Card key={c.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-lg">{c.title}</h3>
                      {c.is_mandatory && (
                        <Badge variant="secondary">{ar ? "إجباري" : "Mandatory"}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{targetSummary(c)}</p>
                    {c.introduction && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{c.introduction}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => openEditModal(c)} className="gap-2">
                      <Edit2 className="w-4 h-4" />
                      {ar ? "تعديل" : "Edit"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(c.id)} className="gap-2 text-destructive">
                      <Trash2 className="w-4 h-4" />
                      {ar ? "حذف" : "Delete"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={ar ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{editingId ? (ar ? "تعديل اللائحة" : "Edit Charter") : (ar ? "إنشاء لائحة جديدة" : "New Charter")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">{ar ? "العنوان" : "Title"}</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={ar ? "مثال: لائحة المديرين" : "e.g. Managers Charter"} />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">{ar ? "مقدمة (اختياري)" : "Introduction (optional)"}</label>
              <Textarea value={introduction} onChange={(e) => setIntroduction(e.target.value)} rows={2} />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">{ar ? "المحتوى" : "Content"}</label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} placeholder={ar ? "بنود اللائحة..." : "Charter terms..."} />
            </div>

            <div className="space-y-2 border rounded-lg p-3">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4" />
                {ar ? "استهداف حسب الدور (اتركه فارغاً للكل)" : "Target by Role (leave empty for all)"}
              </label>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => toggleRole(r.key)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      selectedRoles.includes(r.key)
                        ? "bg-brand-primary text-white border-brand-primary"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    {ar ? r.label_ar : r.label_en}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 border rounded-lg p-3">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                {ar ? "استهداف حسب القسم (اتركه فارغاً للكل)" : "Target by Department (leave empty for all)"}
              </label>
              <div className="flex flex-wrap gap-2">
                {departments.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDept(d.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      selectedDepts.includes(d.id)
                        ? "bg-brand-primary text-white border-brand-primary"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    {d.name_ar}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 border rounded-lg p-3">
              <label className="text-sm font-semibold flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                {ar ? "استهداف حسب الفرع (اتركه فارغاً للكل)" : "Target by Branch (leave empty for all)"}
              </label>
              <div className="flex flex-wrap gap-2">
                {branches.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => toggleBranch(b.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      selectedBranches.includes(b.id)
                        ? "bg-brand-primary text-white border-brand-primary"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    {b.name_ar}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isMandatory"
                checked={isMandatory}
                onChange={(e) => setIsMandatory(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="isMandatory" className="text-sm font-medium">
                {ar ? "إجباري (يجب على الموظف الموافقة)" : "Mandatory (employee must accept)"}
              </label>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">{ar ? "ملف مرفق (اختياري)" : "Attachment (optional)"}</label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer hover:bg-muted text-sm">
                  <Upload className="w-4 h-4" />
                  {attachmentFile ? attachmentFile.name : (ar ? "اختر ملف" : "Choose file")}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                  />
                </label>
                {attachmentFile && (
                  <Button variant="ghost" size="icon" onClick={() => setAttachmentFile(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                {ar ? "إلغاء" : "Cancel"}
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {ar ? "حفظ" : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
