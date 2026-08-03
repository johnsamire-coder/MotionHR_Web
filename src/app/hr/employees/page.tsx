"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Users,
  Phone,
  Building2,
  Briefcase,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

import { useAuthStore } from "@/lib/stores/auth";
import { employeesApi, EmployeeListItem } from "@/lib/api/endpoints/employees";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  inactive: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  terminated: "bg-red-500/10 text-red-700 dark:text-red-400",
  resigned: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  on_leave: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
};

const PAGE_SIZE = 25;

export default function EmployeesPage() {
  const router = useRouter();
  const { token } = useAuthStore();

  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!token) return;
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadEmployees = async () => {
    setIsLoading(true);
    try {
      const data = await employeesApi.list({ page_size: 500 }, token);
      const list = data.employees || data.results || [];
      setEmployees(list);
    } catch {
      toast.error("فشل تحميل قائمة الموظفين");
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique departments
  const departments = useMemo(() => {
    const depts = new Set<string>();
    employees.forEach((e) => {
      if (e.department) depts.add(e.department);
    });
    return Array.from(depts).sort();
  }, [employees]);

  // Filter + Search
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        !search ||
        (emp.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (emp.employee_code || "").toLowerCase().includes(search.toLowerCase()) ||
        (emp.phone || "").includes(search) ||
        (emp.national_id || "").includes(search);

      const matchesDepartment =
        departmentFilter === "all" || emp.department === departmentFilter;

      const matchesStatus =
        statusFilter === "all" || emp.status_code === statusFilter;

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [employees, search, departmentFilter, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / PAGE_SIZE);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, departmentFilter, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const active = employees.filter((e) => e.status_code === "active").length;
    return {
      total: employees.length,
      active,
      departments: departments.length,
      inactive: employees.length - active,
    };
  }, [employees, departments]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الموظفون</h1>
          <p className="text-muted-foreground mt-1">
            إدارة جميع موظفي الشركة
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/hr/employees/import")}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            استيراد
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            إضافة موظف
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="إجمالي الموظفين"
          value={stats.total}
          color="text-blue-600 bg-blue-500/10"
        />
        <StatCard
          icon={Users}
          label="النشطون"
          value={stats.active}
          color="text-emerald-600 bg-emerald-500/10"
        />
        <StatCard
          icon={Building2}
          label="الأقسام"
          value={stats.departments}
          color="text-purple-600 bg-purple-500/10"
        />
        <StatCard
          icon={Briefcase}
          label="غير نشط"
          value={stats.inactive}
          color="text-orange-600 bg-orange-500/10"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم، الكود، الموبايل، الرقم القومي..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="w-4 h-4 ml-2" />
                <SelectValue placeholder="القسم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأقسام</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="w-4 h-4 ml-2" />
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">غير نشط</SelectItem>
                <SelectItem value="on_leave">في إجازة</SelectItem>
                <SelectItem value="terminated">منتهي</SelectItem>
                <SelectItem value="resigned">مستقيل</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon">
              <Download className="w-4 h-4" />
            </Button>
          </div>

          {!isLoading && (
            <div className="mt-3 text-sm text-muted-foreground">
              عرض <span className="font-semibold text-foreground">{paginatedEmployees.length}</span> من{" "}
              <span className="font-semibold text-foreground">{filteredEmployees.length}</span> موظف
              {filteredEmployees.length !== employees.length && (
                <span> (من إجمالي {employees.length})</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الموظف</TableHead>
                  <TableHead className="text-right">الكود</TableHead>
                  <TableHead className="text-right">القسم</TableHead>
                  <TableHead className="text-right">المسمى الوظيفي</TableHead>
                  <TableHead className="text-right">الفرع</TableHead>
                  <TableHead className="text-right">الموبايل</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}>
                        <div className="flex items-center gap-3 py-2">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : paginatedEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Users className="w-8 h-8 opacity-40" />
                        <p>لا يوجد موظفون</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedEmployees.map((emp) => {
                    const initial = emp.full_name?.[0] || "?";
                    return (
                      <TableRow key={emp.id} onClick={() => router.push(`/hr/employees/${emp.id}`)} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-9 h-9 border">
                              <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-sm font-semibold">
                                {initial}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="font-medium truncate">
                                {emp.full_name || "—"}
                              </div>
                              {emp.national_id && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {emp.national_id}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <code className="text-xs px-2 py-1 rounded bg-muted font-mono">
                            {emp.employee_code || "—"}
                          </code>
                        </TableCell>

                        <TableCell>
                          <span className="text-sm">{emp.department || "—"}</span>
                        </TableCell>

                        <TableCell>
                          <span className="text-sm">{emp.job_title || "—"}</span>
                        </TableCell>

                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {emp.branch || "—"}
                          </span>
                        </TableCell>

                        <TableCell>
                          {emp.phone ? (
                            <div className="flex items-center gap-1 text-xs">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              <span dir="ltr">{emp.phone}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        <TableCell>
                          {emp.status_code && STATUS_COLORS[emp.status_code] ? (
                            <Badge
                              variant="outline"
                              className={`${STATUS_COLORS[emp.status_code]} border-0`}
                            >
                              {emp.status || emp.status_code}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <Button variant="ghost" size="icon" className="w-8 h-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-muted-foreground">
                صفحة {currentPage} من {totalPages}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronRight className="w-4 h-4" />
                  السابق
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  التالي
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
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


