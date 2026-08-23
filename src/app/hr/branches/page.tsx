"use client";

import { useState, useEffect } from "react";
import { Plus, MapPin, Users, Phone, Star, Loader2, Edit3, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Branch {
  id: number;
  name_ar: string;
  name_en: string;
  address?: string;
  phone?: string;
  is_main: boolean;
  is_active: boolean;
  employee_count?: number;
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BranchesPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";

  const [branches, setBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<{ branch_id: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [deleteBranchId, setDeleteBranchId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name_ar: "", name_en: "", address: "", phone: "", is_main: false,
  });

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") || token?.startsWith("Bearer ") ? token : `Token ${token}`;

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/branches", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/employees/list", { headers: { Authorization: authHeader } }).then(r => r.json()).catch(() => ({})),
    ]).then(([brs, emps]) => {
      setBranches(Array.isArray(brs) ? brs : brs.branches || []);
      setEmployees(Array.isArray(emps) ? emps : emps.employees || []);
    }).catch(() => toast.error(d.failedLoad || (ar ? "فشل تحميل الفروع" : "Failed to load branches")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!token) return;
    loadData();
  }, []);

  const getEmpCount = (branchId: number) =>
    employees.filter((e: { branch_id: number }) => e.branch_id === branchId).length;

  const getName = (b: Branch) =>
    !ar && b.name_en ? b.name_en : b.name_ar;

  const filtered = branches.filter(b =>
    (b.name_ar || "").includes(search) ||
    (b.name_en || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalEmployees = branches.reduce((sum, b) => sum + getEmpCount(b.id), 0);

  const openCreateDialog = () => {
    setEditingBranch(null);
    setFormData({
      name_ar: "",
      name_en: "",
      address: "",
      phone: "",
      is_main: branches.length === 0, // الأول افتراضياً رئيسي
    });
    setDialogOpen(true);
  };

  const openEditDialog = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name_ar: branch.name_ar || "",
      name_en: branch.name_en || "",
      address: branch.address || "",
      phone: branch.phone || "",
      is_main: branch.is_main || false,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name_ar.trim()) {
      toast.error(d.branchNameArRequired || (ar ? "اسم الفرع بالعربي مطلوب" : "Arabic name required"));
      return;
    }
    setIsSaving(true);
    try {
      const url = "/api/branches";
      const method = editingBranch ? "PUT" : "POST";
      const payload = editingBranch ? { ...formData, id: editingBranch.id } : formData;

      const res = await fetch(url, {
        method,
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        toast.error(data.error || (ar ? "فشل حفظ الفرع" : "Failed to save branch"));
        return;
      }

      toast.success(editingBranch
        ? (ar ? "تم تعديل الفرع بنجاح ✅" : "Branch updated successfully ✅")
        : (ar ? "تم إنشاء الفرع بنجاح ✅" : "Branch created successfully ✅")
      );
      setDialogOpen(false);
      loadData();
    } catch {
      toast.error(ar ? "حدث خطأ أثناء الحفظ" : "Error saving branch");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteBranchId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/branches?id=${deleteBranchId}`, {
        method: "DELETE",
        headers: { Authorization: authHeader },
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        toast.error(data.error || (ar ? "لا يمكن حذف هذا الفرع" : "Cannot delete branch"));
        return;
      }

      toast.success(ar ? "تم حذف الفرع بنجاح 🗑️" : "Branch deleted successfully 🗑️");
      setDeleteBranchId(null);
      loadData();
    } catch {
      toast.error(ar ? "حدث خطأ أثناء الحذف" : "Error deleting branch");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.branchesTitle || (ar ? "إدارة الفروع والمواقع" : "Branches & Sites")}</h1>
          <p className="text-muted-foreground mt-1">{d.branchesDesc || (ar ? "إدارة المقرات والمواقع الإنشائية وتحديد الفروع الرئيسية" : "Manage offices and construction sites")}</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white">
          <Plus className="w-4 h-4" />
          {d.addBranch || (ar ? "إضافة فرع / موقع" : "Add Branch / Site")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={MapPin} label={d.totalBranches || (ar ? "إجمالي الفروع والمواقع" : "Total Branches")} value={branches.length} color="text-blue-600 bg-blue-500/10" />
        <StatCard icon={Users} label={d.totalEmployees || (ar ? "إجمالي الموظفين" : "Total Employees")} value={totalEmployees} color="text-emerald-600 bg-emerald-500/10" />
        <StatCard icon={Users} label={d.avgEmployeesPerBranch || (ar ? "متوسط موظفي الفرع" : "Avg per Branch")} value={branches.length ? Math.round(totalEmployees / branches.length) : 0} color="text-purple-600 bg-purple-500/10" />
      </div>

      {/* Search */}
      <Input
        placeholder={d.searchBranches || (ar ? "بحث في الفروع والمواقع..." : "Search branches...")}
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <MapPin className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{search ? (d.noResults || "لا توجد نتائج مطابقة") : (d.noBranches || "لم يتم إضافة أي فروع بعد")}</p>
          {!search && (
            <Button onClick={openCreateDialog} variant="outline" className="mt-4 gap-2">
              <Plus className="w-4 h-4" />{d.addFirstBranch || (ar ? "إضافة أول فرع" : "Add First Branch")}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(branch => (
            <Card key={branch.id} className="border-border/50 hover:shadow-md transition-shadow relative group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-brand-primary" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {branch.is_main && (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-0 text-[11px] gap-1 font-semibold">
                        <Star className="w-3 h-3 fill-amber-500" />{ar ? "الفرع الرئيسي" : "Main Branch"}
                      </Badge>
                    )}
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-0 text-[10px]">
                      {d.active || (ar ? "نشط" : "Active")}
                    </Badge>
                  </div>
                </div>

                <h3 className="font-semibold text-lg mb-1">{getName(branch)}</h3>
                {ar && branch.name_en && (
                  <p className="text-xs text-muted-foreground mb-2" dir="ltr">{branch.name_en}</p>
                )}
                {!ar && branch.name_ar && (
                  <p className="text-xs text-muted-foreground mb-2">{branch.name_ar}</p>
                )}

                {branch.address ? (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{branch.address}</p>
                ) : (
                  <p className="text-xs text-muted-foreground/50 italic mb-2">{ar ? "لا يوجد عنوان مسجل" : "No address"}</p>
                )}

                {branch.phone && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3" dir="ltr">
                    <Phone className="w-3 h-3" />
                    <span>{branch.phone}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-border/50 mt-3">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span className="font-semibold text-foreground">{getEmpCount(branch.id)}</span>
                    <span>{d.employee_count || (ar ? "موظف" : "Employees")}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-brand-primary"
                      onClick={() => openEditDialog(branch)}
                      title={ar ? "تعديل الفرع" : "Edit Branch"}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
                      onClick={() => setDeleteBranchId(branch.id)}
                      title={ar ? "حذف الفرع" : "Delete Branch"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md" dir={ar ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>
              {editingBranch
                ? (ar ? `تعديل فرع: ${editingBranch.name_ar}` : `Edit Branch: ${editingBranch.name_ar}`)
                : (ar ? "إضافة فرع / موقع جديد" : "Add New Branch / Site")}
            </DialogTitle>
            <DialogDescription>
              {ar ? "أدخل بيانات المقر أو الموقع الإنشائي بدقة" : "Enter branch details accurately"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name_ar">{ar ? "اسم الفرع (بالعربي) *" : "Branch Name (Arabic) *"}</Label>
              <Input id="name_ar" value={formData.name_ar}
                onChange={e => setFormData({ ...formData, name_ar: e.target.value })}
                placeholder="مثال: موقع التجمع الخامس" disabled={isSaving} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name_en">{ar ? "اسم الفرع (بالإنجليزي)" : "Branch Name (English)"}</Label>
              <Input id="name_en" value={formData.name_en} dir="ltr"
                onChange={e => setFormData({ ...formData, name_en: e.target.value })}
                placeholder="Example: 5th Settlement Site" disabled={isSaving} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{ar ? "العنوان أو الموقع الجغرافي" : "Address / Location"}</Label>
              <Input id="address" value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="مثال: التجمع الخامس، حي اللوتس" disabled={isSaving} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{ar ? "رقم الهاتف / مسؤول الموقع" : "Phone Number"}</Label>
              <Input id="phone" value={formData.phone} dir="ltr"
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="01xxxxxxxxx" disabled={isSaving} />
            </div>

            {/* Main Branch Switch */}
            <div className="flex items-center justify-between p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="is_main_switch" className="text-xs font-semibold cursor-pointer">
                  {ar ? "تعيين كفرع رئيسي للشركة ⭐" : "Set as Main Company Branch ⭐"}
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  {ar ? "تلقائياً يلغي صفة الرئيسي عن باقي الفروع" : "Automatically unsets main from other branches"}
                </p>
              </div>
              <Switch
                id="is_main_switch"
                checked={formData.is_main}
                onCheckedChange={(checked) => setFormData({ ...formData, is_main: checked })}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
              {d.cancel || (ar ? "إلغاء" : "Cancel")}
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-brand-primary text-white hover:bg-brand-primary/90 gap-2">
              {isSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin" />{d.saving || (ar ? "جاري الحفظ..." : "Saving...")}</>
              ) : (
                <>{editingBranch ? (ar ? "حفظ التعديلات" : "Save Changes") : (ar ? "إنشاء الفرع" : "Create Branch")}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteBranchId} onOpenChange={(open) => !open && setDeleteBranchId(null)}>
        <DialogContent className="sm:max-w-md" dir={ar ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              <span>{ar ? "تأكيد حذف الفرع" : "Confirm Branch Deletion"}</span>
            </DialogTitle>
            <DialogDescription>
              {ar
                ? "هل أنت متأكد من رغبتك في حذف هذا الفرع؟ لا يمكن التراجع عن هذا الإجراء."
                : "Are you sure you want to delete this branch? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDeleteBranchId(null)} disabled={isDeleting}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              <span>{ar ? "نعم، حذف الفرع" : "Yes, Delete"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}