"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { standardExport } from "@/lib/utils/export-report";
import {
  Users, Search, Filter, Plus, Upload, Download,
  Loader2, ChevronLeft, ChevronRight, UserCheck,
  UserX, Building2, Briefcase, Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";
import { CreateEmployeeDialog } from "@/components/hr/create-employee-dialog";

interface Employee {
  id: number;
  employee_code: string;
  full_name: string;
  full_name_en?: string;
  job_title?: string;
  job_title_en?: string;
  department?: string;
  department_en?: string;
  branch?: string;
  branch_en?: string;
  phone?: string;
  status: string;
  status_code: string;
  hire_date?: string;
  basic_salary?: number;
}

interface Department { id: number; name?: string; name_ar?: string; name_en?: string }
interface Branch     { id: number; name?: string; name_ar?: string; name_en?: string }
interface JobTitle   { id: number; title?: string; title_ar?: string; title_en?: string; name?: string; name_ar?: string; name_en?: string }
interface Manager    { id: number; full_name?: string; name?: string }

interface ListResponse {
  results: Employee[];
  count: number;
  total_pages: number;
  current_page: number;
  stats?: {
    total: number;
    active: number;
    inactive: number;
    on_leave: number;
  };
}

const PAGE_SIZE = 25;

export default function EmployeesPage() {
  const router = useRouter();
  const d = useDict();
  const lang = useLangStore((s) => s.lang);

  const [data, setData]           = useState<ListResponse | null>(null);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);

  // Lookup data
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches]       = useState<Branch[]>([]);
  const [jobTitles, setJobTitles]     = useState<JobTitle[]>([]);
  const [managers, setManagers]       = useState<Manager[]>([]);

  const token = typeof window !== "undefined"
    ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  const extractArray = <T,>(payload: any, keys: string[]): T[] => {
    if (Array.isArray(payload)) return payload as T[];
    for (const key of keys) {
      if (Array.isArray(payload?.[key])) return payload[key] as T[];
    }
    return [];
  };
  // â”€â”€ Load Lookup Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch("/api/departments", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/branches",    { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/job-titles",  { headers: { Authorization: authHeader } }).then(r => r.json()),
    ]).then(([depts, brs, jts]) => {
      setDepartments(extractArray<Department>(depts, ["departments", "results", "data"]));
      setBranches(extractArray<Branch>(brs, ["branches", "results", "data"]));
      setJobTitles(extractArray<JobTitle>(jts, ["job_titles", "jobTitles", "results", "data"]));
    }).catch(() => {});

    fetch("/api/employees/managers", { headers: { Authorization: authHeader } })
      .then(r => r.json())
      .then(mgrs => {
        const list = Array.isArray(mgrs) ? mgrs : (mgrs?.results || mgrs?.data || []);
        setManagers(list as Manager[]);
      })
      .catch(() => {});
  }, []);

  // â”€â”€ Load Employees â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleExportExcel = async () => {
    const list = (data?.results || []).map((e: any) => ({
      employee_code: e.employee_code || e.code || "",
      name: e.full_name_ar || e.name || e.employee_name || "",
      department: e.department_name || e.department || "",
      job_title: e.job_title_name || e.job_title || "",
      phone: e.phone || "",
      status: e.status || "",
      hire_date: e.hire_date || "",
      basic_salary: e.basic_salary ?? "",
    }));
    if (!list.length) { toast.error("لا توجد بيانات للتصدير"); return; }
    await standardExport({
      title: "كشف الموظفين",
      fileName: `employees_${new Date().toISOString().slice(0,10)}`,
      type: "excel",
      lang: "ar",
      columns: [
        { key: "employee_code", header: "الكود", width: 12 },
        { key: "name", header: "الاسم", width: 24 },
        { key: "department", header: "القسم", width: 18 },
        { key: "job_title", header: "المسمى", width: 18 },
        { key: "phone", header: "الموبايل", width: 14 },
        { key: "status", header: "الحالة", width: 12 },
        { key: "hire_date", header: "تاريخ التعيين", width: 14 },
        { key: "basic_salary", header: "الراتب", width: 12 },
      ],
      rows: list,
    });
  };

  const loadEmployees = useCallback(() => {
    if (!token) return;
    setLoading(true);

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(PAGE_SIZE));
    if (search)                       params.set("search", search);
    if (deptFilter !== "all")         params.set("department", deptFilter);
    if (statusFilter !== "all")       params.set("status", statusFilter);

    fetch(`/api/employees/list?${params}`, {
      headers: { Authorization: authHeader },
    })
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, [page, search, deptFilter, statusFilter]);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);

  // reset page on filter change
  useEffect(() => { setPage(1); }, [search, deptFilter, statusFilter]);

  // â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const getName = (emp: Employee) =>
    lang === "en" && emp.full_name_en ? emp.full_name_en : emp.full_name;

  const getDept = (emp: Employee) =>
    lang === "en" && emp.department_en ? emp.department_en : emp.department;

  const getJob = (emp: Employee) =>
    lang === "en" && emp.job_title_en ? emp.job_title_en : emp.job_title;

  const STATUS_COLORS: Record<string, string> = {
    active:   "bg-emerald-500/10 text-emerald-700",
    inactive: "bg-red-500/10 text-red-700",
    on_leave: "bg-blue-500/10 text-blue-700",
  };

  const stats = data?.stats;
  const totalPages = data?.total_pages || 1;
  const tableHeaders = lang === "ar"
    ? ["اسم الموظف", "الكود", "القسم", "المسمى الوظيفي", "الموبايل", "الحالة"]
    : ["Employee Name", "Code", "Department", "Job Title", "Phone", "Status"];

  return (
    <div className="space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>

      {/* â”€â”€ Header â”€â”€ */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.employeesTitle}</h1>
          <p className="text-muted-foreground mt-1">{d.employeesDesc}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline" size="sm"
            onClick={handleExportExcel}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            {lang === "ar" ? "تصدير Excel" : "Export Excel"}
          </Button>
          <Button
            variant="outline" size="sm"
            onClick={() => router.push("/hr/employees/import")}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            {d.importEmployees}
          </Button>
          <Button
            size="sm"
            onClick={() => setShowCreate(true)}
            className="gap-2 bg-brand-primary hover:bg-brand-secondary"
          >
            <Plus className="w-4 h-4" />
            {d.addEmployee}
          </Button>
        </div>
      </div>

      {/* â”€â”€ Stats Cards â”€â”€ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            icon: Users,
            label: d.totalEmployees,
            value: stats?.total ?? data?.count ?? 0,
            color: "bg-brand-primary/10 text-brand-primary",
          },
          {
            icon: UserCheck,
            label: d.activeEmployeesCount,
            value: stats?.active ?? 0,
            color: "bg-emerald-500/10 text-emerald-600",
          },
          {
            icon: UserX,
            label: d.inactiveEmployees,
            value: stats?.inactive ?? 0,
            color: "bg-red-500/10 text-red-600",
          },
          {
            icon: Building2,
            label: d.onLeave,
            value: stats?.on_leave ?? 0,
            color: "bg-blue-500/10 text-blue-600",
          },
        ].map((s, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl ${s.color} flex items-center justify-center`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold">
                    {loading ? "..." : Number(s.value).toLocaleString(
                      lang === "ar" ? "ar-EG" : "en-US"
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* â”€â”€ Filters â”€â”€ */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={d.searchEmployees}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* Department Filter */}
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder={d.filterDept} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{d.allDepartments}</SelectItem>
                {departments.map(dep => (
                  <SelectItem key={dep.id} value={String(dep.id)}>
                    {lang === "en" ? (dep.name_en || dep.name || dep.name_ar || "") : (dep.name || dep.name_ar || dep.name_en || "")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder={d.filterStatus} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{d.allStatuses}</SelectItem>
                <SelectItem value="active">
                  {lang === "ar" ? "نشط" : "Active"}
                </SelectItem>
                <SelectItem value="on_leave">
                  {lang === "ar" ? "في إجازة" : "On Leave"}
                </SelectItem>
                <SelectItem value="suspended">
                  {lang === "ar" ? "موقوف" : "Suspended"}
                </SelectItem>
                <SelectItem value="resigned">
                  {lang === "ar" ? "مستقيل" : "Resigned"}
                </SelectItem>
                <SelectItem value="terminated">
                  {lang === "ar" ? "منتهي الخدمة" : "Terminated"}
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Results count */}
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {data?.count
                ? `${Number(data.count).toLocaleString(lang === "ar" ? "ar-EG" : "en-US")} ${lang === "ar" ? "موظف" : "employees"}`
                : ""}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* â”€â”€ Table â”€â”€ */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : !data?.results?.length ? (
        <Card>
          <CardContent className="py-24 text-center">
            <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="font-medium text-muted-foreground">{d.noEmployees}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b bg-muted/30">
                    {tableHeaders.map((h, i) => (
                      <th
                        key={i}
                        className="text-start align-middle px-4 py-3 text-sm font-semibold text-muted-foreground whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((emp, i) => (
                    <tr
                      key={emp.id}
                      onClick={() => router.push(`/hr/employees/${emp.id}`)}
                      className={`border-b cursor-pointer transition hover:bg-muted/40 ${
                        i % 2 === 0 ? "" : "bg-muted/20"
                      }`}
                    >
                      {/* Name + Avatar */}
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9">
                            <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-sm font-semibold">
                              {emp.full_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm whitespace-nowrap">
                            {getName(emp)}
                          </span>
                        </div>
                      </td>

                      {/* Code */}
                      <td className="px-4 py-3 align-middle">
                        <span className="font-mono text-sm text-muted-foreground">
                          {emp.employee_code}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Building2 className="w-3 h-3" />
                          <span>{getDept(emp) || "â€”"}</span>
                        </div>
                      </td>

                      {/* Job Title */}
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Briefcase className="w-3 h-3" />
                          <span>{getJob(emp) || "â€”"}</span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground" dir="ltr">
                          <Phone className="w-3 h-3" />
                          <span className="font-mono text-xs">{emp.phone || "â€”"}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 align-middle">
                        <Badge
                          className={`border-0 text-xs ${
                            STATUS_COLORS[emp.status_code] || "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {emp.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* â”€â”€ Pagination â”€â”€ */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <Button
                  variant="outline" size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="gap-1"
                >
                  <ChevronRight className="w-4 h-4" />
                  {lang === "ar" ? "السابق" : "Prev"}
                </Button>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {lang === "ar"
                      ? `صفحة ${page} من ${totalPages}`
                      : `Page ${page} of ${totalPages}`}
                  </span>
                </div>

                <Button
                  variant="outline" size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="gap-1"
                >
                  {lang === "ar" ? "التالي" : "Next"}
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* â”€â”€ Create Employee Dialog â”€â”€ */}
      <CreateEmployeeDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => loadEmployees()}
        departments={departments}
        branches={branches}
        jobTitles={jobTitles}
        managers={managers}
      />
    </div>
  );
}





