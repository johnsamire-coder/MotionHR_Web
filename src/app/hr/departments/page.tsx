"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Building2, Plus, Search, Loader2, Edit2, Trash2,
  Users, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Department {
  id: number;
  name: string;
  name_en?: string;
  description?: string;
  employee_count?: number;
}

const EMPTY = { name: "", name_en: "", description: "" };

export default function DepartmentsPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [showCreate, setShowCreate]   = useState(false);
  const [editItem, setEditItem]       = useState<Department | null>(null);
  const [deleteId, setDeleteId]       = useState<number | null>(null);
  const [form, setForm]               = useState({ ...EMPTY });
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  // ── Load ─────────────────────────────────────────────────
  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetch("/api/hr/departments", { headers: { Authorization: authHeader } })
      .then(r => r.json())
      .then(data => setDepartments(data?.departments || data || []))
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, []);

  // ── Create ────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.name) {
      toast.error(ar ? "الاسم العربي مطلوب" : "Arabic name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/hr/departments", {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(ar ? "تم إضافة القسم" : "Department added");
        setShowCreate(false);
        setForm({ ...EMPTY });
        load();
      } else {
        toast.error(data.message || (ar ? "فشل" : "Failed"));
      }
    } catch {
      toast.error(ar ? "خطأ" : "Error");
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ─────────────────────────────────────────────────
  const handleEdit = async () => {
    if (!editItem || !form.name) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/hr/departments/${editItem.id}`, {
        method: "PUT",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(ar ? "تم التعديل" : "Updated");
        setEditItem(null);
        load();
      } else {
        toast.error(data.message || (ar ? "فشل" : "Failed"));
      }
    } catch {
      toast.error(ar ? "خطأ" : "Error");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/hr/departments/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: authHeader },
      });
      if (res.ok) {
        toast.success(ar ? "تم الحذف" : "Deleted");
        setDeleteId(null);
        load();
      } else {
        const data = await res.json();
        toast.error(data.message || (ar ? "فشل الحذف — في موظفين في القسم ده" : "Delete failed — employees exist"));
      }
    } catch {
      toast.error(ar ? "خطأ" : "Error");
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (item: Department) => {
    setForm({ name: item.name, name_en: item.name_en || "", description: item.description || "" });
    setEditItem(item);
  };

  const getName = (item: Department) =>
    ar ? item.name : (item.name_en || item.name);

  const filtered = departments.filter(dep =>
    !search ||
    dep.name.includes(search) ||
    (dep.name_en || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalEmployees = departments.reduce((s, d) => s + (d.employee_count || 0), 0);

  // FormFields inline JSX (not as separate component to preserve input focus)
  const renderFormFields = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">{ar ? "الاسم بالعربي *" : "Arabic Name *"}</label>
        <Input
          value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          placeholder="الهندسة المدنية"
          dir="rtl"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">{ar ? "الاسم بالإنجليزي" : "English Name"}</label>
        <Input
          value={form.name_en}
          onChange={e => setForm(p => ({ ...p, name_en: e.target.value }))}
          placeholder="Civil Engineering"
          dir="ltr"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">{ar ? "الوصف" : "Description"}</label>
        <textarea
          value={form.description}
          onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          rows={3}
          placeholder={ar ? "وصف القسم..." : "Department description..."}
          className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background resize-none"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.departmentsTitle}</h1>
          <p className="text-muted-foreground mt-1">{d.departmentsDesc}</p>
        </div>
        <Button
          onClick={() => { setForm({ ...EMPTY }); setShowCreate(true); }}
          className="gap-2 bg-brand-primary hover:bg-brand-secondary"
        >
          <Plus className="w-4 h-4" />
          {d.addDepartment}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-brand-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{ar ? "الأقسام" : "Departments"}</p>
              <p className="text-2xl font-bold">{departments.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{ar ? "إجمالي الموظفين" : "Total Employees"}</p>
              <p className="text-2xl font-bold">{totalEmployees}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={ar ? "بحث في الأقسام..." : "Search departments..."}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-24 text-center">
            <Building2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">{ar ? "لا توجد أقسام" : "No departments"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(dep => (
            <Card key={dep.id} className="hover:shadow-md transition group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-brand-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{getName(dep)}</p>
                      {dep.name_en && dep.name !== dep.name_en && (
                        <p className="text-xs text-muted-foreground">
                          {ar ? dep.name_en : dep.name}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Actions — تظهر عند hover */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <Button
                      size="icon" variant="ghost"
                      onClick={() => openEdit(dep)}
                      className="w-7 h-7 text-muted-foreground hover:text-amber-600"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon" variant="ghost"
                      onClick={() => setDeleteId(dep.id)}
                      className="w-7 h-7 text-muted-foreground hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {dep.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {dep.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>
                      {dep.employee_count || 0} {ar ? "موظف" : "employees"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Create Dialog ── */}
      <Dialog open={showCreate} onOpenChange={v => !v && setShowCreate(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{ar ? "إضافة قسم جديد" : "Add Department"}</DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            {renderFormFields()}
            <div className="flex gap-3 mt-5">
              <Button
                onClick={handleCreate} disabled={saving}
                className="flex-1 bg-brand-primary hover:bg-brand-secondary gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {ar ? "إضافة" : "Add"}
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1">
                {ar ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog open={!!editItem} onOpenChange={v => !v && setEditItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{ar ? "تعديل القسم" : "Edit Department"}</DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            {renderFormFields()}
            <div className="flex gap-3 mt-5">
              <Button
                onClick={handleEdit} disabled={saving}
                className="flex-1 bg-amber-600 hover:bg-amber-700 gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
                {ar ? "حفظ" : "Save"}
              </Button>
              <Button variant="outline" onClick={() => setEditItem(null)} className="flex-1">
                {ar ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{ar ? "حذف القسم" : "Delete Department"}</AlertDialogTitle>
            <AlertDialogDescription>
              {ar
                ? "لو في موظفين في القسم ده، مش هينحذف. لازم تنقل الموظفين الأول."
                : "If there are employees in this department, deletion will fail. Move them first."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{ar ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete} disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : null}
              {ar ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
