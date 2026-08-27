"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Clock, Users, UserPlus, Loader2, Edit3, Trash2, Moon, Sun,
  Sunrise, Sunset, Building2, FolderTree, CheckCircle2, AlertCircle, Star, X
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Shift {
  id: number;
  name: string;
  shift_type: string;
  is_default?: boolean;
  start_time?: string;
  end_time?: string;
  required_daily_hours?: number;
  grace_period?: number;
  early_checkin_minutes?: number;
  late_checkout_minutes?: number;
  late_checkout_allowed?: boolean;
  break_duration?: number;
  crosses_midnight?: boolean;
}

interface Assignment {
  id: number;
  shift_id: number;
  assignment_type: "company" | "branch" | "department" | "employee";
  target_id?: number;
  start_date: string;
  end_date?: string;
  branch_id?: number;
  department_id?: number;
  employee_id?: number;
  employee_name?: string;
  department_name?: string;
  branch_name?: string;
}

export default function ShiftsPage() {
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [deleteShiftId, setDeleteShiftId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Assign Dialog State
  const [assignShift, setAssignShift] = useState<Shift | null>(null);
  const [assignmentType, setAssignmentType] = useState<"company" | "branch" | "department" | "employee">("branch");
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [deletingAssignId, setDeletingAssignId] = useState<number | null>(null);

  // Form State for Shift Create/Edit
  const [formData, setFormData] = useState({
    name: "",
    shift_type: "fixed",
    is_default: false,
    start_time: "09:00",
    end_time: "17:00",
    required_daily_hours: 8,
    grace_period: 15,
    early_checkin_minutes: 30,
    late_checkout_minutes: 60,
    late_checkout_allowed: true,
    break_duration: 60,
    crosses_midnight: false,
  });

  const getAuthHeader = () => {
    if (typeof window === "undefined") return "";
    const token =
      localStorage.getItem(STORAGE_KEYS.token) ||
      localStorage.getItem("token") ||
      localStorage.getItem("jwt_access") ||
      localStorage.getItem("motion_token") ||
      "";
    if (!token) return "";
    if (token.startsWith("Token ") || token.startsWith("Bearer ")) return token;
    return "Token " + token;
  };

  const loadAllData = useCallback(async () => {
    setLoading(true);
    const authHeader = getAuthHeader();
    const headers: Record<string, string> = {
      Authorization: authHeader,
      "Content-Type": "application/json",
    };

    const safeFetch = async (urls: string[]) => {
      for (const url of urls) {
        try {
          const res = await fetch(url, { headers });
          if (res.ok) {
            const data = await res.json();
            return data;
          }
        } catch {}
      }
      return null;
    };

    try {
      const [shiftsData, assignData, branchData, deptData, empData] =
        await Promise.all([
          safeFetch(["/api/hr/shifts", "/api/manager/shifts"]),
          safeFetch([
            "/api/hr/shifts/assignments",
            "/api/manager/shifts/assignments",
          ]),
          safeFetch(["/api/branches", "/api/manager/branches"]),
          safeFetch([
            "/api/departments",
            "/api/hr/departments",
            "/api/manager/departments",
          ]),
          safeFetch([
            "/api/hr/all-employees",
            "/api/employees/list",
            "/api/manager/employees",
          ]),
        ]);

      if (shiftsData) {
        const list = Array.isArray(shiftsData)
          ? shiftsData
          : shiftsData.shifts || shiftsData.data || [];
        setShifts(list);
      }

      if (assignData) {
        const list = Array.isArray(assignData)
          ? assignData
          : assignData.assignments || assignData.results || [];
        setAssignments(list);
      }

      if (branchData) {
        const list = Array.isArray(branchData)
          ? branchData
          : branchData.branches || branchData.data || [];
        setBranches(list);
      }

      if (deptData) {
        const list = Array.isArray(deptData)
          ? deptData
          : deptData.departments || deptData.data || [];
        setDepartments(list);
      }

      if (empData) {
        const list = Array.isArray(empData)
          ? empData
          : empData.employees || empData.data || empData.results || [];
        setEmployees(list);
      }
    } catch (err) {
      console.error("Error loading shifts data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleMakeDefault = async (shift: Shift) => {
    const authHeader = getAuthHeader();
    try {
      const res = await fetch(`/api/hr/shifts/${shift.id}`, {
        method: "PUT",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ is_default: true }),
      });
      if (res.ok) {
        toast.success(ar ? `تم تعيين [${shift.name}] كشيفت افتراضي للشركة ⭐` : `Set as default shift ⭐`);
        loadAllData();
      }
    } catch {
      toast.error(ar ? "فشل التعيين كافتراضي" : "Failed to set default");
    }
  };

  const handleDeleteAssignment = async (assignId: number) => {
    setDeletingAssignId(assignId);
    const authHeader = getAuthHeader();
    try {
      const res = await fetch(`/api/hr/shifts/assignments?id=${assignId}`, {
        method: "DELETE",
        headers: { Authorization: authHeader },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(ar ? "تم إلغاء التعيين وفك الارتباط بنجاح" : "Assignment removed successfully");
        loadAllData();
      } else {
        toast.error(data.error || (ar ? "فشل إلغاء التعيين" : "Failed to remove assignment"));
      }
    } catch {
      toast.error(ar ? "خطأ في الاتصال بالسيرفر" : "Connection error");
    } finally {
      setDeletingAssignId(null);
    }
  };

  const openAssignModal = (shift: Shift) => {
    setAssignShift(shift);
    setAssignmentType("branch");
    setSelectedTargetId("");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate("");
  };

  const handleAssignSubmit = async () => {
    if (!assignShift) return;
    if (assignmentType !== "company" && !selectedTargetId) {
      toast.error(ar ? "يرجى تحديد جهة التعيين" : "Please select target");
      return;
    }

    setIsAssigning(true);
    const authHeader = getAuthHeader();

    const payload: any = {
      shift_id: assignShift.id,
      start_date: startDate,
      end_date: endDate || null,
    };

    if (assignmentType === "branch") {
      payload.branch_id = selectedTargetId;
    } else if (assignmentType === "department") {
      payload.department_id = selectedTargetId;
    } else if (assignmentType === "employee") {
      payload.employee_id = selectedTargetId;
    }

    try {
      const res = await fetch("/api/hr/shifts/assign", {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(ar ? "تم تعيين الشيفت بنجاح" : "Shift assigned successfully");
        setAssignShift(null);
        loadAllData();
      } else {
        toast.error(data.error || (ar ? "فشل تعيين الشيفت" : "Failed to assign shift"));
      }
    } catch {
      toast.error(ar ? "خطأ في الاتصال" : "Network error");
    } finally {
      setIsAssigning(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      shift_type: "fixed",
      is_default: false,
      start_time: "09:00",
      end_time: "17:00",
      required_daily_hours: 8,
      grace_period: 15,
      early_checkin_minutes: 30,
      late_checkout_minutes: 60,
      late_checkout_allowed: true,
      break_duration: 60,
      crosses_midnight: false,
    });
    setEditingShift(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (shift: Shift) => {
    setEditingShift(shift);
    setFormData({
      name: shift.name || "",
      shift_type: shift.shift_type || "fixed",
      is_default: shift.is_default || false,
      start_time: shift.start_time || "09:00",
      end_time: shift.end_time || "17:00",
      required_daily_hours: shift.required_daily_hours || 8,
      grace_period: shift.grace_period || 15,
      early_checkin_minutes: shift.early_checkin_minutes ?? 30,
      late_checkout_minutes: shift.late_checkout_minutes ?? 0,
      late_checkout_allowed: shift.late_checkout_allowed ?? false,
      break_duration: shift.break_duration || 60,
      crosses_midnight: shift.crosses_midnight || false,
    });
    setDialogOpen(true);
  };

  const handleSaveShift = async () => {
    if (!formData.name.trim()) {
      toast.error(ar ? "اسم الشيفت مطلوب" : "Shift name required");
      return;
    }

    setIsSaving(true);
    const authHeader = getAuthHeader();
    const url = editingShift ? `/api/hr/shifts/${editingShift.id}` : "/api/hr/shifts";
    const method = editingShift ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && (data.success || data.shift || data.id)) {
        toast.success(ar ? "تم حفظ الشيفت بنجاح" : "Shift saved successfully");
        setDialogOpen(false);
        resetForm();
        loadAllData();
      } else {
        toast.error(data.error || (ar ? "فشل حفظ الشيفت" : "Failed to save shift"));
      }
    } catch {
      toast.error(ar ? "خطأ في الاتصال" : "Network error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteShift = async () => {
    if (!deleteShiftId) return;
    setIsDeleting(true);
    const authHeader = getAuthHeader();

    try {
      const res = await fetch(`/api/hr/shifts/${deleteShiftId}`, {
        method: "DELETE",
        headers: { Authorization: authHeader },
      });

      if (res.ok) {
        toast.success(ar ? "تم حذف الشيفت بنجاح" : "Shift deleted successfully");
        setDeleteShiftId(null);
        loadAllData();
      } else {
        toast.error(ar ? "تعذر حذف هذا الشيفت" : "Cannot delete shift");
      }
    } catch {
      toast.error(ar ? "خطأ في الاتصال" : "Error deleting shift");
    } finally {
      setIsDeleting(false);
    }
  };

  const getShiftBadge = (type: string) => {
    switch (type) {
      case "morning":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1"><Sunrise className="w-3 h-3" /> {ar ? "صباحي" : "Morning"}</Badge>;
      case "evening":
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 gap-1"><Sunset className="w-3 h-3" /> {ar ? "مسائي" : "Evening"}</Badge>;
      case "night":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 gap-1"><Moon className="w-3 h-3" /> {ar ? "ليلي" : "Night"}</Badge>;
      case "flex":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1"><Clock className="w-3 h-3" /> {ar ? "مرن" : "Flexible"}</Badge>;
      default:
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1"><Sun className="w-3 h-3" /> {ar ? "ثابت" : "Fixed"}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-8" dir={ar ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{ar ? "إدارة الشيفتات ومواعيد العمل" : "Shifts & Work Hours"}</h1>
          <p className="text-muted-foreground mt-1">
            {ar ? "إعداد الشيفتات وتعيين الشيفت الافتراضي الأساسي وتخصيص الفروع والأقسام" : "Configure shifts, set company default shift, and assign branches or departments"}
          </p>
        </div>
        <Button onClick={openCreateDialog} className="bg-brand-primary hover:bg-brand-primary/90 text-white gap-2 font-semibold shadow-sm">
          <Plus className="w-4 h-4" />
          {ar ? "إضافة شيفت جديد" : "Add New Shift"}
        </Button>
      </div>

      {/* Shifts Grid */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        </div>
      ) : shifts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-20 text-center">
            <Clock className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">{ar ? "لا توجد شيفتات مسجلة" : "No shifts created yet"}</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              {ar ? "قم بإنشاء شيفتات العمل لشركتك وتحديد الشيفت الافتراضي الأساسي للموظفين." : "Create work shifts and set the primary default shift for employees."}
            </p>
            <Button onClick={openCreateDialog} className="bg-brand-primary text-white gap-2">
              <Plus className="w-4 h-4" />
              {ar ? "إضافة أول شيفت" : "Create First Shift"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {shifts.map((shift) => {
            const shiftAssigns = assignments.filter((a) => a.shift_id === shift.id);
            const isDefault = shift.is_default;

            return (
              <Card key={shift.id} className={`border shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${isDefault ? "border-amber-400 bg-amber-50/20" : ""}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg font-bold">{shift.name}</CardTitle>
                        {isDefault && (
                          <Badge className="bg-amber-500 text-white text-xs gap-1 border-0 shadow-sm">
                            <Star className="w-3 h-3 fill-white" /> {ar ? "الافتراضي الأساسي" : "Primary Default"}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1">{getShiftBadge(shift.shift_type)}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" onClick={() => openEditDialog(shift)} title={ar ? "تعديل" : "Edit"}>
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteShiftId(shift.id)} title={ar ? "حذف" : "Delete"}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 text-sm pb-4">
                  {/* Hours and Timing */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-muted/40 rounded-xl text-center">
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">{ar ? "من" : "From"}</div>
                      <span className="text-sm font-bold text-foreground">{shift.start_time || "--:--"}</span>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">{ar ? "إلى" : "To"}</div>
                      <span className="text-sm font-bold text-foreground">{shift.end_time || "--:--"}</span>
                    </div>
                  </div>

                  {/* Shift Stats */}
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>{ar ? "ساعات العمل المطلوبة:" : "Required Hours:"}</span>
                      <span className="font-semibold text-foreground">{shift.required_daily_hours || 8} {ar ? "ساعات" : "hrs"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{ar ? "فترة السماح بالدخول:" : "Entry Grace:"}</span>
                      <span className="font-semibold text-foreground">{shift.grace_period || 0} {ar ? "دقيقة" : "min"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{ar ? "⚡ حضور مبكر:" : "⚡ Early Checkin:"}</span>
                      <span className="font-semibold text-foreground">{shift.early_checkin_minutes || 30} {ar ? "دقيقة" : "min"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{ar ? "⌛ انصراف متأخر:" : "⌛ Late Checkout:"}</span>
                      <span className="font-semibold text-foreground">{shift.late_checkout_minutes || 0} {ar ? "دقيقة" : "min"}</span>
                    </div>
                  </div>

                  {/* Assignments Coverage Section with Delete Ability */}
                  <div className="pt-2 border-t space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground block">{ar ? "النطاق والمستهدفين المعينين:" : "Assigned Scope:"}</span>
                      {!isDefault && (
                        <button
                          onClick={() => handleMakeDefault(shift)}
                          className="text-[11px] text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1 hover:underline"
                        >
                          <Star className="w-3 h-3" /> {ar ? "جعله افتراضي" : "Make Default"}
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
                      {shiftAssigns.length === 0 ? (
                        <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30 text-[11px] gap-1">
                          <AlertCircle className="w-3 h-3" />{isDefault ? (ar ? "عام لكل الشركة (افتراضي)" : "All Company (Default)") : (ar ? "غير مخصص" : "Unassigned")}
                        </Badge>
                      ) : (
                        shiftAssigns.map((a) => {
                          const isDeletingThis = deletingAssignId === a.id;
                          if (a.assignment_type === "branch") {
                            const bName = a.branch_name || branches.find((b) => b.id === a.target_id || b.id === a.branch_id)?.name_ar;
                            return (
                              <Badge key={a.id} className="bg-purple-50 text-purple-700 border-purple-200 text-[11px] gap-1.5 pr-1.5">
                                <Building2 className="w-3 h-3" />
                                <span>{bName || (ar ? "فرع" : "Branch")}</span>
                                <button
                                  onClick={() => handleDeleteAssignment(a.id)}
                                  disabled={isDeletingThis}
                                  className="hover:bg-purple-200 rounded-full p-0.5 transition"
                                  title={ar ? "إلغاء التعيين" : "Remove"}
                                >
                                  {isDeletingThis ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                                </button>
                              </Badge>
                            );
                          }
                          if (a.assignment_type === "department") {
                            const dName = a.department_name || departments.find((d) => d.id === a.target_id || d.id === a.department_id)?.name_ar;
                            return (
                              <Badge key={a.id} className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] gap-1.5 pr-1.5">
                                <FolderTree className="w-3 h-3" />
                                <span>{dName || (ar ? "قسم" : "Dept")}</span>
                                <button
                                  onClick={() => handleDeleteAssignment(a.id)}
                                  disabled={isDeletingThis}
                                  className="hover:bg-emerald-200 rounded-full p-0.5 transition"
                                  title={ar ? "إلغاء التعيين" : "Remove"}
                                >
                                  {isDeletingThis ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                                </button>
                              </Badge>
                            );
                          }
                          if (a.assignment_type === "employee") {
                            const eName = a.employee_name || employees.find((e) => e.id === a.target_id || e.id === a.employee_id)?.first_name_ar;
                            return (
                              <Badge key={a.id} className="bg-slate-100 text-slate-800 border-slate-300 text-[11px] gap-1.5 pr-1.5">
                                <Users className="w-3 h-3" />
                                <span>{eName || (ar ? "موظف" : "Emp")}</span>
                                <button
                                  onClick={() => handleDeleteAssignment(a.id)}
                                  disabled={isDeletingThis}
                                  className="hover:bg-slate-300 rounded-full p-0.5 transition"
                                  title={ar ? "إلغاء التعيين" : "Remove"}
                                >
                                  {isDeletingThis ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                                </button>
                              </Badge>
                            );
                          }
                          return null;
                        })
                      )}
                    </div>
                  </div>
                </CardContent>

                {/* Assign Action Button */}
                <div className="p-4 border-t bg-muted/10">
                  <Button onClick={() => openAssignModal(shift)} className="w-full gap-2 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white transition-all font-semibold">
                    <UserPlus className="w-4 h-4" />
                    {ar ? "تخصيص لفرع أو قسم" : "Assign to Branch/Dept"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Assign Shift Modal */}
      <Dialog open={!!assignShift} onOpenChange={(v) => !v && setAssignShift(null)}>
        <DialogContent className="max-w-md" dir={ar ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <UserPlus className="w-5 h-5 text-brand-primary" />
              <span>{ar ? `تخصيص الشيفت: ${assignShift?.name || ""}` : `Assign Shift: ${assignShift?.name || ""}`}</span>
            </DialogTitle>
            <DialogDescription>
              {ar ? "حدد الفرع أو القسم لتطبيق هذا الشيفت عليه تلقائياً" : "Select branch or department to assign this shift"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="mb-2 block">{ar ? "نوع التخصيص" : "Assignment Scope"}</Label>
              <Select value={assignmentType} onValueChange={(v: any) => { setAssignmentType(v); setSelectedTargetId(""); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="branch">{ar ? "تخصيص لفرع كامل" : "Assign to Branch"}</SelectItem>
                  <SelectItem value="department">{ar ? "تخصيص لقسم كامل" : "Assign to Department"}</SelectItem>
                  <SelectItem value="employee">{ar ? "تخصيص لموظف محدد" : "Assign to Employee"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {assignmentType === "branch" && (
              <div>
                <Label className="mb-2 block">{ar ? "اختر الفرع *" : "Select Branch *"}</Label>
                <Select value={selectedTargetId} onValueChange={setSelectedTargetId}>
                  <SelectTrigger>
                    <SelectValue placeholder={ar ? "اختر الفرع..." : "Select branch..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.name_ar || b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {assignmentType === "department" && (
              <div>
                <Label className="mb-2 block">{ar ? "اختر القسم *" : "Select Department *"}</Label>
                <Select value={selectedTargetId} onValueChange={setSelectedTargetId}>
                  <SelectTrigger>
                    <SelectValue placeholder={ar ? "اختر القسم..." : "Select department..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name_ar || d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {assignmentType === "employee" && (
              <div>
                <Label className="mb-2 block">{ar ? "اختر الموظف *" : "Select Employee *"}</Label>
                <Select value={selectedTargetId} onValueChange={setSelectedTargetId}>
                  <SelectTrigger>
                    <SelectValue placeholder={ar ? "اختر الموظف..." : "Select employee..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {e.first_name_ar ? `${e.first_name_ar} ${e.last_name_ar || ""}` : e.full_name_ar || e.user?.username || `ID: ${e.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="mb-2 block">{ar ? "تاريخ بدء التطبيق" : "Start Date"}</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAssignShift(null)}>{ar ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleAssignSubmit} disabled={isAssigning} className="bg-brand-primary text-white gap-2">
              {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {ar ? "تأكيد التعيين" : "Confirm Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Shift Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl" dir={ar ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingShift ? (ar ? "تعديل الشيفت" : "Edit Shift") : (ar ? "إضافة شيفت جديد" : "Create New Shift")}
            </DialogTitle>
            <DialogDescription>
              {ar ? "أدخل تفاصيل ومواعيد الشيفت وفترات السماح" : "Enter shift hours, grace periods, and rules"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="mb-1 block">{ar ? "اسم الشيفت *" : "Shift Name *"}</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={ar ? "مثال: شيفت المكتب الرئيسي" : "e.g. Main Office Shift"}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1 block">{ar ? "نوع الشيفت" : "Shift Type"}</Label>
                <Select value={formData.shift_type} onValueChange={(v) => setFormData({ ...formData, shift_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">{ar ? "ثابت" : "Fixed"}</SelectItem>
                    <SelectItem value="morning">{ar ? "صباحي" : "Morning"}</SelectItem>
                    <SelectItem value="evening">{ar ? "مسائي" : "Evening"}</SelectItem>
                    <SelectItem value="night">{ar ? "ليلي" : "Night"}</SelectItem>
                    <SelectItem value="flex">{ar ? "مرن" : "Flexible"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-1 block">{ar ? "ساعات العمل المطلوبة" : "Required Hours"}</Label>
                <Input
                  type="number"
                  value={formData.required_daily_hours}
                  onChange={(e) => setFormData({ ...formData, required_daily_hours: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1 block">{ar ? "وقت الحضور (البداية)" : "Start Time"}</Label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
              <div>
                <Label className="mb-1 block">{ar ? "وقت الانصراف (النهاية)" : "End Time"}</Label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="mb-1 block text-xs">{ar ? "سماح الدخول (دقيقة)" : "Grace Period"}</Label>
                <Input
                  type="number"
                  value={formData.grace_period}
                  onChange={(e) => setFormData({ ...formData, grace_period: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">{ar ? "حضور مبكر (دقيقة)" : "Early Checkin"}</Label>
                <Input
                  type="number"
                  value={formData.early_checkin_minutes}
                  onChange={(e) => setFormData({ ...formData, early_checkin_minutes: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">{ar ? "انصراف متأخر (دقيقة)" : "Late Checkout"}</Label>
                <Input
                  type="number"
                  value={formData.late_checkout_minutes}
                  onChange={(e) => setFormData({ ...formData, late_checkout_minutes: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Checkbox الافتراضي الأساسي */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
              <input
                type="checkbox"
                id="is_default"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <label htmlFor="is_default" className="text-sm font-medium text-amber-900 dark:text-amber-300 cursor-pointer">
                {ar ? "تعيين هذا الشيفت كشيفت افتراضي أساسي للشركة ⭐" : "Set this as the primary default shift for the company ⭐"}
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{ar ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleSaveShift} disabled={isSaving} className="bg-brand-primary text-white gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {ar ? "حفظ الشيفت" : "Save Shift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Modal */}
      <Dialog open={!!deleteShiftId} onOpenChange={(v) => !v && setDeleteShiftId(null)}>
        <DialogContent className="max-w-sm" dir={ar ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-red-600">{ar ? "تأكيد حذف الشيفت" : "Confirm Delete"}</DialogTitle>
            <DialogDescription>
              {ar ? "هل أنت متأكد من رغبتك في حذف هذا الشيفت؟ لن يتمكن الموظفون من تسجيل الحضور عليه." : "Are you sure you want to delete this shift?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteShiftId(null)}>{ar ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleDeleteShift} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white gap-2">
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {ar ? "حذف نهائي" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
