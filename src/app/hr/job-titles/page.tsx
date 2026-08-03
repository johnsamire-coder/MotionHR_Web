"use client";

import { useEffect, useState } from "react";
import { Briefcase, Users, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface JobTitleItem {
  id: number;
  name_ar: string;
  name_en: string;
  description?: string;
  is_active?: boolean;
}

interface EmployeeLite {
  id: number;
  job_title?: string;
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

export default function JobTitlesPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);

  const [jobTitles, setJobTitles] = useState<JobTitleItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name_ar: "",
    name_en: "",
    description: "",
  });

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEYS.token)
      : null;

  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  useEffect(() => {
    if (!token) return;

    Promise.all([
      fetch("/api/job-titles", {
        headers: { Authorization: authHeader },
      }).then((r) => r.json()),
      fetch("/api/employees/list", {
        headers: { Authorization: authHeader },
      }).then((r) => r.json()),
    ])
      .then(([jtRes, empRes]) => {
        setJobTitles(Array.isArray(jtRes) ? jtRes : jtRes.job_titles || jtRes.jobTitles || []);
        setEmployees(Array.isArray(empRes) ? empRes : empRes.employees || []);
      })
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, []);

  const getJobTitleName = (item: JobTitleItem) =>
    lang === "en" && item.name_en ? item.name_en : item.name_ar;

  const getEmployeesCount = (item: JobTitleItem) =>
    employees.filter((emp) =>
      emp.job_title === item.name_ar || emp.job_title === item.name_en
    ).length;

  const totalEmployees = jobTitles.reduce(
    (sum, item) => sum + getEmployeesCount(item),
    0
  );

  const filtered = jobTitles.filter((item) =>
    (item.name_ar || "").includes(search) ||
    (item.name_en || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!formData.name_ar.trim()) {
      toast.error(d.titleNameArRequired);
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/job-titles", {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error();

      const newItem = await res.json();
      setJobTitles((prev) => [...prev, newItem]);
      toast.success(d.createdTitleSuccess);
      setDialogOpen(false);
      setFormData({ name_ar: "", name_en: "", description: "" });
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { message?: string } };
      };
      toast.error(e?.response?.data?.message || d.failedCreateTitle);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.jobTitlesTitle}</h1>
          <p className="text-muted-foreground mt-1">{d.jobTitlesDesc}</p>
        </div>

        <Button
          onClick={() => setDialogOpen(true)}
          className="gap-2 bg-brand-primary hover:bg-brand-primary/90"
        >
          <Plus className="w-4 h-4" />
          {d.addJobTitle}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Briefcase}
          label={d.totalJobTitles}
          value={jobTitles.length}
          color="text-blue-600 bg-blue-500/10"
        />
        <StatCard
          icon={Users}
          label={d.totalEmployees}
          value={totalEmployees}
          color="text-emerald-600 bg-emerald-500/10"
        />
        <StatCard
          icon={Users}
          label={d.avgEmployeesPerTitle}
          value={jobTitles.length ? Math.round(totalEmployees / jobTitles.length) : 0}
          color="text-purple-600 bg-purple-500/10"
        />
      </div>

      {/* Search */}
      <Input
        placeholder={d.searchJobTitles}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Briefcase className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {search ? d.noResults : d.noJobTitles}
          </p>

          {!search && (
            <Button
              onClick={() => setDialogOpen(true)}
              variant="outline"
              className="mt-4 gap-2"
            >
              <Plus className="w-4 h-4" />
              {d.addFirstJobTitle}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <Card
              key={item.id}
              className="border-border/50 hover:shadow-md transition-shadow"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-brand-primary" />
                  </div>

                  <Badge
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-700 border-0 text-[10px]"
                  >
                    {d.active}
                  </Badge>
                </div>

                <h3 className="font-semibold mb-1">{getJobTitleName(item)}</h3>

                {lang === "ar" && item.name_en && (
                  <p className="text-xs text-muted-foreground mb-3" dir="ltr">
                    {item.name_en}
                  </p>
                )}

                {lang === "en" && item.name_ar && (
                  <p className="text-xs text-muted-foreground mb-3">
                    {item.name_ar}
                  </p>
                )}

                {item.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {item.description}
                  </p>
                )}

                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span className="font-semibold text-foreground">
                    {getEmployeesCount(item)}
                  </span>
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
            <DialogTitle>{d.addJobTitleDialog}</DialogTitle>
            <DialogDescription>{d.addJobTitleDesc}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name_ar">{d.jobTitleNameAr}</Label>
              <Input
                id="name_ar"
                value={formData.name_ar}
                onChange={(e) =>
                  setFormData({ ...formData, name_ar: e.target.value })
                }
                placeholder="مثال: محاسب"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name_en">{d.jobTitleNameEn}</Label>
              <Input
                id="name_en"
                value={formData.name_en}
                onChange={(e) =>
                  setFormData({ ...formData, name_en: e.target.value })
                }
                placeholder="Example: Accountant"
                dir="ltr"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{d.jobTitleDescLabel}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Description..."
                disabled={isSaving}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSaving}
              >
                {d.cancel}
              </Button>

              <Button
                onClick={handleCreate}
                disabled={isSaving}
                className="bg-brand-primary hover:bg-brand-primary/90 gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {d.saving}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    {d.createJobTitle}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
