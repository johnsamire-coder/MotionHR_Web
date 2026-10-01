"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  TrendingDown, Award, DollarSign, Plus, Check, X, Loader2,
  Clock, CheckCircle2, XCircle, Calendar, User, FileText, Trash2, Edit2,
  Search, Banknote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import ManualEntryDialog, { EntryType } from "@/components/hr/manual-entry-dialog";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Entry {
  id: number;
  entry_type: string;
  category: string;
  category_display: string;
  employee_id: number;
  employee_name: string;
  employee_code: string;
  amount_type: string;
  amount_type_display: string;
  amount_value: number;
  reason: string;
  target_year: number;
  target_month: number;
  status: string;
  status_display: string;
  requested_by_name: string;
  requested_at: string;
  approved_by_name: string;
  approved_at: string | null;
  approval_notes: string;
  rejected_by_name: string;
  rejected_at: string | null;
  rejection_reason: string;
  hr_notified: boolean;
  applied_in_payroll: boolean;
}

interface Summary {
  pending: { penalties: number; bonuses: number; allowances: number };
  this_month: {
    approved_penalties: number;
    approved_bonuses: number;
    approved_allowances: number;
  };
  is_ceo: boolean;
  is_hr: boolean;
  user_role: string;
}

interface SimpleEmployee {
  id: number;
  full_name?: string;
  first_name_ar?: string;
  last_name_ar?: string;
  employee_code?: string;
}

interface Installment {
  id: number;
  employee_id: number;
  employee_name: string;
  description: string;
  total_amount: number;
  monthly_amount: number;
  paid_amount: number;
  remaining_amount: number;
  start_month: number;
  start_year: number;
  status: string;
  notes: string;
}

