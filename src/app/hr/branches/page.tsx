"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  MapPin,
  Plus,
  Search,
  Users,
  Edit,
  Trash2,
  MoreVertical,
  Loader2,
  Building,
  Phone,
  Star,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAuthStore } from "@/lib/stores/auth";
import axios from "axios";

interface Branch {
  id: number;
  name_ar: string;
  name_en?: string;
  address?: string;
  phone?: string;
  is_main?: boolean;
  is_active?: boolean;
  check_in_radius?: number;
  latitude?: number | null;
  longitude?: number | null;
}

interface EmployeeLite {
  id: number;
  branch?: string;
  branch_id?: number;
}

export default function BranchesPage() {
  const { token } = useAuthStore();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employeeCounts, setEmployeeCounts] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name_ar: "",
    name_en: "",
    address: "",
    phone: "",
  });

  useEffect(() => {
    if (!token) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [brRes, empRes] = await Promise.all([
        axios.get<{ branches?: Branch[] } | Branch[]>("/api/branches", {
          headers: { Authorization: `Token ${token}` },
        }),
        axios.get<{ employees?: EmployeeLite[] }>("/api/employees/list?page_size=500", {
          headers: { Authorization: `Token ${token}` },
        }),
      ]);

      const branchList = Array.isArray(brRes.data)
        ? brRes.data
        : brRes.data.branches || [];
      setBranches(branchList);

      const employees = empRes.data.employees || [];
      const counts: Record<number, number> = {};
      employees.forEach((emp) => {
        if (emp.branch_id) {
          counts[emp.branch_id] = (counts[emp.branch_id] || 0) + 1;
        }
      });
      setEmployeeCounts(counts);
    } catch {
      toast.error("فشل تحميل البيانات");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBranches = useMemo(() => {
    return branches.filter(
      (b) =>
        !search ||
        (b.name_ar || "").toLowerCase().includes(search.toLowerCase()) ||
        (b.name_en || "").toLowerCase().includes(search.toLowerCase()) ||
        (b.address || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [branches, search]);

  const totalEmployees = useMemo(
    () => Object.values(employeeCounts).reduce((a, b) => a + b, 0),
    [employeeCounts]
  );

  const openCreateDialog = () => {
    setFormData({ name_ar: "", name_en: "", address: "", phone: "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name_ar.trim()) {
      toast.error("اسم الفرع بالعربي مطلوب");
      return;
    }

    setIsSaving(true);
    try {
      await axios.post("/api/branches", formData, {
        headers: { Authorization: `Token ${token}` },
      });
      toast.success("تم إنشاء الفرع بنجاح");
      setDialogOpen(false);
      loadAll();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "فشل إنشاء الفرع");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الفروع</h1>
          <p className="text-muted-foreground mt-1">إدارة فروع الشركة</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة فرع
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Building}
          label="إجمالي الفروع"
          value={branches.length}
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
          label="متوسط الموظفين/فرع"
          value={branches.length ? Math.round(totalEmployees / branches.length) : 0}
          color="text-purple-600 bg-purple-500/10"
        />
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث في الفروع..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Branches Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredBranches.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <Building className="w-12 h-12 text-muted-foreground opacity-40 mb-3" />
            <p className="text-muted-foreground">
              {search ? "لم يتم العثور على فروع" : "لا يوجد فروع بعد"}
            </p>
            {!search && (
              <Button onClick={openCreateDialog} className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                إضافة أول فرع
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBranches.map((branch) => {
            const count = employeeCounts[branch.id] || 0;
            return (
              <Card
                key={branch.id}
                className="group hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                      <Building className="w-5 h-5" />
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

                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{branch.name_ar}</h3>
                    {branch.is_main && (
                      <Star className="w-4 h-4 text-brand-highlight fill-brand-highlight" />
                    )}
                  </div>

                  {branch.name_en && (
                    <p className="text-xs text-muted-foreground mb-2" dir="ltr">
                      {branch.name_en}
                    </p>
                  )}

                  {branch.address && (
                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground mb-1">
                      <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      <span>{branch.address}</span>
                    </div>
                  )}

                  {branch.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      <span dir="ltr">{branch.phone}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Users className="w-4 h-4 text-brand-primary" />
                      <span className="font-semibold text-brand-primary">{count}</span>
                      <span className="text-muted-foreground">موظف</span>
                    </div>
                    {branch.is_main ? (
                      <Badge variant="outline" className="bg-brand-highlight/10 text-brand-highlight border-0 text-[10px]">
                        فرع رئيسي
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-0 text-[10px]">
                        نشط
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة فرع جديد</DialogTitle>
            <DialogDescription>أدخل بيانات الفرع الجديد</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name_ar">اسم الفرع بالعربي *</Label>
              <Input
                id="name_ar"
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                placeholder="مثال: فرع القاهرة"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name_en">اسم الفرع بالإنجليزي</Label>
              <Input
                id="name_en"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                placeholder="Example: Cairo Branch"
                dir="ltr"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">العنوان</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="مثال: مدينة نصر، القاهرة"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0100000000"
                dir="ltr"
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
                  إنشاء الفرع
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
