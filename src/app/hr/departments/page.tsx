"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Building2, Plus, Search, Loader2, Edit2, Trash2,
  Users, MapPin, Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
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
  name_ar: string;
  name_en?: string;
  code?: string;
  description?: string;
  employees_count?: number;
  employee_count?: number;
  branch_id?: number | null;
  branch_name?: string | null;
}

interface BranchItem {
  id: number;
  name_ar: string;
  name_en?: string;
}

const EMPTY = { name_ar: "", name_en: "", code: "", description: "", branch_id: "" };

export default function DepartmentsPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";

  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches]       = useState<BranchItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [branchFilter, setBranchFilter] = useState("all");

  const [showCreate, setShowCreate]   = useState(false);
  const [editItem, setEditItem]       = useState<Department | null>(null);
  const [deleteId, setDeleteId]       = useState<number | null>(null);
  const [form, setForm]               = useState({ ...EMPTY });
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") || token?.startsWith("Bearer ") ? token : `Token ${token}`;

  // ── Load ─────────────────────────────────────────────────
  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    const ts = Date.now();
    Promise.all([
      fetch(`/api/hr/departments?t=${ts}`, { headers: { Authorization: authHeader }, cache: "no-store" }).then(r => r.json()),
      fetch(`/api/branches?t=${ts}`, { headers: { Authorization: authHeader }, cache: "no-store" }).then(r => r.json()),
    ])
      .then(([depData, brData]) => {
        setDepartments(depData?.departments || (Array.isArray(depData) ? depData : []));
        setBranches(Array.isArray(brData) ? brData : (brData?.branches || []));
      })
      .catch(() => toast.error(d.failedLoad || (ar ? "فشل تحميل البيانات" : "Failed to load data")))
      .finally(() => setLoading(false));
  }, [token, authHeader]);

  useEffect(() => { load(); }, [load]);

  // ── Create ────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.name_ar.trim()) {
      toast.error(ar ? "اسم القسم بالعربي مطلوب" : "Arabic name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/hr/departments", {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          branch_id: form.branch_id ? Number(form.branch_id) : null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        toast.success(ar ? "تم إضافة القسم بنجاح ✅" : "Department added ✅");
        setShowCreate(false);
        setForm({ ...EMPTY });
        load();
      } else {
        toast.error(data.error || data.message || (ar ? "فشل إضافة القسم" : "Failed to add department"));
      }
    } catch {
      toast.error(ar ? "حدث خطأ أثناء الحفظ" : "Error saving department");
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ─────────────────────────────────────────────────
  const handleEdit = async () => {
    if (!editItem || !form.name_ar.trim()) return;
    setSaving(true);
    try {
      const selectedBranch = branches.find(b => String(b.id) === String(form.branch_id));
      const res = await fetch(`/api/hr/departments/${editItem.id}`, {
        method: "PUT",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editItem.id,
          name_ar: form.name_ar,
          name_en: form.name_en,
          code: form.code,
          description: form.description,
          branch_id: form.branch_id ? Number(form.branch_id) : null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        toast.success(ar ? "تم تعديل القسم بنجاح ✅" : "Department updated ✅");

        // تحديث الـ State فورياً
        setDepartments(prev => prev.map(d => d.id === editItem.id ? {
          ...d,
          name_ar: form.name_ar,
          name_en: form.name_en,
          code: form.code,
          description: form.description,
          branch_id: form.branch_id ? Number(form.branch_id) : null,
          branch_name: selectedBranch ? (ar ? selectedBranch.name_ar : (selectedBranch.name_en || selectedBranch.name_ar)) : null,
        } : d));

        setEditItem(null);
        load();
      } else {
        toast.error(data.error || data.message || (ar ? "فشل التعديل" : "Failed to update"));
      }
    } catch {
      toast.error(ar ? "حدث خطأ أثناء التعديل" : "Error updating department");
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
      const data = await res.json();
      if (res.ok && data.success !== false) {
        toast.success(ar ? "تم حذف القسم بنجاح 🗑️" : "Department deleted 🗑️");

        // مسح القسم من القائمة فوراً
        setDepartments(prev => prev.filter(d => d.id !== deleteId));
        setDeleteId(null);
        load();
      } else {
        toast.error(data.error || data.message || (ar ? "لا يمكن حذف هذا القسم" : "Cannot delete department"));
      }
    } catch {
      toast.error(ar ? "حدث خطأ أثناء الحذف" : "Error deleting department");
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (item: Department) => {
    setForm({
      name_ar: item.name_ar || "",
      name_en: item.name_en || "",
      code: item.code || "",
      description: item.description || "",
      branch_id: item.branch_id ? String(item.branch_id) : "",
    });
    setEditItem(item);
  };

  const getName = (item: Department) =>
    !ar && item.name_en ? item.name_en : item.name_ar;

  const getBranchDisplay = (item: Department) => {
    if (item.branch_name) return item.branch_name;
    if (item.branch_id) {
      const br = branches.find(b => b.id === item.branch_id);
      if (br) return ar ? br.name_ar : (br.name_en || br.name_ar);
    }
    return ar ? "المكتب الرئيسي" : "Main Office";
  };

  const filtered = departments.filter(dep => {
    const matchSearch = !search ||
      (dep.name_ar || "").includes(search) ||
      (dep.name_en || "").toLowerCase().includes(search.toLowerCase()) ||
      (dep.branch_name || "").includes(search);

    const matchBranch = branchFilter === "all" || String(dep.branch_id) === branchFilter;

    return matchSearch && matchBranch;
  });

  const totalEmployees = departments.reduce((s, d) => s + (d.employees_count || d.employee_count || 0), 0);

  const renderFormFields = () => (
    <div className="space-y-4 py-2">
      <div>
        <label className="text-xs font-semibold mb-1 block">{ar ? "اسم القسم (بالعربي) *" : "Arabic Name *"}</label>
        <Input
          value={form.name_ar}
          onChange={e => setForm(p => ({ ...p, name_ar: e.target.value }))}
          placeholder="مثال: الإدارة الهندسية والمشروعات"
          dir="rtl"
        />
      </div>
      <div>
        <label className="text-xs font-semibold mb-1 block">{ar ? "اسم القسم (بالإنجليزي)" : "English Name"}</label>
        <Input
          value={form.name_en}
          onChange={e => setForm(p => ({ ...p, name_en: e.target.value }))}
          placeholder="Example: Engineering Department"
          dir="ltr"
        />
      </div>
      <div>
        <label className="text-xs font-semibold mb-1 block">{ar ? "الفرع / الموقع التابع له *" : "Branch / Site *"}</label>
        <select
          value={form.branch_id}
          onChange={e => setForm(p => ({ ...p, branch_id: e.target.value }))}
          className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
        >
          <option value="">{ar ? "-- اختر الفرع أو الموقع --" : "-- Select Branch / Site --"}</option>
          {branches.map(b => (
            <option key={b.id} value={b.id}>{ar ? b.name_ar : (b.name_en || b.name_ar)}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold mb-1 block">{ar ? "الوصف أو المهام" : "Description"}</label>
        <textarea
          value={form.description}
          onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          rows={3}
          placeholder={ar ? "وصف مهام القسم والموقع..." : "Department description..."}
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
          <h1 className="text-3xl font-bold tracking-tight">{d.departmentsTitle || (ar ? "إدارة الأقسام" : "Departments")}</h1>
          <p className="text-muted-foreground mt-1">{d.departmentsDesc || (ar ? "هيكلة وتوزيع الأقسام على الفروع والمواقع الإنشائية" : "Structure departments across branches and sites")}</p>
        </div>
        <Button
          onClick={() => { setForm({ ...EMPTY, branch_id: branches[0]?.id ? String(branches[0].id) : "" }); setShowCreate(true); }}
          className="gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white"
        >
          <Plus className="w-4 h-4" />
          {d.addDepartment || (ar ? "إضافة قسم جديد" : "Add Department")}
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
              <p className="text-sm text-muted-foreground">{ar ? "إجمالي الأقسام" : "Departments"}</p>
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

      {/* Search & Branch Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={ar ? "بحث في الأقسام..." : "Search departments..."}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>

            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="w-4 h-4 ml-2" />
                <SelectValue placeholder={ar ? "تصفية بالفرع" : "Filter by Branch"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{ar ? "🏢 كل الفروع والمواقع" : "All Branches & Sites"}</SelectItem>
                {branches.map(b => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {ar ? b.name_ar : (b.name_en || b.name_ar)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <p className="text-muted-foreground">{search || branchFilter !== "all" ? (ar ? "لا توجد نتائج مطابقة" : "No matching results") : (ar ? "لم يتم إضافة أي أقسام بعد" : "No departments added")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(dep => (
            <Card key={dep.id} className="hover:shadow-md transition group border-border/60">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-brand-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-base">{getName(dep)}</p>
                      <Badge variant="outline" className="mt-1 bg-brand-primary/5 text-brand-primary border-brand-primary/20 text-[11px] gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{getBranchDisplay(dep)}</span>
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    <Button
                      size="icon" variant="ghost"
                      onClick={() => openEdit(dep)}
                      className="w-7 h-7 text-muted-foreground hover:text-amber-600"
                      title={ar ? "تعديل القسم" : "Edit"}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon" variant="ghost"
                      onClick={() => setDeleteId(dep.id)}
                      className="w-7 h-7 text-muted-foreground hover:text-red-600"
                      title={ar ? "حذف القسم" : "Delete"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {dep.description ? (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {dep.description}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground/40 italic mb-3">
                    {ar ? "لا يوجد وصف مسجل" : "No description"}
                  </p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>
                      {dep.employees_count || dep.employee_count || 0} {ar ? "موظف" : "employees"}
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
        <DialogContent className="max-w-md" dir={ar ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{ar ? "إضافة قسم جديد" : "Add Department"}</DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            {renderFormFields()}
            <div className="flex gap-3 mt-5">
              <Button
                onClick={handleCreate} disabled={saving}
                className="flex-1 bg-brand-primary text-white hover:bg-brand-primary/90 gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {ar ? "إضافة القسم" : "Add"}
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
        <DialogContent className="max-w-md" dir={ar ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{ar ? `تعديل قسم: ${editItem?.name_ar}` : "Edit Department"}</DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            {renderFormFields()}
            <div className="flex gap-3 mt-5">
              <Button
                onClick={handleEdit} disabled={saving}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
                {ar ? "حفظ التعديلات" : "Save"}
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
        <AlertDialogContent dir={ar ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">{ar ? "تأكيد حذف القسم" : "Delete Department"}</AlertDialogTitle>
            <AlertDialogDescription>
              {ar
                ? "هل أنت متأكد من رغبتك في حذف هذا القسم؟ إذا كان هناك موظفون مسجلون عليه فلن يتم الحذف."
                : "Are you sure you want to delete this department? Deletion will be rejected if active employees exist."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{ar ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete} disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : null}
              {ar ? "نعم، حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}