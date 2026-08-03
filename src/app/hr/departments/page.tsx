"use client";

import { useState, useEffect } from "react";
import { Plus, Building2, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Department {
  id: number;
  name_ar: string;
  name_en: string;
  description?: string;
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

export default function DepartmentsPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<{ department_id: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ name_ar: "", name_en: "", description: "" });

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch("/api/departments", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/employees/list", { headers: { Authorization: authHeader } }).then(r => r.json()),
    ]).then(([depts, emps]) => {
      setDepartments(Array.isArray(depts) ? depts : depts.departments || []);
      setEmployees(Array.isArray(emps) ? emps : emps.employees || []);
    }).catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, []);

  const getEmpCount = (deptId: number) =>
    employees.filter((e: { department_id: number }) => e.department_id === deptId).length;

  const filtered = departments.filter(dep =>
    (dep.name_ar || '').includes(search) || (dep.name_en || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalEmployees = departments.reduce((sum, d) => sum + getEmpCount(d.id), 0);

  const handleCreate = async () => {
    if (!formData.name_ar.trim()) { toast.error(d.nameArRequired); return; }
    setIsSaving(true);
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();
      const newDept = await res.json();
      setDepartments(prev => [...prev, newDept]);
      toast.success(d.createdSuccess);
      setDialogOpen(false);
      setFormData({ name_ar: "", name_en: "", description: "" });
    } catch {
      toast.error(d.failedCreate);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.departmentsTitle}</h1>
          <p className="text-muted-foreground mt-1">{d.departmentsDesc}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2 bg-brand-primary hover:bg-brand-primary/90">
          <Plus className="w-4 h-4" />
          {d.addDepartment}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={Building2} label={d.totalDepartments} value={departments.length} color="text-blue-600 bg-blue-500/10" />
        <StatCard icon={Users} label={d.totalEmployees} value={totalEmployees} color="text-emerald-600 bg-emerald-500/10" />
        <StatCard icon={Users} label={d.avgEmployeesPerDept} value={departments.length ? Math.round(totalEmployees / departments.length) : 0} color="text-purple-600 bg-purple-500/10" />
      </div>

      {/* Search */}
      <Input
        placeholder={d.searchDepartments}
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
          <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{search ? d.noResults : d.noDepartments}</p>
          {!search && (
            <Button onClick={() => setDialogOpen(true)} variant="outline" className="mt-4 gap-2">
              <Plus className="w-4 h-4" />{d.addFirstDept}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(dep => (
            <Card key={dep.id} className="border-border/50 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-brand-primary" />
                  </div>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-0 text-[10px]">
                    {d.active}
                  </Badge>
                </div>
                <h3 className="font-semibold mb-1">{lang === "en" && dep.name_en ? dep.name_en : dep.name_ar}</h3>
                {lang === "ar" && dep.name_en && <p className="text-xs text-muted-foreground mb-3" dir="ltr">{dep.name_en}</p>}
                {lang === "en" && dep.name_ar && <p className="text-xs text-muted-foreground mb-3">{dep.name_ar}</p>}
                {dep.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{dep.description}</p>}
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span className="font-semibold text-foreground">{getEmpCount(dep.id)}</span>
                  <span>{d.employee_count}</span>
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
            <DialogTitle>{d.addDeptTitle}</DialogTitle>
            <DialogDescription>{d.addDeptDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name_ar">{d.deptNameAr}</Label>
              <Input id="name_ar" value={formData.name_ar}
                onChange={e => setFormData({ ...formData, name_ar: e.target.value })}
                placeholder="مثال: الموارد البشرية" disabled={isSaving} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name_en">{d.deptNameEn}</Label>
              <Input id="name_en" value={formData.name_en} dir="ltr"
                onChange={e => setFormData({ ...formData, name_en: e.target.value })}
                placeholder="Example: Human Resources" disabled={isSaving} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{d.deptDesc}</Label>
              <Textarea id="description" value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder={d.deptDescPlaceholder} disabled={isSaving} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
                {d.cancel}
              </Button>
              <Button onClick={handleCreate} disabled={isSaving} className="bg-brand-primary hover:bg-brand-primary/90 gap-2">
                {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" />{d.saving}</> : <><Plus className="w-4 h-4" />{d.createDept}</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
