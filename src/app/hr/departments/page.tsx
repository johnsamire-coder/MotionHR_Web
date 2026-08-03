"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Building2,
  Plus,
  Search,
  Users,
  Edit,
  Trash2,
  MoreVertical,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAuthStore } from "@/lib/stores/auth";
import axios from "axios";

interface Department {
  id: number;
  name_ar: string;
  name_en?: string;
  code?: string;
}

interface EmployeeLite {
  id: number;
  department?: string;
  department_id?: number;
}

export default function DepartmentsPage() {
  const { token } = useAuthStore();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employeeCounts, setEmployeeCounts] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name_ar: "",
    name_en: "",
    description: "",
  });

  useEffect(() => {
    if (!token) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      // نجيب الأقسام والموظفين مع بعض
      const [deptRes, empRes] = await Promise.all([
        axios.get<{ departments?: Department[] } | Department[]>("/api/departments", {
          headers: { Authorization: `Token ${token}` },
        }),
        axios.get<{ employees?: EmployeeLite[] }>("/api/employees/list?page_size=500", {
          headers: { Authorization: `Token ${token}` },
        }),
      ]);

      // Extract departments
      const deptList = Array.isArray(deptRes.data)
        ? deptRes.data
        : deptRes.data.departments || [];
      setDepartments(deptList);

      // Count employees per department
      const employees = empRes.data.employees || [];
      const counts: Record<number, number> = {};
      employees.forEach((emp) => {
        if (emp.department_id) {
          counts[emp.department_id] = (counts[emp.department_id] || 0) + 1;
        }
      });
      setEmployeeCounts(counts);
    } catch {
      toast.error("فشل تحميل البيانات");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDepts = useMemo(() => {
    return departments.filter(
      (d) =>
        !search ||
        (d.name_ar || "").toLowerCase().includes(search.toLowerCase()) ||
        (d.name_en || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [departments, search]);

  const totalEmployees = useMemo(
    () => Object.values(employeeCounts).reduce((a, b) => a + b, 0),
    [employeeCounts]
  );

  const openCreateDialog = () => {
    setFormData({ name_ar: "", name_en: "", description: "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name_ar.trim()) {
      toast.error("اسم القسم بالعربي مطلوب");
      return;
    }

    setIsSaving(true);
    try {
      await axios.post("/api/departments", formData, {
        headers: { Authorization: `Token ${token}` },
      });
      toast.success("تم إنشاء القسم بنجاح");
      setDialogOpen(false);
      loadAll();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "فشل إنشاء القسم");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الأقسام</h1>
          <p className="text-muted-foreground mt-1">إدارة الأقسام في الشركة</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة قسم
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Building2}
          label="إجمالي الأقسام"
          value={departments.length}
          color="text-blue-600 bg-blue-500/10"
        />
        <StatCard
          icon={Users}
          label="إجمالي الموظفين"
          value={totalEmployees}
          color="text-emerald-600 bg-emerald-500/10"
        />
        <StatCard
          icon={Users}
          label="متوسط الموظفين/قسم"
          value={departments.length ? Math.round(totalEmployees / departments.length) : 0}
          color="text-purple-600 bg-purple-500/10"
        />
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث في الأقسام..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Departments Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredDepts.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <Building2 className="w-12 h-12 text-muted-foreground opacity-40 mb-3" />
            <p className="text-muted-foreground">
              {search ? "لم يتم العثور على أقسام" : "لا يوجد أقسام بعد"}
            </p>
            {!search && (
              <Button onClick={openCreateDialog} className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                إضافة أول قسم
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepts.map((dept) => {
            const count = employeeCounts[dept.id] || 0;
            return (
              <Card
                key={dept.id}
                className="group hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-muted">
                        <MoreVertical className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 ml-2" />
                          تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="w-4 h-4 ml-2" />
                          حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h3 className="font-semibold text-lg mb-1">{dept.name_ar}</h3>
                  {dept.name_en && (
                    <p className="text-xs text-muted-foreground mb-3" dir="ltr">
                      {dept.name_en}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Users className="w-4 h-4 text-brand-primary" />
                      <span className="font-semibold text-brand-primary">
                        {count}
                      </span>
                      <span className="text-muted-foreground">موظف</span>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/10 text-emerald-700 border-0 text-[10px]"
                    >
                      نشط
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة قسم جديد</DialogTitle>
            <DialogDescription>أدخل بيانات القسم الجديد</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name_ar">اسم القسم بالعربي *</Label>
              <Input
                id="name_ar"
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                placeholder="مثال: الموارد البشرية"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name_en">اسم القسم بالإنجليزي</Label>
              <Input
                id="name_en"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                placeholder="Example: Human Resources"
                dir="ltr"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف مختصر للقسم..."
                rows={3}
                disabled={isSaving}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جارِ الحفظ...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  إنشاء القسم
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
