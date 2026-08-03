"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Briefcase,
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

interface JobTitle {
  id: number;
  name_ar: string;
  name_en?: string;
  description?: string;
  is_active?: boolean;
}

interface EmployeeLite {
  id: number;
  job_title?: string;
}

export default function JobTitlesPage() {
  const { token } = useAuthStore();
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [employeeCounts, setEmployeeCounts] = useState<Record<string, number>>({});
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
      const [jtRes, empRes] = await Promise.all([
        axios.get<{ job_titles?: JobTitle[]; results?: JobTitle[] } | JobTitle[]>("/api/job-titles", {
          headers: { Authorization: `Token ${token}` },
        }),
        axios.get<{ employees?: EmployeeLite[] }>("/api/employees/list?page_size=500", {
          headers: { Authorization: `Token ${token}` },
        }),
      ]);

      const list = Array.isArray(jtRes.data)
        ? jtRes.data
        : jtRes.data.job_titles || jtRes.data.results || [];
      setJobTitles(list);

      const employees = empRes.data.employees || [];
      const counts: Record<string, number> = {};
      employees.forEach((emp) => {
        if (emp.job_title) {
          counts[emp.job_title] = (counts[emp.job_title] || 0) + 1;
        }
      });
      setEmployeeCounts(counts);
    } catch {
      toast.error("فشل تحميل المسميات");
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return jobTitles.filter(
      (j) =>
        !search ||
        (j.name_ar || "").toLowerCase().includes(search.toLowerCase()) ||
        (j.name_en || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [jobTitles, search]);

  const totalEmployees = useMemo(
    () => Object.values(employeeCounts).reduce((a, b) => a + b, 0),
    [employeeCounts]
  );

  const openCreate = () => {
    setFormData({ name_ar: "", name_en: "", description: "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name_ar.trim()) {
      toast.error("اسم المسمى بالعربي مطلوب");
      return;
    }

    setIsSaving(true);
    try {
      await axios.post("/api/job-titles", formData, {
        headers: { Authorization: `Token ${token}` },
      });
      toast.success("تم إنشاء المسمى بنجاح");
      setDialogOpen(false);
      loadAll();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "فشل الإنشاء");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">المسميات الوظيفية</h1>
          <p className="text-muted-foreground mt-1">إدارة الوظائف والمناصب</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة مسمى
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={Briefcase} label="إجمالي المسميات" value={jobTitles.length} color="text-blue-600 bg-blue-500/10" />
        <StatCard icon={Users} label="إجمالي الموظفين" value={totalEmployees} color="text-emerald-600 bg-emerald-500/10" />
        <StatCard icon={Users} label="متوسط الموظفين/مسمى" value={jobTitles.length ? Math.round(totalEmployees / jobTitles.length) : 0} color="text-purple-600 bg-purple-500/10" />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث في المسميات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-6 w-40 mb-2" /><Skeleton className="h-4 w-24" /></CardContent></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <Briefcase className="w-12 h-12 text-muted-foreground opacity-40 mb-3" />
            <p className="text-muted-foreground">{search ? "لم يتم العثور على مسميات" : "لا يوجد مسميات بعد"}</p>
            {!search && (
              <Button onClick={openCreate} className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                إضافة أول مسمى
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((jt) => {
            const count = employeeCounts[jt.name_ar] || 0;
            return (
              <Card key={jt.id} className="group hover:shadow-md transition-all hover:-translate-y-0.5">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-muted">
                        <MoreVertical className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Edit className="w-4 h-4 ml-2" />تعديل</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive"><Trash2 className="w-4 h-4 ml-2" />حذف</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h3 className="font-semibold text-lg mb-1">{jt.name_ar}</h3>
                  {jt.name_en && <p className="text-xs text-muted-foreground mb-3" dir="ltr">{jt.name_en}</p>}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Users className="w-4 h-4 text-brand-primary" />
                      <span className="font-semibold text-brand-primary">{count}</span>
                      <span className="text-muted-foreground">موظف</span>
                    </div>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-0 text-[10px]">نشط</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة مسمى وظيفي</DialogTitle>
            <DialogDescription>أدخل بيانات المسمى الجديد</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name_ar">الاسم بالعربي *</Label>
              <Input id="name_ar" value={formData.name_ar} onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })} placeholder="مثال: محاسب" disabled={isSaving} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name_en">الاسم بالإنجليزي</Label>
              <Input id="name_en" value={formData.name_en} onChange={(e) => setFormData({ ...formData, name_en: e.target.value })} placeholder="Example: Accountant" dir="ltr" disabled={isSaving} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="وصف مختصر..." rows={3} disabled={isSaving} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>إلغاء</Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? (<><Loader2 className="w-4 h-4 animate-spin" />جارِ الحفظ...</>) : (<><Plus className="w-4 h-4" />إنشاء</>)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; color: string; }) {
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
