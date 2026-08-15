"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  FileText, Calendar, Loader2, CheckCircle2, XCircle,
  Clock, Search, UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface PendingItem {
  id: number;
  type?: string;
  employee_name?: string;
  employee_id?: number;
  request_type?: string;
  leave_type?: string;
  leave_type_category?: string;
  substitute_employee_id?: number;
  substitute_employee_name?: string;
  start_date?: string;
  end_date?: string;
  submitted_at?: string;
  reason?: string;
  amount?: number;
}

interface Substitute {
  id: number;
  name: string;
  department: string;
}

export default function ManagerRequestsPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);

  const [pending, setPending] = useState<{ leaves: PendingItem[]; requests: PendingItem[] }>({
    leaves: [], requests: [],
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "leaves" | "requests">("all");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [substituteDialog, setSubstituteDialog] = useState<{
    item: PendingItem;
    isLeave: boolean;
  } | null>(null);
  const [substitutes, setSubstitutes] = useState<Substitute[]>([]);
  const [selectedSubstituteId, setSelectedSubstituteId] = useState<string>("");
  const [loadingSubstitutes, setLoadingSubstitutes] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  const loadData = () => {
    if (!token) return;
    setLoading(true);
    fetch("/api/manager/pending", { headers: { Authorization: authHeader } })
      .then(r => r.json())
      .then(data => {
        setPending({
          leaves: data?.pending_leaves || [],
          requests: data?.pending_requests || [],
        });
      })
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const loadSubstitutes = async (excludeEmployeeId?: number) => {
    setLoadingSubstitutes(true);
    try {
      const url = excludeEmployeeId
        ? `/api/leaves/substitutes?exclude_employee_id=${excludeEmployeeId}`
        : "/api/leaves/substitutes";
      const res = await fetch(url, { headers: { Authorization: authHeader } });
      const data = await res.json();
      setSubstitutes(data?.substitutes || []);
    } catch {}
    setLoadingSubstitutes(false);
  };

  const handleAction = async (item: PendingItem, action: "approve" | "reject", isLeave: boolean) => {
    // لو مرضية + approve → نفتح dialog البديل لو مفيش بديل محدد مسبقًا
    if (isLeave && action === "approve" && item.leave_type_category === "sick" && !item.substitute_employee_id) {
      setSubstituteDialog({ item, isLeave });
      setSelectedSubstituteId("");
      loadSubstitutes(item.employee_id);
      return;
    }
    await doAction(item, action, isLeave, "");
  };

  const doAction = async (item: PendingItem, action: "approve" | "reject", isLeave: boolean, substituteId: string) => {
    setActionLoading(item.id);
    try {
      const body: Record<string, unknown> = isLeave
        ? { type: "leave", id: item.id, action }
        : { type: "request", id: item.id, action };

      if (substituteId) body["substitute_employee_id"] = substituteId;

      const res = await fetch("/api/manager/action", {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(action === "approve"
          ? (lang === "ar" ? "تم القبول" : "Approved")
          : (lang === "ar" ? "تم الرفض" : "Rejected"));
        setSubstituteDialog(null);
        loadData();
      } else {
        toast.error(data.message || (lang === "ar" ? "فشل" : "Failed"));
      }
    } catch {
      toast.error(lang === "ar" ? "خطأ" : "Error");
    } finally {
      setActionLoading(null);
    }
  };

  const allItems = [
    ...pending.leaves.map(l => ({ ...l, __isLeave: true })),
    ...pending.requests.map(r => ({ ...r, __isLeave: false })),
  ];

  const filtered = allItems.filter(item => {
    if (tab === "leaves" && !item.__isLeave) return false;
    if (tab === "requests" && item.__isLeave) return false;
    if (search && !(item.employee_name || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {lang === "ar" ? "الطلبات المعلقة" : "Pending Approvals"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {lang === "ar" ? "راجع واعتمد طلبات فريقك" : "Review and approve your team's requests"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className={`border-2 cursor-pointer ${tab === "all" ? "border-brand-primary" : "border-border"}`} onClick={() => setTab("all")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{lang === "ar" ? "الكل" : "All"}</p>
                <p className="text-xl font-bold">{allItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-2 cursor-pointer ${tab === "leaves" ? "border-emerald-500" : "border-border"}`} onClick={() => setTab("leaves")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{lang === "ar" ? "إجازات" : "Leaves"}</p>
                <p className="text-xl font-bold">{pending.leaves.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-2 cursor-pointer ${tab === "requests" ? "border-purple-500" : "border-border"}`} onClick={() => setTab("requests")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{lang === "ar" ? "طلبات" : "Requests"}</p>
                <p className="text-xl font-bold">{pending.requests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={d.searchEmployees}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-24 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-500/50 mx-auto mb-4" />
            <p className="font-medium">
              {lang === "ar" ? "لا يوجد طلبات معلقة" : "No pending items"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => {
            const isLeave = (item as PendingItem & { __isLeave: boolean }).__isLeave;
            const isActioning = actionLoading === item.id;
            return (
              <Card key={`${isLeave ? "L" : "R"}-${item.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-brand-primary/10 text-brand-primary">
                          {item.employee_name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{item.employee_name}</p>
                          <Badge variant="outline" className={`text-[10px] ${
                            isLeave ? "bg-emerald-500/10 text-emerald-700" : "bg-purple-500/10 text-purple-700"
                          } border-0`}>
                            {isLeave ? (lang === "ar" ? "إجازة" : "Leave") : (lang === "ar" ? "طلب" : "Request")}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-brand-primary">
                          {item.leave_type || item.request_type}
                        </p>
                        {(item.start_date || item.end_date) && (
                          <p className="text-xs text-muted-foreground mt-1 font-mono" dir="ltr">
                            {formatDate(item.start_date)}
                            {item.end_date && ` → ${formatDate(item.end_date)}`}
                          </p>
                        )}
                        {item.amount && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {lang === "ar" ? "المبلغ" : "Amount"}: <span className="font-semibold">{item.amount}</span>
                          </p>
                        )}
                        {item.reason && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{item.reason}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAction(item, "approve", isLeave)}
                        disabled={isActioning}
                        className="bg-emerald-600 hover:bg-emerald-700 gap-1"
                      >
                        {isActioning ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                        {lang === "ar" ? "قبول" : "Approve"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(item, "reject", isLeave)}
                        disabled={isActioning}
                        className="border-red-500/30 text-red-700 hover:bg-red-50 gap-1"
                      >
                        <XCircle className="w-3 h-3" />
                        {lang === "ar" ? "رفض" : "Reject"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      {/* Dialog البديل للمرضية */}
      {substituteDialog && (
        <Dialog open={true} onOpenChange={() => setSubstituteDialog(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                {lang === "ar" ? "تحديد موظف بديل" : "Select Substitute Employee"}
              </DialogTitle>
              <DialogDescription>
                {lang === "ar"
                  ? `الإجازة المرضية للموظف ${substituteDialog.item.employee_name} تحتاج تحديد بديل قبل الاعتماد`
                  : `Sick leave for ${substituteDialog.item.employee_name} requires a substitute before approval`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{lang === "ar" ? "الموظف البديل" : "Substitute Employee"}</Label>
                {loadingSubstitutes ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {lang === "ar" ? "جاري التحميل..." : "Loading..."}
                  </div>
                ) : (
                  <Select value={selectedSubstituteId} onValueChange={setSelectedSubstituteId}>
                    <SelectTrigger>
                      <SelectValue placeholder={lang === "ar" ? "اختر موظف بديل..." : "Select substitute..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {substitutes.map(s => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}{s.department ? ` — ${s.department}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setSubstituteDialog(null)}>
                  {lang === "ar" ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  onClick={() => doAction(substituteDialog.item, "approve", substituteDialog.isLeave, selectedSubstituteId)}
                  disabled={!selectedSubstituteId || actionLoading !== null}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-1"
                >
                  {actionLoading !== null ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {lang === "ar" ? "اعتماد مع البديل" : "Approve with Substitute"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
