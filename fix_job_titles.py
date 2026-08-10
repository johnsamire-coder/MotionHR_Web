"""
Complete fix for job-titles: add edit + delete functionality
"""
from pathlib import Path

# ═══════════════════════════════════════════════
# FIX 1: Update API Route to support PUT and DELETE
# ═══════════════════════════════════════════════
route_path = Path("src/app/api/job-titles/route.ts")
route_content = '''import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE = "https://jssolutions-eg.com/attendance/api/mobile/manager/job-titles";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const response = await fetch(`${BACKEND_BASE}/`, {
      method: "GET",
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: `فشل تحميل المسميات (${response.status})` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("JobTitles GET error:", error);
    return NextResponse.json(
      { success: false, message: "خطأ في الاتصال بالسيرفر" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const body = await request.json();

    const response = await fetch(`${BACKEND_BASE}/`, {
      method: "POST",
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("JobTitles POST error:", error);
    return NextResponse.json(
      { success: false, message: "خطأ في إنشاء المسمى" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // جرب الـ endpoints المحتملة
    const endpoints = [
      `${BACKEND_BASE}/${id}/update/`,
      `${BACKEND_BASE}/${id}/`,
    ];

    let lastError = null;
    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          method: "PUT",
          headers: {
            ...(authHeader ? { Authorization: authHeader } : {}),
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(body),
        });

        if (response.ok || response.status === 400) {
          const data = await response.json();
          return NextResponse.json(data, { status: response.status });
        }
        lastError = { status: response.status };
      } catch (e) {
        lastError = e;
      }
    }

    return NextResponse.json(
      { success: false, message: "لا يمكن تحديث المسمى", details: lastError },
      { status: 500 }
    );
  } catch (error) {
    console.error("JobTitles PUT error:", error);
    return NextResponse.json(
      { success: false, message: "خطأ في تحديث المسمى" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID required" },
        { status: 400 }
      );
    }

    // جرب الـ endpoints المحتملة
    const endpoints = [
      `${BACKEND_BASE}/${id}/delete/`,
      `${BACKEND_BASE}/${id}/`,
    ];

    let lastError = null;
    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          method: "DELETE",
          headers: {
            ...(authHeader ? { Authorization: authHeader } : {}),
            Accept: "application/json",
          },
        });

        if (response.ok || response.status === 400 || response.status === 204) {
          const data = await response.json().catch(() => ({ success: true }));
          return NextResponse.json(data, { status: response.status === 204 ? 200 : response.status });
        }
        lastError = { status: response.status };
      } catch (e) {
        lastError = e;
      }
    }

    return NextResponse.json(
      { success: false, message: "لا يمكن حذف المسمى", details: lastError },
      { status: 500 }
    );
  } catch (error) {
    console.error("JobTitles DELETE error:", error);
    return NextResponse.json(
      { success: false, message: "خطأ في حذف المسمى" },
      { status: 500 }
    );
  }
}
'''

route_path.write_text(route_content, encoding="utf-8")
print(f"[OK] API Route: Added PUT + DELETE (with fallback URLs)")