const MONTHS_AR = ["","يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

const TYPE_CONFIG = {
  penalty:   { icon: TrendingDown, color: "red",     name_ar: "الجزاءات",   name_singular: "جزاء" },
  bonus:     { icon: Award,        color: "emerald", name_ar: "المكافآت",   name_singular: "مكافأة" },
  allowance: { icon: DollarSign,   color: "amber",   name_ar: "البدلات",    name_singular: "بدل" },
};

export default function ManualEntriesPage() {
  const { lang } = useLangStore();
  const ar = lang === "ar";

  const [summary, setSummary] = useState<Summary | null>(null);
  const [activeType, setActiveType] = useState<EntryType>("penalty");
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [rejectDialog, setRejectDialog] = useState<Entry | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approveDialog, setApproveDialog] = useState<Entry | null>(null);
  const [approveNotes, setApproveNotes] = useState("");
  const [viewDialog, setViewDialog] = useState<Entry | null>(null);

  // ═══ السلف (Installments) ═══
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [showInstallmentDialog, setShowInstallmentDialog] = useState(false);
  const [installmentSaving, setInstallmentSaving] = useState(false);
  const [allEmployees, setAllEmployees] = useState<SimpleEmployee[]>([]);
  const [empSearch, setEmpSearch] = useState("");
  const [instForm, setInstForm] = useState({
    employee_id: null as number | null,
    description: "",
    total_amount: "",
    monthly_amount: "",
    start_month: String(new Date().getMonth() + 1),
    start_year: String(new Date().getFullYear()),
    notes: "",
  });

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;

  const loadSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/hr/manual-entries/summary", { headers: { Authorization: authH } });
      const data = await res.json();
      if (data.success) setSummary(data);
    } catch {}
  }, [authH]);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/hr/manual-entries/${activeType}?${params}`, {
        headers: { Authorization: authH },
      });
      const data = await res.json();
      if (data.success) setEntries(data.results || []);
    } catch {
      toast.error(ar ? "فشل التحميل" : "Load failed");
    } finally { setLoading(false); }
  }, [activeType, statusFilter, authH, ar]);

  useEffect(() => { loadSummary(); }, [loadSummary]);
  useEffect(() => { loadEntries(); }, [loadEntries]);

  const loadInstallments = useCallback(async () => {
    try {
      const res = await fetch("/api/hr/manual-entries/installment", { headers: { Authorization: authH } });
      const data = await res.json();
      if (data.success) setInstallments(data.results || []);
    } catch {}
  }, [authH]);

  const loadAllEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/employees/list", { headers: { Authorization: authH } });
      const data = await res.json();
      setAllEmployees(data.results || data.employees || []);
    } catch {}
  }, [authH]);

  useEffect(() => { loadInstallments(); loadAllEmployees(); }, [loadInstallments, loadAllEmployees]);

  const handleCreateInstallment = async () => {
    const missingEmployee = instForm.employee_id === null;
    const missingDescription = instForm.description.trim().length === 0;
    const missingTotal = instForm.total_amount.trim().length === 0;
    const missingMonthly = instForm.monthly_amount.trim().length === 0;
    if (missingEmployee || missingDescription || missingTotal || missingMonthly) {
      toast.error(ar ? "من فضلك املأ كل الحقول المطلوبة" : "Please fill all required fields");
      return;
    }
    setInstallmentSaving(true);
    try {
      const res = await fetch("/api/hr/manual-entries/installment", {
        method: "POST",
        headers: { Authorization: authH, "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: instForm.employee_id,
          description: instForm.description,
          total_amount: Number(instForm.total_amount),
          monthly_amount: Number(instForm.monthly_amount),
          start_month: Number(instForm.start_month),
          start_year: Number(instForm.start_year),
          notes: instForm.notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || (ar ? "تم إضافة السلفة" : "Advance added"));
        if (data.warning) {
          setTimeout(() => toast.warning(data.warning), 300);
        }
        setShowInstallmentDialog(false);
        setInstForm({
          employee_id: null, description: "", total_amount: "", monthly_amount: "",
          start_month: String(new Date().getMonth() + 1), start_year: String(new Date().getFullYear()), notes: "",
        });
        setEmpSearch("");
        loadInstallments();
      } else {
        toast.error(data.error || (ar ? "فشل الإضافة" : "Failed"));
      }
    } catch {
      toast.error(ar ? "خطأ في الاتصال" : "Network error");
    } finally {
      setInstallmentSaving(false);
    }
  };

  const filteredAllEmployees = allEmployees.filter(e => {
    if (empSearch.trim().length === 0) return true;
    const q = empSearch.toLowerCase();
    const name = (e.full_name || `${e.first_name_ar || ""} ${e.last_name_ar || ""}`).toLowerCase();
    return name.includes(q) || (e.employee_code || "").toLowerCase().includes(q);
  });

  const selectedInstEmp = allEmployees.find(e => e.id === instForm.employee_id);

  const handleApprove = async () => {
    if (!approveDialog) return;
    setActionLoading(approveDialog.id);
    try {
      const res = await fetch(`/api/hr/manual-entries/${activeType}/${approveDialog.id}/approve`, {
        method: "POST",
        headers: { Authorization: authH, "Content-Type": "application/json" },
        body: JSON.stringify({ notes: approveNotes }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(ar ? "تم الاعتماد. HR تم إبلاغهم" : "Approved. HR notified");
        setApproveDialog(null);
        setApproveNotes("");
        loadEntries();
        loadSummary();
      } else {
        toast.error(data.error || (ar ? "فشل" : "Failed"));
      }
    } catch {
      toast.error(ar ? "خطأ" : "Error");
    } finally { setActionLoading(null); }
  };

  const handleReject = async () => {
    if (!rejectDialog || !rejectReason.trim()) {
      toast.error(ar ? "سبب الرفض مطلوب" : "Rejection reason required");
      return;
    }
    setActionLoading(rejectDialog.id);
    try {
      const res = await fetch(`/api/hr/manual-entries/${activeType}/${rejectDialog.id}/reject`, {
        method: "POST",
        headers: { Authorization: authH, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(ar ? "تم الرفض" : "Rejected");
        setRejectDialog(null);
        setRejectReason("");
        loadEntries();
        loadSummary();
      } else {
        toast.error(data.error || (ar ? "فشل" : "Failed"));
      }
    } catch {
      toast.error(ar ? "خطأ" : "Error");
    } finally { setActionLoading(null); }
  };

  const handleDelete = async (entry: Entry) => {
    if (!confirm(ar ? "هل تريد حذف الطلب؟" : "Delete request?")) return;
    setActionLoading(entry.id);
    try {
      const res = await fetch(`/api/hr/manual-entries/${activeType}/${entry.id}`, {
        method: "DELETE",
        headers: { Authorization: authH },
      });
      const data = await res.json();
      if (data.success) {
        toast.success(ar ? "تم الحذف" : "Deleted");
        loadEntries();
        loadSummary();
      } else {
        toast.error(data.error || (ar ? "فشل" : "Failed"));
      }
    } catch {
      toast.error(ar ? "خطأ" : "Error");
    } finally { setActionLoading(null); }
  };

  const config = TYPE_CONFIG[activeType];
  const Icon = config.icon;

  return (
    <div className="space-y-6 pb-6" dir={ar ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{ar ? "الإدخالات اليدوية" : "Manual Entries"}</h1>
        <p className="text-muted-foreground mt-1">
          {ar
            ? "الجزاءات والمكافآت والبدلات اليدوية من المدراء (بموافقة مدير الشركة)"
            : "Manual penalties, bonuses & allowances from managers (with CEO approval)"}
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-2 border-red-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{ar ? "جزاءات معلقة" : "Pending Penalties"}</p>
                  <p className="text-3xl font-bold text-red-700">{summary.pending.penalties}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ar ? "معتمدة هذا الشهر:" : "Approved this month:"} {summary.this_month.approved_penalties}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-red-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{ar ? "مكافآت معلقة" : "Pending Bonuses"}</p>
                  <p className="text-3xl font-bold text-emerald-700">{summary.pending.bonuses}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ar ? "معتمدة هذا الشهر:" : "Approved this month:"} {summary.this_month.approved_bonuses}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Award className="w-6 h-6 text-emerald-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{ar ? "بدلات معلقة" : "Pending Allowances"}</p>
                  <p className="text-3xl font-bold text-amber-700">{summary.pending.allowances}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ar ? "معتمدة هذا الشهر:" : "Approved this month:"} {summary.this_month.approved_allowances}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-amber-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ قسم السلف (Advances) ═══ */}
      <Card className="border-2 border-cyan-200">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <Banknote className="w-5 h-5 text-cyan-700" />
              </div>
              <div>
                <p className="font-bold text-base">{ar ? "السلف والأقساط" : "Advances & Installments"}</p>
                <p className="text-xs text-muted-foreground">{ar ? `${installments.length} سلفة مسجّلة` : `${installments.length} registered`}</p>
              </div>
            </div>
            <Button onClick={() => setShowInstallmentDialog(true)} className="gap-2 bg-cyan-600 hover:bg-cyan-700">
              <Plus className="w-4 h-4" />
              {ar ? "إضافة سلفة" : "Add Advance"}
            </Button>
          </div>

          {installments.length > 0 && (
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-2 text-right">{ar ? "الموظف" : "Employee"}</th>
                    <th className="p-2 text-right">{ar ? "الوصف" : "Description"}</th>
                    <th className="p-2 text-right">{ar ? "الإجمالي" : "Total"}</th>
                    <th className="p-2 text-right">{ar ? "القسط الشهري" : "Monthly"}</th>
                    <th className="p-2 text-right">{ar ? "المتبقي" : "Remaining"}</th>
                    <th className="p-2 text-right">{ar ? "بداية الخصم" : "Starts"}</th>
                    <th className="p-2 text-right">{ar ? "الحالة" : "Status"}</th>
                  </tr>
                </thead>
                <tbody>
                  {installments.map(inst => (
                    <tr key={inst.id} className="border-t">
                      <td className="p-2 font-semibold">{inst.employee_name}</td>
                      <td className="p-2">{inst.description}</td>
                      <td className="p-2">{inst.total_amount} {ar ? "ج.م" : "EGP"}</td>
                      <td className="p-2">{inst.monthly_amount} {ar ? "ج.م" : "EGP"}</td>
                      <td className="p-2 font-semibold text-cyan-700">{inst.remaining_amount} {ar ? "ج.م" : "EGP"}</td>
                      <td className="p-2">{MONTHS_AR[inst.start_month]} {inst.start_year}</td>
                      <td className="p-2">
                        <Badge variant={inst.status === "active" ? "default" : "secondary"}>
                          {inst.status === "active" ? (ar ? "نشط" : "Active") : inst.status === "completed" ? (ar ? "منتهي" : "Done") : (ar ? "ملغي" : "Cancelled")}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Type Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
          {(Object.keys(TYPE_CONFIG) as EntryType[]).map(t => {
            const c = TYPE_CONFIG[t];
            const TIcon = c.icon;
            const active = activeType === t;
            return (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
                  active ? `bg-white text-${c.color}-700 shadow-sm` : "text-muted-foreground hover:bg-white/50"
                }`}
              >
                <TIcon className="w-4 h-4" />
                {c.name_ar}
              </button>
            );
          })}
        </div>

        <Button onClick={() => { setEditingEntryId(null); setShowCreateDialog(true); }}
          className={`gap-2 bg-${config.color}-600 hover:bg-${config.color}-700`}>
          <Plus className="w-4 h-4" />
          {ar ? `طلب ${config.name_singular}` : `Request ${config.name_singular}`}
        </Button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: "pending",  label_ar: "معلقة",     icon: Clock,         color: "yellow" },
          { value: "approved", label_ar: "معتمدة",    icon: CheckCircle2,  color: "green" },
          { value: "rejected", label_ar: "مرفوضة",    icon: XCircle,       color: "red" },
          { value: "",         label_ar: "الكل",       icon: FileText,      color: "slate" },
        ].map(s => {
          const SIcon = s.icon;
          const active = statusFilter === s.value;
          return (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition ${
                active
                  ? `bg-${s.color}-100 text-${s.color}-700 border-2 border-${s.color}-300`
                  : "bg-slate-100 text-muted-foreground border-2 border-transparent hover:bg-slate-200"
              }`}
            >
              <SIcon className="w-3.5 h-3.5" />
              {s.label_ar}
            </button>
          );
        })}
      </div>

      {/* Entries List */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Icon className={`w-12 h-12 mx-auto text-muted-foreground/40 mb-3`} />
            <p className="text-muted-foreground">
              {ar ? `لا توجد ${config.name_ar} ${statusFilter === "pending" ? "معلقة" : ""}` : `No ${activeType}s`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => {
            const isLoading = actionLoading === entry.id;
            const statusColor = {
              pending: "yellow",
              approved: "green",
              rejected: "red",
              applied: "blue",
              cancelled: "slate",
            }[entry.status] || "slate";

            return (
              <Card key={entry.id} className={`border-2 border-${config.color}-100 hover:shadow-md transition`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-lg bg-${config.color}-100 flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 text-${config.color}-700`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">{entry.employee_name}</p>
                          <Badge variant="outline" className="text-xs">{entry.employee_code}</Badge>
                          <Badge className={`text-xs bg-${statusColor}-100 text-${statusColor}-700 hover:bg-${statusColor}-200`}>
                            {entry.status_display}
                          </Badge>
                          {entry.hr_notified && (
                            <Badge className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200">
                              HR
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {entry.category_display} · {entry.amount_type_display}
                          {entry.amount_value > 0 && ` · ${entry.amount_value}`}
                        </p>
                        <p className="text-sm mt-1 text-slate-700 line-clamp-2">{entry.reason}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {MONTHS_AR[entry.target_month]} {entry.target_year}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {ar ? "طلب من:" : "By:"} {entry.requested_by_name}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => setViewDialog(entry)}>
                        {ar ? "عرض" : "View"}
                      </Button>

                      {entry.status === "pending" && summary?.is_ceo && (
                        <>
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                            onClick={() => { setApproveDialog(entry); setApproveNotes(""); }}>
                            <Check className="w-3.5 h-3.5" />
                            {ar ? "اعتماد" : "Approve"}
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 gap-1.5"
                            onClick={() => { setRejectDialog(entry); setRejectReason(""); }}>
                            <X className="w-3.5 h-3.5" />
                            {ar ? "رفض" : "Reject"}
                          </Button>
                        </>
                      )}

                      {entry.status === "pending" && (
                        <>
                          <Button variant="outline" size="sm"
                            onClick={() => { setEditingEntryId(entry.id); setShowCreateDialog(true); }}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600"
                            disabled={isLoading} onClick={() => handleDelete(entry)}>
                            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <ManualEntryDialog
        open={showCreateDialog}
        onClose={() => { setShowCreateDialog(false); setEditingEntryId(null); }}
        onSaved={() => { loadEntries(); loadSummary(); }}
        entryType={activeType}
        entryId={editingEntryId}
        ar={ar}
      />

      {/* Approve Dialog */}
      <Dialog open={!!approveDialog} onOpenChange={() => setApproveDialog(null)}>
        <DialogContent dir={ar ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
              {ar ? "تأكيد الاعتماد" : "Confirm Approval"}
            </DialogTitle>
          </DialogHeader>
          {approveDialog && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm">
                <p className="font-semibold">{approveDialog.employee_name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {approveDialog.category_display} · {approveDialog.amount_type_display}
                  {approveDialog.amount_value > 0 && ` · ${approveDialog.amount_value}`}
                </p>
                <p className="text-xs mt-1">{approveDialog.reason}</p>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1">{ar ? "ملاحظات (اختياري)" : "Notes (optional)"}</label>
                <textarea className="w-full px-3 py-2 border rounded-md text-sm min-h-[80px]"
                  value={approveNotes} onChange={(e) => setApproveNotes(e.target.value)} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setApproveDialog(null)}>{ar ? "إلغاء" : "Cancel"}</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                  disabled={actionLoading === approveDialog.id} onClick={handleApprove}>
                  {actionLoading === approveDialog.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {ar ? "اعتماد" : "Approve"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent dir={ar ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <XCircle className="w-5 h-5" />
              {ar ? "رفض الطلب" : "Reject Request"}
            </DialogTitle>
          </DialogHeader>
          {rejectDialog && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm">
                <p className="font-semibold">{rejectDialog.employee_name}</p>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1">{ar ? "سبب الرفض *" : "Rejection reason *"}</label>
                <textarea className="w-full px-3 py-2 border rounded-md text-sm min-h-[100px]"
                  value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setRejectDialog(null)}>{ar ? "إلغاء" : "Cancel"}</Button>
                <Button className="bg-red-600 hover:bg-red-700 gap-2"
                  disabled={actionLoading === rejectDialog.id} onClick={handleReject}>
                  {actionLoading === rejectDialog.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                  {ar ? "رفض" : "Reject"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewDialog} onOpenChange={() => setViewDialog(null)}>
        <DialogContent dir={ar ? "rtl" : "ltr"} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{ar ? "تفاصيل الطلب" : "Request Details"}</DialogTitle>
          </DialogHeader>
          {viewDialog && (
            <div className="space-y-3 text-sm">
              <Row label={ar ? "الموظف" : "Employee"} value={`${viewDialog.employee_name} (${viewDialog.employee_code})`} />
              <Row label={ar ? "النوع" : "Type"} value={viewDialog.category_display} />
              <Row label={ar ? "المبلغ" : "Amount"} value={`${viewDialog.amount_type_display}${viewDialog.amount_value > 0 ? ` - ${viewDialog.amount_value}` : ""}`} />
              <Row label={ar ? "الشهر" : "Month"} value={`${MONTHS_AR[viewDialog.target_month]} ${viewDialog.target_year}`} />
              <Row label={ar ? "الحالة" : "Status"} value={viewDialog.status_display} />
              <Row label={ar ? "طلب من" : "Requested by"} value={viewDialog.requested_by_name} />
              <Row label={ar ? "تاريخ الطلب" : "Requested at"} value={viewDialog.requested_at?.split(".")[0]} />
              {viewDialog.approved_at && (
                <>
                  <Row label={ar ? "اعتمد من" : "Approved by"} value={viewDialog.approved_by_name} />
                  <Row label={ar ? "تاريخ الاعتماد" : "Approved at"} value={viewDialog.approved_at?.split(".")[0]} />
                  {viewDialog.approval_notes && <Row label={ar ? "ملاحظات الاعتماد" : "Approval notes"} value={viewDialog.approval_notes} />}
                </>
              )}
              {viewDialog.rejected_at && (
                <>
                  <Row label={ar ? "رفض من" : "Rejected by"} value={viewDialog.rejected_by_name} />
                  <Row label={ar ? "سبب الرفض" : "Rejection reason"} value={viewDialog.rejection_reason} />
                </>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1">{ar ? "السبب" : "Reason"}</p>
                <p className="p-3 bg-slate-50 rounded-lg">{viewDialog.reason}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* نافذة إضافة سلفة */}
      <Dialog open={showInstallmentDialog} onOpenChange={setShowInstallmentDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={ar ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-cyan-600" />
              {ar ? "إضافة سلفة جديدة" : "Add New Advance"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold block mb-1">{ar ? "الموظف *" : "Employee *"}</label>
              {selectedInstEmp ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-cyan-50 border border-cyan-200">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-cyan-600" />
                    <div>
                      <p className="font-semibold text-sm">
                        {selectedInstEmp.full_name || `${selectedInstEmp.first_name_ar || ""} ${selectedInstEmp.last_name_ar || ""}`.trim()}
                      </p>
                      <p className="text-xs text-muted-foreground">{selectedInstEmp.employee_code}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setInstForm(f => ({ ...f, employee_id: null }))}>
                    {ar ? "تغيير" : "Change"}
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="relative mb-2">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={ar ? "ابحث بالاسم أو الكود..." : "Search by name or code..."}
                      value={empSearch}
                      onChange={(e) => setEmpSearch(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto border rounded-md">
                    {filteredAllEmployees.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-4">{ar ? "لا يوجد موظفين" : "No employees"}</p>
                    ) : filteredAllEmployees.map(e => (
                      <button
                        key={e.id}
                        onClick={() => setInstForm(f => ({ ...f, employee_id: e.id }))}
                        className="w-full flex items-center gap-2 p-2.5 hover:bg-cyan-50 border-b text-right"
                      >
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{e.full_name || `${e.first_name_ar || ""} ${e.last_name_ar || ""}`.trim()}</p>
                          <p className="text-xs text-muted-foreground">{e.employee_code}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold block mb-1">{ar ? "وصف السلفة *" : "Description *"}</label>
              <Input value={instForm.description} onChange={(e) => setInstForm(f => ({ ...f, description: e.target.value }))}
                placeholder={ar ? "مثال: سلفة طارئة" : "e.g. Emergency advance"} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold block mb-1">{ar ? "إجمالي المبلغ *" : "Total Amount *"}</label>
                <Input type="number" value={instForm.total_amount} onChange={(e) => setInstForm(f => ({ ...f, total_amount: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1">{ar ? "القسط الشهري *" : "Monthly Installment *"}</label>
                <Input type="number" value={instForm.monthly_amount} onChange={(e) => setInstForm(f => ({ ...f, monthly_amount: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold block mb-1">{ar ? "شهر بداية الخصم" : "Start Month"}</label>
                <select className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                  value={instForm.start_month}
                  onChange={(e) => setInstForm(f => ({ ...f, start_month: e.target.value }))}>
                  {MONTHS_AR.slice(1).map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1">{ar ? "سنة بداية الخصم" : "Start Year"}</label>
                <Input type="number" value={instForm.start_year} onChange={(e) => setInstForm(f => ({ ...f, start_year: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-1">{ar ? "ملاحظات" : "Notes"}</label>
              <Input value={instForm.notes} onChange={(e) => setInstForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t">
              <Button variant="outline" onClick={() => setShowInstallmentDialog(false)} disabled={installmentSaving}>
                {ar ? "إلغاء" : "Cancel"}
              </Button>
              <Button onClick={handleCreateInstallment} disabled={installmentSaving} className="gap-2 bg-cyan-600 hover:bg-cyan-700">
                {installmentSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {ar ? "إضافة السلفة" : "Add Advance"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 py-2 border-b border-slate-100">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}
