"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Calendar, Search, Loader2, CheckCircle2, XCircle,
  Clock, Plus, Download, Activity, AlertTriangle, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";
import { AddLeaveDialog } from "@/components/hr/add-leave-dialog";
import { standardExport } from "@/lib/utils/export-report";

interface LeaveRow {
  id: number;
  employee_id: number;
  employee_name: string;
  department: string;
  leave_type: string;
  from_date?: string;
  to_date?: string;
  status: string;
  days?: number;
  reason?: string;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled?: number;
}

const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

export default function LeavesPage() {
  const ar = useLangStore((s) => s.lang === "ar");
  const d = useDict();

  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState<LeaveRow[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [showAdd, setShowAdd] = useState(false);

  const token = () =>
    localStorage.getItem(STORAGE_KEYS.token) ||
    localStorage.getItem("motionhr_token") ||
    localStorage.getItem("token") || "";

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const t = token();
      const params = new URLSearchParams();

      // المعلق: من كل الفترات عشان يطابق الداشبورد
      if (statusFilter === "pending") {
        params.set("status", "pending");
        params.set("all_pending", "1");
      } else if (statusFilter === "all") {
        params.set("status", "all");
        params.set("year", String(year));
        // all statuses in selected year (not only one month) to avoid missing rows
      } else {
        params.set("status", statusFilter);
        params.set("year", String(year));
        params.set("month", String(month));
      }

      const res = await fetch(`/api/leaves/list?${params.toString()}`, {
        headers: { Authorization: `Token ${t}` },
      });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.error || "فشل تحميل الإجازات");

      setLeaves(data.leaves || []);
      setStats(data.stats || { total: 0, pending: 0, approved: 0, rejected: 0 });
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || (ar ? "فشل تحميل الإجازات" : "Failed to load leaves"));
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  }, [ar, statusFilter, year, month]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leaves;
    return leaves.filter((l) =>
      (l.employee_name || "").toLowerCase().includes(q) ||
      (l.department || "").toLowerCase().includes(q) ||
      (l.leave_type || "").toLowerCase().includes(q)
    );
  }, [leaves, search]);

  const statusBadge = (s: string) => {
    if (s === "approved") return "bg-emerald-100 text-emerald-700";
    if (s === "pending") return "bg-amber-100 text-amber-700";
    if (s === "rejected") return "bg-red-100 text-red-700";
    return "bg-muted text-muted-foreground";
  };
  const statusLabel = (s: string) => {
    if (s === "approved") return ar ? "مقبول" : "Approved";
    if (s === "pending") return ar ? "معلق" : "Pending";
    if (s === "rejected") return ar ? "مرفوض" : "Rejected";
    if (s === "cancelled") return ar ? "ملغي" : "Cancelled";
    return s;
  };

    const exportExcel = async () => {
    if (!filtered.length) {
      toast.error(ar ? "لا توجد بيانات" : "No data");
      return;
    }
    await standardExport({
      title: ar ? "تقرير الإجازات" : "Leaves Report",
      period: statusFilter === "pending" ? (ar ? "كل الطلبات المعلقة" : "All pending") : `${month}/${year}`,
      fileName: `leaves_${year}_${statusFilter}`,
      type: "excel",
      lang: ar ? "ar" : "en",
      columns: [
        { key: "employee_name", header: ar ? "الموظف" : "Employee", width: 24 },
        { key: "department", header: ar ? "القسم" : "Department", width: 18 },
        { key: "leave_type", header: ar ? "النوع" : "Type", width: 16 },
        { key: "from_date", header: ar ? "من" : "From", width: 14 },
        { key: "to_date", header: ar ? "إلى" : "To", width: 14 },
        { key: "days", header: ar ? "أيام" : "Days", width: 10 },
        { key: "status", header: ar ? "الحالة" : "Status", width: 12, formatter: (v) => statusLabel(String(v || "")) },
      ],
      rows: filtered as unknown as Record<string, unknown>[],
      summaryStats: [
        { label: ar ? "الإجمالي" : "Total", value: stats.total },
        { label: ar ? "معلق" : "Pending", value: stats.pending },
        { label: ar ? "مقبول" : "Approved", value: stats.approved },
        { label: ar ? "مرفوض" : "Rejected", value: stats.rejected },
      ],
    });
  };

  const exportPDF = async () => {
    if (!filtered.length) {
      toast.error(ar ? "لا توجد بيانات" : "No data");
      return;
    }
    await standardExport({
      title: ar ? "تقرير الإجازات" : "Leaves Report",
      period: statusFilter === "pending" ? (ar ? "كل الطلبات المعلقة" : "All pending") : `${month}/${year}`,
      fileName: `leaves_${year}_${statusFilter}`,
      type: "pdf",
      lang: ar ? "ar" : "en",
      columns: [
        { key: "employee_name", header: ar ? "الموظف" : "Employee", width: 24 },
        { key: "department", header: ar ? "القسم" : "Department", width: 18 },
        { key: "leave_type", header: ar ? "النوع" : "Type", width: 16 },
        { key: "from_date", header: ar ? "من" : "From", width: 14 },
        { key: "to_date", header: ar ? "إلى" : "To", width: 14 },
        { key: "days", header: ar ? "أيام" : "Days", width: 10 },
        { key: "status", header: ar ? "الحالة" : "Status", width: 12, formatter: (v) => statusLabel(String(v || "")) },
      ],
      rows: filtered as unknown as Record<string, unknown>[],
      summaryStats: [
        { label: ar ? "الإجمالي" : "Total", value: stats.total },
        { label: ar ? "معلق" : "Pending", value: stats.pending },
        { label: ar ? "مقبول" : "Approved", value: stats.approved },
        { label: ar ? "مرفوض" : "Rejected", value: stats.rejected },
      ],
    });
  };

  const CardBtn = ({
    active, label, value, color, onClick,
  }: { active: boolean; label: string; value: number; color: string; onClick: () => void }) => (
    <button type="button" onClick={onClick} className="text-right w-full">
      <Card className={`transition-all ${active ? "ring-2 ring-primary shadow-md" : "hover:shadow-sm"}`}>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          <p className="text-[11px] text-muted-foreground mt-1">{ar ? "اضغط للفلترة" : "Click to filter"}</p>
        </CardContent>
      </Card>
    </button>
  );

  return (
    <div className="space-y-6 p-6" dir={ar ? "rtl" : "ltr"}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.leavesTitle || (ar ? "الإجازات" : "Leaves")}</h1>
          <p className="text-sm text-muted-foreground">{d.leavesDesc || (ar ? "إدارة طلبات الإجازات والموافقات" : "Manage leave requests")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportExcel} className="gap-2"><Download className="w-4 h-4" />{ar ? "تصدير Excel" : "Export Excel"}</Button>
          <Button variant="outline" onClick={exportPDF} className="gap-2"><FileText className="w-4 h-4" />{ar ? "تصدير PDF" : "Export PDF"}</Button>
          <Button onClick={() => setShowAdd(true)} className="gap-2"><Plus className="w-4 h-4" />{ar ? "إضافة إجازة" : "Add Leave"}</Button>
        </div>
      </div>

      {/* Stats = clickable filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <CardBtn active={statusFilter === "all"} label={ar ? "إجمالي الإجازات" : "Total"} value={stats.total} color="text-blue-600" onClick={() => setStatusFilter("all")} />
        <CardBtn active={statusFilter === "approved"} label={ar ? "المقبولة" : "Approved"} value={stats.approved} color="text-emerald-600" onClick={() => setStatusFilter("approved")} />
        <CardBtn active={statusFilter === "pending"} label={ar ? "المعلقة" : "Pending"} value={stats.pending} color="text-amber-600" onClick={() => setStatusFilter("pending")} />
        <CardBtn active={statusFilter === "rejected"} label={ar ? "المرفوضة" : "Rejected"} value={stats.rejected} color="text-red-600" onClick={() => setStatusFilter("rejected")} />
      </div>

      {statusFilter === "pending" && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-900 px-4 py-3 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {ar ? `عرض كل الطلبات المعلقة في النظام (${stats.pending}) — بدون تقييد بشهر واحد ليتطابق مع الداشبورد.` : `Showing all pending leaves (${stats.pending}).`}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pr-9" placeholder={ar ? "بحث بالموظف / القسم / النوع" : "Search"} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {statusFilter !== "pending" && (
          <div className="flex gap-2">
            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v || month))}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTHS_AR.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v || year))}>
              <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[2026, 2025, 2024].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="h-40 flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <Calendar className="w-8 h-8 opacity-50" />
              <p className="font-medium">{ar ? "لا توجد إجازات مطابقة للفلتر" : "No leaves for this filter"}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{ar ? "الموظف" : "Employee"}</TableHead>
                  <TableHead>{ar ? "القسم" : "Department"}</TableHead>
                  <TableHead>{ar ? "النوع" : "Type"}</TableHead>
                  <TableHead>{ar ? "من" : "From"}</TableHead>
                  <TableHead>{ar ? "إلى" : "To"}</TableHead>
                  <TableHead>{ar ? "أيام" : "Days"}</TableHead>
                  <TableHead>{ar ? "الحالة" : "Status"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-semibold">{l.employee_name}</TableCell>
                    <TableCell>{l.department || "-"}</TableCell>
                    <TableCell>{l.leave_type || "-"}</TableCell>
                    <TableCell>{l.from_date || "-"}</TableCell>
                    <TableCell>{l.to_date || "-"}</TableCell>
                    <TableCell>{l.days ?? "-"}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusBadge(l.status)}`}>
                        {statusLabel(l.status)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground">
        {ar ? `المعروض: ${filtered.length} | المعلق في النظام: ${stats.pending}` : `Showing ${filtered.length} | Pending total ${stats.pending}`}
      </div>

      <AddLeaveDialog open={showAdd} onOpenChange={setShowAdd} onSaved={load} />
    </div>
  );
}