# ═══════════════════════════════════════════════
# FIX 2: Update Page - add edit + delete buttons
# ═══════════════════════════════════════════════
page_path = Path("src/app/hr/job-titles/page.tsx")
page_content = '''"use client";

import { useEffect, useState } from "react";
import { Briefcase, Users, Plus, Loader2, Edit, Trash2, MoreVertical } from "lucide-react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const EMPTY_FORM = { name_ar: "", name_en: "", description: "" };

export default function JobTitlesPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";

  const [jobTitles, setJobTitles] = useState<JobTitleItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<JobTitleItem | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEYS.token)
      : null;

  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  const loadData = () => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      fetch("/api/job-titles", { headers: { Authorization: authHeader } }).then((r) => r.json()),
      fetch("/api/employees/list", { headers: { Authorization: authHeader } }).then((r) => r.json()),
    ])
      .then(([jtRes, empRes]) => {
        setJobTitles(Array.isArray(jtRes) ? jtRes : jtRes.job_titles || jtRes.jobTitles || []);
        setEmployees(Array.isArray(empRes) ? empRes : empRes.employees || []);
      })
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const getJobTitleName = (item: JobTitleItem) =>
    !ar && item.name_en ? item.name_en : item.name_ar;

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

  const openCreateDialog = () => {
    setEditingItem(null);
    setFormData({ ...EMPTY_FORM });
    setDialogOpen(true);
  };

  const openEditDialog = (item: JobTitleItem) => {
    setEditingItem(item);
    setFormData({
      name_ar: item.name_ar || "",
      name_en: item.name_en || "",
      description: item.description || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name_ar.trim()) {
      toast.error(d.titleNameArRequired || (ar ? "الاسم العربي مطلوب" : "Arabic name required"));
      return;
    }

    setIsSaving(true);
    try {
      let res;
      if (editingItem) {
        res = await fetch(`/api/job-titles?id=${editingItem.id}`, {
          method: "PUT",
          headers: { Authorization: authHeader, "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else {
        res = await fetch("/api/job-titles", {
          method: "POST",
          headers: { Authorization: authHeader, "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }

      const data = await res.json();
      if (res.ok && data.success !== false) {
        toast.success(editingItem 
          ? (ar ? "تم تعديل المسمى" : "Job title updated")
          : (d.createdTitleSuccess || (ar ? "تم إضافة المسمى" : "Job title added")));
        setDialogOpen(false);
        setEditingItem(null);
        setFormData({ ...EMPTY_FORM });
        loadData();
      } else {
        toast.error(data.error || data.message || d.failedCreateTitle || (ar ? "فشل" : "Failed"));
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || d.failedCreateTitle || (ar ? "خطأ" : "Error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/job-titles?id=${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: authHeader },
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        toast.success(ar ? "تم حذف المسمى" : "Job title deleted");
        setDeleteId(null);
        loadData();
      } else {
        toast.error(data.error || data.message || (ar ? "فشل الحذف - قد يكون هناك موظفين بهذا المسمى" : "Delete failed"));
      }
    } catch {
      toast.error(ar ? "خطأ في الاتصال" : "Network error");
    } finally {
      setIsDeleting(false);
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
          onClick={openCreateDialog}
          className="gap-2 bg-brand-primary hover:bg-brand-primary/90"
        >
          <Plus className="w-4 h-4" />
          {d.addJobTitle}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={Briefcase} label={d.totalJobTitles} value={jobTitles.length} color="text-blue-600 bg-blue-500/10" />
        <StatCard icon={Users} label={d.totalEmployees} value={totalEmployees} color="text-emerald-600 bg-emerald-500/10" />
        <StatCard icon={Users} label={d.avgEmployeesPerTitle} value={jobTitles.length ? Math.round(totalEmployees / jobTitles.length) : 0} color="text-purple-600 bg-purple-500/10" />
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
            <Button onClick={openCreateDialog} variant="outline" className="mt-4 gap-2">
              <Plus className="w-4 h-4" />
              {d.addFirstJobTitle}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <Card key={item.id} className="border-border/50 hover:shadow-md transition-shadow group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-brand-primary" />
                  </div>

                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-0 text-[10px]">
                      {d.active}
                    </Badge>

                    <DropdownMenu>
                      <DropdownMenuTrigger className="p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition">
                        <MoreVertical className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(item)}>
                          <Edit className="w-4 h-4 ml-2" />
                          {ar ? "تعديل" : "Edit"}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="w-4 h-4 ml-2" />
                          {ar ? "حذف" : "Delete"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <h3 className="font-semibold mb-1">{getJobTitleName(item)}</h3>

                {ar && item.name_en && (
                  <p className="text-xs text-muted-foreground mb-3" dir="ltr">
                    {item.name_en}
                  </p>
                )}

                {!ar && item.name_ar && (
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
                  <span>{ar ? "موظف" : "employees"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem 
                ? (ar ? "تعديل المسمى الوظيفي" : "Edit Job Title")
                : d.addJobTitleDialog}
            </DialogTitle>
            <DialogDescription>{d.addJobTitleDesc}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name_ar">{d.jobTitleNameAr}</Label>
              <Input
                id="name_ar"
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                placeholder="مثال: محاسب"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name_en">{d.jobTitleNameEn}</Label>
              <Input
                id="name_en"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description..."
                disabled={isSaving}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
                {d.cancel}
              </Button>

              <Button onClick={handleSave} disabled={isSaving} className="bg-brand-primary hover:bg-brand-primary/90 gap-2">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {d.saving}
                  </>
                ) : editingItem ? (
                  <>{ar ? "حفظ التعديلات" : "Save Changes"}</>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ar ? "تأكيد الحذف" : "Confirm Delete"}</DialogTitle>
            <DialogDescription>
              {ar 
                ? "هل أنت متأكد من حذف هذا المسمى الوظيفي؟ لن يمكن التراجع." 
                : "Are you sure you want to delete this job title? This cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={isDeleting}>
              {d.cancel}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="gap-2">
              {isDeleting 
                ? <><Loader2 className="w-4 h-4 animate-spin" />{ar ? "جاري الحذف..." : "Deleting..."}</>
                : <><Trash2 className="w-4 h-4" />{ar ? "حذف" : "Delete"}</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
'''

page_path.write_text(page_content, encoding="utf-8")
print(f"[OK] Page: Rewritten with edit + delete functionality")
print(f"     Route size: {route_path.stat().st_size} bytes")
print(f"     Page size: {page_path.stat().st_size} bytes")

print("\n[SUCCESS] Job Titles page fixed!")
