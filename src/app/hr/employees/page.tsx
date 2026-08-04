"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Users, Upload, Plus, Search, Loader2,
  Building2, UserCheck, UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Employee {
  id: number;
  employee_code: string;
  full_name: string;
  job_title: string;
  department: string;
  department_id: number;
  branch: string;
  branch_id: number;
  phone: string;
  status: string;
  status_code: string;
}

interface DeptItem { id: number; name_ar: string; name_en: string; }
interface BranchItem { id: number; name_ar: string; name_en: string; }
interface JobTitleItem { id: number; name_ar: string; name_en: string; }

function StatCard({
  icon: Icon, label, value, color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
}) {
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

export default function EmployeesPage() {
  const router = useRouter();
  const d = useDict();
  const lang = useLangStore((s) => s.lang);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [deptMap, setDeptMap] = useState<Record<number, DeptItem>>({});
  const [branchMap, setBranchMap] = useState<Record<number, BranchItem>>({});
  const [jtMap, setJtMap] = useState<Record<string, JobTitleItem>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch("/api/employees/list", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/departments", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/branches", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/job-titles", { headers: { Authorization: authHeader } }).then(r => r.json()),
    ]).then(([empData, deptData, brData, jtData]) => {
      const list = Array.isArray(empData) ? empData : empData.employees || [];
      setEmployees(list);

      const depts = Array.isArray(deptData) ? deptData : deptData.departments || [];
      const dm: Record<number, DeptItem> = {};
      depts.forEach((d: DeptItem) => { dm[d.id] = d; });
      setDeptMap(dm);

      const brs = Array.isArray(brData) ? brData : brData.branches || [];
      const bm: Record<number, BranchItem> = {};
      brs.forEach((b: BranchItem) => { bm[b.id] = b; });
      setBranchMap(bm);

      const jts = Array.isArray(jtData) ? jtData : jtData.job_titles || jtData.jobTitles || [];
      const jm: Record<string, JobTitleItem> = {};
      jts.forEach((j: JobTitleItem) => { jm[j.name_ar] = j; });
      setJtMap(jm);
    })
      .catch(() => toast.error(d.failedLoadEmployees))
      .finally(() => setLoading(false));
  }, []);

  const departments = [...new Set(employees.map(e => e.department))].sort();

  const filteredEmployees = employees.filter(emp => {
    const matchSearch = !search ||
      emp.full_name.toLowerCase().includes(search.toLowerCase()) ||
      emp.employee_code.toLowerCase().includes(search.toLowerCase()) ||
      emp.phone.includes(search);

    const matchDept = deptFilter === "all" || emp.department === deptFilter;
    const matchStatus = statusFilter === "all" || emp.status_code === statusFilter;

    return matchSearch && matchDept && matchStatus;
  });

  const totalPages = Math.ceil(filteredEmployees.length / pageSize);
  const paginatedEmployees = filteredEmployees.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const activeCount = employees.filter(e => e.status_code === "active").length;
  const inactiveCount = employees.length - activeCount;


  const getDeptName = (emp: Employee) => {
    const item = deptMap[emp.department_id];
    if (!item) return emp.department;
    return lang === "en" && item.name_en ? item.name_en : item.name_ar;
  };

  const getBranchName = (emp: Employee) => {
    const item = branchMap[emp.branch_id];
    if (!item) return emp.branch;
    return lang === "en" && item.name_en ? item.name_en : item.name_ar;
  };

  const getJobTitleName = (emp: Employee) => {
    const item = jtMap[emp.job_title];
    if (!item) return emp.job_title;
    return lang === "en" && item.name_en ? item.name_en : item.name_ar;
  };

  const getStatusBadge = (statusCode: string, status: string) => {
    const colors: Record<string, string> = {
      active: "bg-emerald-500/10 text-emerald-700",
      inactive: "bg-red-500/10 text-red-700",
      on_leave: "bg-amber-500/10 text-amber-700",
      terminated: "bg-gray-500/10 text-gray-700",
      resigned: "bg-orange-500/10 text-orange-700",
    };
    const statusLabels: Record<string, string> = lang === "en" ? {
      active: "Active", inactive: "Inactive", on_leave: "On Leave",
      terminated: "Terminated", resigned: "Resigned",
    } : {};
    return (
      <Badge variant="outline" className={`${colors[statusCode] || colors.inactive} border-0 text-[10px]`}>
        {statusLabels[statusCode] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.employeesTitle}</h1>
          <p className="text-muted-foreground mt-1">{d.employeesDesc}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/hr/employees/import")} className="gap-2">
            <Upload className="w-4 h-4" />{d.importBtn}
          </Button>
          <Button onClick={() => router.push("/hr/employees/import")} className="gap-2 bg-brand-primary hover:bg-brand-primary/90">
            <Plus className="w-4 h-4" />{d.addEmployee}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label={d.totalEmployees} value={employees.length} color="text-blue-600 bg-blue-500/10" />
        <StatCard icon={UserCheck} label={d.activeEmployeesCount} value={activeCount} color="text-emerald-600 bg-emerald-500/10" />
        <StatCard icon={Building2} label={d.departments} value={departments.length} color="text-purple-600 bg-purple-500/10" />
        <StatCard icon={UserX} label={d.inactiveEmployees} value={inactiveCount} color="text-red-600 bg-red-500/10" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={d.searchEmployees}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pr-10"
          />
        </div>

        <Select value={deptFilter} onValueChange={v => { setDeptFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={d.deptFilter} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{d.allDepts}</SelectItem>
            {departments.map(dep => (
              <SelectItem key={dep} value={dep}>{dep}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={d.statusFilter} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{d.allStatuses}</SelectItem>
            <SelectItem value="active">{d.statusActive}</SelectItem>
            <SelectItem value="inactive">{d.statusInactive}</SelectItem>
            <SelectItem value="on_leave">{d.statusOnLeave}</SelectItem>
            <SelectItem value="terminated">{d.statusTerminated}</SelectItem>
            <SelectItem value="resigned">{d.statusResigned}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Count */}
      <div className="text-sm text-muted-foreground">
        {d.showingOf} <span className="font-semibold text-foreground">{paginatedEmployees.length}</span> {d.of}{" "}
        <span className="font-semibold text-foreground">{filteredEmployees.length}</span> {d.employee_count}
        {filteredEmployees.length !== employees.length && (
          <span> ({d.ofTotal} {employees.length})</span>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card className="border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.colEmployee}</TableHead>
                <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.colCode}</TableHead>
                <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.colDept}</TableHead>
                <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.colJobTitle}</TableHead>
                <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.colBranch}</TableHead>
                <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.colPhone}</TableHead>
                <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.colStatus}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <p>{d.noEmployees}</p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEmployees.map(emp => (
                  <TableRow
                    key={emp.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/hr/employees/${emp.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9">
                          <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-sm font-semibold">
                            {emp.full_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{emp.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{emp.employee_code}</TableCell>
                    <TableCell>{getDeptName(emp)}</TableCell>
                    <TableCell>{getJobTitleName(emp)}</TableCell>
                    <TableCell>{getBranchName(emp)}</TableCell>
                    <TableCell dir="ltr">
                      <span>{emp.phone}</span>
                    </TableCell>
                    <TableCell>{getStatusBadge(emp.status_code, emp.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            {lang === "en" ? "Previous" : "السابق"}
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            {lang === "en" ? "Next" : "التالي"}
          </Button>
        </div>
      )}
    </div>
  );
}
