"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { standardExport } from "@/lib/utils/export-report";
import {
  FileText, Calendar, Activity, CheckCircle2, Clock, XCircle,
  Search, Filter, Loader2, Users, Download, Building2,
  Eye, Check, X, LayoutGrid,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface RequestType {
  id: number;
  name: string;
  name_en?: string;
  description?: string;
  description_en?: string;
  permission_kind?: string;
  requires_date_range?: boolean;
  requires_amount?: boolean;
  requires_document?: boolean;
}

interface RequestCategory {
  id: number;
  name: string;
  name_en?: string;
  icon?: string;
  color: string;
  types: RequestType[];
}

interface RequestReport {
  year: number;
  month: number;
  total_requests: number;
  approved: number;
  rejected: number;
  pending: number;
  details: Array<{
    id: number;
    employee_name?: string;
    department?: string;
    request_type?: string;
    request_type_en?: string;
    status?: string;
    submitted_at?: string;
    created_at?: string;
    reason?: string;
  }>;
}

function StatCard({
  icon: Icon, label, value, color, active, onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Card
      className={`border transition-all cursor-pointer hover:shadow-md ${
        active ? "border-brand-primary shadow-md" : "border-border/50"
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const handleStandardRequestsExport = async (rowsInput?: any[]) => {
    const list = (rowsInput || filtered || requests || []).map((r: any) => ({
      employee_name: r.employee_name || r.employee || "",
      request_type: r.request_type_name || r.type_name || r.request_type || "",
      status: r.status || "",
      created_at: r.created_at || r.date || "",
      reason: r.reason || r.notes || "",
    }));
    if (!list.length) { toast.error("لا توجد طلبات للتصدير"); return; }
    await standardExport({
      title: "تقرير الطلبات",
      fileName: `requests_${new Date().toISOString().slice(0,10)}`,
      type: "excel",
      lang: "ar",
      columns: [
        { key: "employee_name", header: "الموظف", width: 22 },
        { key: "request_type", header: "نوع الطلب", width: 22 },
        { key: "status", header: "الحالة", width: 12 },
        { key: "created_at", header: "التاريخ", width: 16 },
        { key: "reason", header: "السبب", width: 28 },
      ],
      rows: list,
    });
  };

export default function RequestsPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState<RequestReport | null>(null);
  const [categories, setCategories] = useState<RequestCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all");
  const [selectedReq, setSelectedReq] = useState<RequestReport["details"][number] | null>(null);
  const [rejectTarget, setRejectTarget] = useState<number | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/requests/report?year=${year}&month=${month}`, { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/requests/types", { headers: { Authorization: authHeader } }).then(r => r.json()),
    ]).then(([reportData, typesData]) => {
      setReport(reportData);
      setCategories(typesData?.categories || []);
    })
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, [year, month]);

  const getName = (item: { name: string; name_en?: string }) => {
    return lang === "en" && item.name_en ? item.name_en : item.name;
  };

  const monthNames = [
    d.January, d.February, d.March, d.April, d.May, d.June,
    d.July, d.August, d.September, d.October, d.November, d.December,
  ];

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const details = report?.details || [];

  const filtered = details.filter(req => {
    const matchSearch = !search ||
      (req.employee_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (req.request_type || "").toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === "all" || req.status === statusFilter;
    const matchTab = activeTab === "all" || (activeTab === "pending" && req.status === "pending");

    return matchSearch && matchStatus && matchTab;
  });

  const handleExportExcel = () => {
    if (!filtered.length) {
      toast.error(lang === "ar" ? "لا توجد بيانات" : "No data");
      return;
    }

    const csvCell = (value: unknown) => {
      const text = String(value ?? "").replace(/"/g, '""');
      return `"${text}"`;
    };

    const header = lang === "ar"
      ? ["الموظف", "النوع", "التاريخ", "الحالة"]
      : ["Employee", "Type", "Date", "Status"];

    const rows = filtered.map((r) => {
      const typeLabel =
        lang === "en" && r.request_type_en
          ? r.request_type_en
          : (r.request_type || "");

      const dateValue = (r.submitted_at || r.created_at)
        ? new Date(r.submitted_at || r.created_at || "").toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")
        : "";

      return [
        csvCell(r.employee_name || ""),
        csvCell(typeLabel),
        csvCell(dateValue),
        csvCell(r.status || ""),
      ].join(",");
    });

    const csvText = "\uFEFF" + header.map(csvCell).join(",") + "\n" + rows.join("\n");
    const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "requests_" + year + "_" + String(month).padStart(2, "0") + ".csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success(lang === "ar" ? "تم التصدير" : "Exported");
  };

  const handleAction = async (requestId: number, action: "approve" | "reject", notes = "") => {
    if (action === "reject" && !rejectTarget) {
      setRejectTarget(requestId);
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/manager/action", {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ type: "request", id: requestId, action, notes }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(action === "approve" ? (lang === "ar" ? "تم القبول" : "Approved") : (lang === "ar" ? "تم الرفض" : "Rejected"));
        setRejectTarget(null);
        setRejectNotes("");
        setTimeout(() => window.location.reload(), 500);
      } else {
        toast.error(data.message || (lang === "ar" ? "فشل العملية" : "Failed"));
      }
    } catch {
      toast.error(lang === "ar" ? "خطأ في الاتصال" : "Connection error");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmReject = async () => {
    if (!rejectNotes.trim()) {
      toast.error(lang === "ar" ? "سبب الرفض مطلوب" : "Rejection reason is required");
      return;
    }
    if (rejectTarget) await handleAction(rejectTarget, "reject", rejectNotes.trim());
  };

  const getStatusBadge = (status?: string) => {
    const map: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
      approved: { label: d.reqApproved, color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20", icon: CheckCircle2 },
      pending: { label: d.reqPending, color: "bg-amber-500/10 text-amber-700 border-amber-500/20", icon: Clock },
      rejected: { label: d.reqRejected, color: "bg-red-500/10 text-red-700 border-red-500/20", icon: XCircle },
      cancelled: { label: d.reqCancelled, color: "bg-gray-500/10 text-gray-700 border-gray-500/20", icon: X },
    };
    const info = map[status || ""] || map.pending;
    const Icon = info.icon;
    return (
      <Badge className={`${info.color} border font-medium gap-1`}>
        <Icon className="w-3 h-3" />
        {info.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.requestsTitle}</h1>
          <p className="text-muted-foreground mt-1">{d.requestsDesc}</p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
            <Calendar className="w-4 h-4 text-muted-foreground mx-2" />
            <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
              <SelectTrigger className="border-0 bg-transparent w-[110px] focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => (
                  <SelectItem key={m} value={String(m)}>{monthNames[m - 1]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
              <SelectTrigger className="border-0 bg-transparent w-[90px] focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            {d.exportExcel}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-4"><div className="h-16 bg-muted animate-pulse rounded" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={Activity}
            label={d.totalRequests}
            value={report?.total_requests || 0}
            color="bg-blue-500/10 text-blue-600"
            active={statusFilter === "all"}
            onClick={handleExportExcel}
          />
          <StatCard
            icon={CheckCircle2}
            label={d.approvedRequests}
            value={report?.approved || 0}
            color="bg-emerald-500/10 text-emerald-600"
            active={statusFilter === "approved"}
            onClick={() => setStatusFilter(statusFilter === "approved" ? "all" : "approved")}
          />
          <StatCard
            icon={Clock}
            label={d.pendingRequestsCount}
            value={report?.pending || 0}
            color="bg-amber-500/10 text-amber-600"
            active={statusFilter === "pending"}
            onClick={() => setStatusFilter(statusFilter === "pending" ? "all" : "pending")}
          />
          <StatCard
            icon={XCircle}
            label={d.rejectedRequests}
            value={report?.rejected || 0}
            color="bg-red-500/10 text-red-600"
            active={statusFilter === "rejected"}
            onClick={() => setStatusFilter(statusFilter === "rejected" ? "all" : "rejected")}
          />
        </div>
      )}

      {/* Request Categories */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <LayoutGrid className="w-5 h-5 text-brand-primary" />
            <h3 className="text-lg font-semibold">{d.requestCategories}</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {categories.map(cat => (
              <Card key={cat.id} className="border-2" style={{ borderColor: cat.color + "40" }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: cat.color + "20", color: cat.color }}
                    >
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{getName(cat)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {cat.types?.length || 0} {d.typesInCategory}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs + Filters */}
      <Card>
        <CardContent className="p-4">
          {/* Tabs */}
          <div className="flex gap-1 mb-4 border-b border-border">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                activeTab === "all"
                  ? "border-brand-primary text-brand-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {d.tabAllRequests}
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
                activeTab === "pending"
                  ? "border-brand-primary text-brand-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {d.tabPendingOnly}
              {(report?.pending || 0) > 0 && (
                <Badge className="bg-amber-500/10 text-amber-700 border-0 text-[10px]">
                  {report?.pending}
                </Badge>
              )}
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={d.searchEmployees}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{d.allStatusesAtt}</SelectItem>
                <SelectItem value="approved">{d.reqApproved}</SelectItem>
                <SelectItem value="pending">{d.reqPending}</SelectItem>
                <SelectItem value="rejected">{d.reqRejected}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedReq && (
        <Card className="border-brand-primary/20 bg-brand-primary/5">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold">{lang === "ar" ? "تفاصيل الطلب" : "Request details"}</h3>
                <p className="text-sm text-muted-foreground">{selectedReq.employee_name || "—"}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedReq(null)}>
                {lang === "ar" ? "إغلاق" : "Close"}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">{lang === "ar" ? "النوع: " : "Type: "}</span>
                {lang === "en" && selectedReq.request_type_en ? selectedReq.request_type_en : selectedReq.request_type || "—"}
              </div>
              <div>
                <span className="text-muted-foreground">{lang === "ar" ? "الحالة: " : "Status: "}</span>
                {selectedReq.status || "—"}
              </div>
              <div>
                <span className="text-muted-foreground">{lang === "ar" ? "القسم: " : "Department: "}</span>
                {selectedReq.department || "—"}
              </div>
              <div>
                <span className="text-muted-foreground">{lang === "ar" ? "التاريخ: " : "Date: "}</span>
                {(selectedReq.submitted_at || selectedReq.created_at)
                  ? new Date(selectedReq.submitted_at || selectedReq.created_at || "").toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")
                  : "—"}
              </div>
            </div>

            <div className="text-sm">
              <span className="text-muted-foreground">{lang === "ar" ? "السبب: " : "Reason: "}</span>
              {selectedReq.reason || "—"}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reject Dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={v => { if (!v) { setRejectTarget(null); setRejectNotes(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{lang === "ar" ? "سبب الرفض" : "Rejection Reason"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>{lang === "ar" ? "اكتب سبب الرفض" : "Enter rejection reason"}</Label>
              <Textarea value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} rows={3} placeholder={lang === "ar" ? "السبب..." : "Reason..."} />
            </div>
            <div className="flex gap-3">
              <Button onClick={confirmReject} disabled={actionLoading} className="flex-1 bg-red-600 hover:bg-red-700">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (lang === "ar" ? "تأكيد الرفض" : "Confirm Reject")}
              </Button>
              <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectNotes(""); }} className="flex-1">
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Requests Table */}
      <Card className="border-border/50">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {d.showingOf} <span className="font-semibold text-foreground">{filtered.length}</span> {d.of}{" "}
            <span className="font-semibold text-foreground">{details.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="font-medium">{d.noRequestsData}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.colEmployee}</TableHead>
                <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.requestType}</TableHead>
                <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.requestDate}</TableHead>
                <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.requestStatus}</TableHead>
                <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.requestActions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(req => (
                <TableRow key={req.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-sm font-semibold">
                          {req.employee_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-medium">{req.employee_name || "—"}</span>
                        {req.department && (
                          <div className="text-xs text-muted-foreground">{req.department}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {lang === "en" && req.request_type_en ? req.request_type_en : req.request_type}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {(req.submitted_at || req.created_at) ? new Date(req.submitted_at || req.created_at || "").toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US") : "—"}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(req.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setSelectedReq(req)}><Eye className="w-4 h-4" /></Button>
                      {req.status === "pending" && (
                        <>
                          <Button onClick={() => handleAction(req.id, "approve")} variant="ghost" size="sm" className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button onClick={() => handleAction(req.id, "reject")} variant="ghost" size="sm" className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50">
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}











