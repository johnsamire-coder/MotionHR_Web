"use client";

import { useState, useEffect } from "react";
import { Plus, MapPin, Users, Phone, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
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
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<{ branch_id: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name_ar: "", name_en: "", address: "", phone: "",
  });

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch("/api/branches", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/employees/list", { headers: { Authorization: authHeader } }).then(r => r.json()),
    ]).then(([brs, emps]) => {
      setBranches(Array.isArray(brs) ? brs : brs.branches || []);
      setEmployees(Array.isArray(emps) ? emps : emps.employees || []);
    }).catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, []);

  const getEmpCount = (branchId: number) =>
    employees.filter((e: { branch_id: number }) => e.branch_id === branchId).length;

  const getName = (b: Branch) =>
    lang === "en" && b.name_en ? b.name_en : b.name_ar;

  const filtered = branches.filter(b =>
    (b.name_ar || "").includes(search) ||
    (b.name_en || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalEmployees = branches.reduce((sum, b) => sum + getEmpCount(b.id), 0);

  const handleCreate = async () => {
    if (!formData.name_ar.trim()) { toast.error(d.branchNameArRequired); return; }
    setIsSaving(true);
    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();
      const newBranch = await res.json();
      setBranches(prev => [...prev, newBranch]);
      toast.success(d.createdBranchSuccess);
      setDialogOpen(false);
      setFormData({ name_ar: "", name_en: "", address: "", phone: "" });
    } catch {
      toast.error(d.failedCreateBranch);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.branchesTitle}</h1>
          <p className="text-muted-foreground mt-1">{d.branchesDesc}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2 bg-brand-primary hover:bg-brand-primary/90">
          <Plus className="w-4 h-4" />
          {d.addBranch}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={MapPin} label={d.totalBranches} value={branches.length} color="text-blue-600 bg-blue-500/10" />
        <StatCard icon={Users} label={d.totalEmployees} value={totalEmployees} color="text-emerald-600 bg-emerald-500/10" />
        <StatCard icon={Users} label={d.avgEmployeesPerBranch} value={branches.length ? Math.round(totalEmployees / branches.length) : 0} color="text-purple-600 bg-purple-500/10" />
      </div>

      {/* Search */}
      <Input
        placeholder={d.searchBranches}
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
          <p className="text-muted-foreground">{search ? d.noResults : d.noBranches}</p>
          {!search && (
            <Button onClick={() => setDialogOpen(true)} variant="outline" className="mt-4 gap-2">
              <Plus className="w-4 h-4" />{d.addFirstBranch}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(branch => (
            <Card key={branch.id} className="border-border/50 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-brand-primary" />
                  </div>
                  <div className="flex items-center gap-1">
                    {branch.is_main && (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-0 text-[10px] gap-1">
                        <Star className="w-3 h-3" />{d.mainBranch}
                      </Badge>
                    )}
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-0 text-[10px]">
                      {d.active}
                    </Badge>
                  </div>
                </div>

                <h3 className="font-semibold mb-1">{getName(branch)}</h3>
                {lang === "ar" && branch.name_en && (
                  <p className="text-xs text-muted-foreground mb-2" dir="ltr">{branch.name_en}</p>
                )}
                {lang === "en" && branch.name_ar && (
                  <p className="text-xs text-muted-foreground mb-2">{branch.name_ar}</p>
                )}

                {branch.address && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{branch.address}</p>
                )}
                {branch.phone && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3" dir="ltr">
                    <Phone className="w-3 h-3" />
                    <span>{branch.phone}</span>
                  </div>
                )}

                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span className="font-semibold text-foreground">{getEmpCount(branch.id)}</span>
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
            <DialogTitle>{d.addBranchTitle}</DialogTitle>
            <DialogDescription>{d.addBranchDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name_ar">{d.branchNameAr}</Label>
              <Input id="name_ar" value={formData.name_ar}
                onChange={e => setFormData({ ...formData, name_ar: e.target.value })}
                placeholder="مثال: فرع القاهرة" disabled={isSaving} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name_en">{d.branchNameEn}</Label>
              <Input id="name_en" value={formData.name_en} dir="ltr"
                onChange={e => setFormData({ ...formData, name_en: e.target.value })}
                placeholder="Example: Cairo Branch" disabled={isSaving} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">{d.branchAddress}</Label>
              <Input id="address" value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="مثال: مدينة نصر، القاهرة" disabled={isSaving} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{d.branchPhone}</Label>
              <Input id="phone" value={formData.phone} dir="ltr"
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="01xxxxxxxxx" disabled={isSaving} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
                {d.cancel}
              </Button>
              <Button onClick={handleCreate} disabled={isSaving} className="bg-brand-primary hover:bg-brand-primary/90 gap-2">
                {isSaving
                  ? <><Loader2 className="w-4 h-4 animate-spin" />{d.saving}</>
                  : <><Plus className="w-4 h-4" />{d.createBranch}</>
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
