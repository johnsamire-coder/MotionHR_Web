"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Plus, Clock, Users, UserPlus, Loader2, Edit3, Trash2, Moon, Sun, 
  Sunrise, Sunset, Building2, FolderTree, CheckCircle2, AlertCircle 
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
  start_time?: string;
  end_time?: string;
  required_daily_hours?: number;
  grace_period?: number;
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
  const [assignmentType, setAssignmentType] = useState<"company" | "branch" | "department" | "employee">("employee");
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Form State for Shift Create/Edit
  const [formData, setFormData] = useState({
    name: "",
    shift_type: "fixed",
    start_time: "09:00",
    end_time: "17:00",
    required_daily_hours: 8,
    grace_period: 15,
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
        } catch (e) {
          console.warn("Fetch failed for:", url, e);
        }
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
          safeFetch([
            "/api/branches",
            "/api/manager/branches",
            "/api/hr/branches",
          ]),
          safeFetch(["/api/hr/departments", "/api/manager/departments"]),
          safeFetch(["/api/manager/employees", "/api/hr/employees"]),
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
          : assignData.assignments || assignData.data || [];
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
          : empData.employees || empData.data || [];
        setEmployees(list);
      }
    } catch (err) {
      console.error("Error loading shifts data:", err);
    } finally {
      setLoading(false);
    }
  }, [ar]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Open Assign Modal
  const openAssignModal = (shift: Shift) => {
    setAssignShift(shift);
    setAssignmentType("employee");
    setSelectedTargetId("");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate("");
  };

  // Submit Assign Shift
  const handleAssignSubmit = async () => {
    if (!assignShift) return;
    if (assignmentType !== "company" && !selectedTargetId) {
      toast.error(ar ? "يرجى تحديد المستهدف للتعيين" : "Please select a target");
      return;
    }

    setIsAssigning(true);
    const authHeader = getAuthHeader();

    const body: any = {
      shift_id: assignShift.id,
      assignment_type: assignmentType,
      start_date: startDate,
      end_date: endDate || null,
    };

    if (assignmentType === "employee") body.employee_ids = [Number(selectedTargetId)];
    if (assignmentType === "department") body.department_ids = [Number(selectedTargetId)];
    if (assignmentType === "branch") body.branch_ids = [Number(selectedTargetId)];
    if (assignmentType === "company") body.assign_to_company = true;

    try {
      const res = await fetch("/api/hr/shifts/assign", {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        toast.success(ar ? "تم تخصيص وتعيين الشيفت بنجاح ✅" : "Shift assigned successfully ✅");
        setAssignShift(null);
        loadAllData();
      } else {
        toast.error(data.error || data.message || (ar ? "فشل التعيين" : "Failed to assign"));
      }
    } catch {
      toast.error(ar ? "حدث خطأ أثناء الاتصال بالخادم" : "Network error");
    } finally {
      setIsAssigning(false);
    }
  };

  // Shift Create/Edit Handlers
  const openCreateDialog = () => {
    setEditingShift(null);
    setFormData({
      name: "", shift_type: "fixed", start_time: "09:00", end_time: "17:00",
      required_daily_hours: 8, grace_period: 15, break_duration: 60, crosses_midnight: false,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (shift: Shift) => {
    setEditingShift(shift);
    setFormData({
      name: shift.name || "",
      shift_type: shift.shift_type || "fixed",
      start_time: shift.start_time || "09:00",
      end_time: shift.end_time || "17:00",
      required_daily_hours: shift.required_daily_hours || 8,
      grace_period: shift.grace_period || 15,
      break_duration: shift.break_duration || 60,
      crosses_midnight: shift.crosses_midnight || false,
    });
    setDialogOpen(true);
  };

  const handleSaveShift = async () => {
    if (!formData.name.trim()) {
      toast.error(ar ? "اسم الشيفت مطلوب" : "Shift name is required");
      return;
    }
    setIsSaving(true);
    const authHeader = getAuthHeader();
    const url = editingShift ? "/api/hr/shifts/" + editingShift.id : "/api/hr/shifts";
    const method = editingShift ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        toast.success(editingShift ? (ar ? "تم تعديل الشيفت بنجاح ✅" : "Shift updated ✅") : (ar ? "تم إنشاء الشيفت بنجاح ✅" : "Shift created ✅"));
        setDialogOpen(false);
        loadAllData();
      } else {
        toast.error(data.error || (ar ? "فشل حفظ الشيفت" : "Failed to save shift"));
      }
    } catch {
      toast.error(ar ? "خطأ في الشبكة" : "Network error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteShift = async () => {
    if (!deleteShiftId) return;
    setIsDeleting(true);
    const authHeader = getAuthHeader();
    try {
      const res = await fetch("/api/hr/shifts/" + deleteShiftId, {
        method: "DELETE",
        headers: { Authorization: authHeader },
      });
      if (res.ok) {
        toast.success(ar ? "تم حذف الشيفت 🗑️" : "Shift deleted 🗑️");
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
    const t = (type || "").toLowerCase();
    switch (t) {
      case "morning":
        return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 gap-1"><Sun className="w-3 h-3" />{ar ? "صباحي" : "Morning"}</Badge>;
      case "evening":
        return <Badge className="bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 gap-1"><Moon className="w-3 h-3" />{ar ? "مسائي" : "Evening"}</Badge>;
      case "night":
        return <Badge className="bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 gap-1"><MoonStar className="w-3 h-3" />{ar ? "ليلي" : "Night"}</Badge>;
      case "flexible":
      case "flex":
        return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 gap-1"><Zap className="w-3 h-3" />{ar ? "مرن" : "Flexible"}</Badge>;
      case "fixed":
      default:
        return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 gap-1"><Sunrise className="w-3 h-3" />{ar ? "ثابت" : "Fixed"}</Badge>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir={ar ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Clock className="w-6 h-6 text-brand-primary" />
            {ar ? "إدارة الشيفتات وساعات العمل" : "Shift Management"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {ar ? "قم بإضافة الشيفتات وتعيينها وتطبيقها على الموظفين والأقسام والفروع" : "Define shifts and assign them to employees, departments, or branches"}
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2 bg-brand-primary text-white hover:bg-brand-primary/90 shadow-sm">
          <Plus className="w-4 h-4" />
          {ar ? "إضافة شيفت جديد" : "Add Shift"}
        </Button>
      </div>

      {/* Shifts Grid */}
      {loading ? (
        <div className="flex justify-center items-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /></div>
      ) : shifts.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
          <h3 className="font-semibold text-lg">{ar ? "لا توجد شيفتات مسجلة" : "No Shifts Found"}</h3>
          <Button onClick={openCreateDialog} variant="outline" className="mt-4 gap-2">
            <Plus className="w-4 h-4" />{ar ? "إضافة أول شيفت" : "Create First Shift"}
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {shifts.map((shift) => {
            const shiftAssigns = assignments.filter((a) => a.shift_id === shift.id);
            const isCompanyAssigned = shiftAssigns.some((a) => a.assignment_type === "company");

            return (
              <Card key={shift.id} className="border shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <CardHeader className="pb-3 border-b bg-muted/20">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <CardTitle className="text-lg font-bold">{shift.name}</CardTitle>
                      <div className="mt-1">{getShiftBadge(shift.shift_type)}</div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditDialog(shift)} title={ar ? "تعديل" : "Edit"}>
                        <Edit3 className="w-4 h-4 text-muted-foreground hover:text-brand-primary" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setDeleteShiftId(shift.id)} title={ar ? "حذف" : "Delete"}>
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="py-4 space-y-4 flex-1">
                  {/* Timing Details */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-muted/30 rounded-lg text-center font-mono">
                    <div>
                      <span className="text-[11px] text-muted-foreground block font-sans">{ar ? "من" : "From"}</span>
                      <span className="text-sm font-bold">{shift.start_time || "--:--"}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block font-sans">{ar ? "إلى" : "To"}</span>
                      <span className="text-sm font-bold">{shift.end_time || "--:--"}</span>
                    </div>
                  </div>

                  <div className="text-xs space-y-1 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>{ar ? "ساعات العمل المطلوب:" : "Work Hours:"}</span>
                      <span className="font-semibold text-foreground">{shift.required_daily_hours || 8} {ar ? "ساعات" : "hrs"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{ar ? "فترة السماح بالدخول:" : "Grace Period:"}</span>
                      <span className="font-semibold text-foreground">{shift.grace_period || 0} {ar ? "دقيقة" : "min"}</span>
                    </div>
                  </div>

                  {/* Assignments Coverage Section */}
                  <div className="pt-2 border-t space-y-2">
                    <span className="text-xs font-semibold text-foreground block">{ar ? "النطاق والمستهدفين المعينين:" : "Assigned Scope:"}</span>
                    <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
                      {isCompanyAssigned ? (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 gap-1 text-[11px]">
                          <Building2 className="w-3 h-3" />{ar ? "الشركة ككل" : "All Company"}
                        </Badge>
                      ) : shiftAssigns.length === 0 ? (
                        <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50/50 text-[11px] gap-1">
                          <AlertCircle className="w-3 h-3" />{ar ? "غير مخصص (افتراضي)" : "Unassigned"}
                        </Badge>
                      ) : (
                        shiftAssigns.map((a) => {
                          if (a.assignment_type === "branch") {
                            const bName = a.branch_name || branches.find(b => b.id === a.target_id || b.id === a.branch_id)?.name_ar;
                            return <Badge key={a.id} className="bg-purple-50 text-purple-700 border-purple-200 text-[11px] gap-1"><Building2 className="w-3 h-3" />{bName || (ar ? "فرع" : "Branch")}</Badge>;
                          }
                          if (a.assignment_type === "department") {
                            const dName = a.department_name || departments.find(d => d.id === a.target_id || d.id === a.department_id)?.name_ar;
                            return <Badge key={a.id} className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] gap-1"><FolderTree className="w-3 h-3" />{dName || (ar ? "قسم" : "Dept")}</Badge>;
                          }
                          if (a.assignment_type === "employee") {
                            const eName = a.employee_name || employees.find(e => e.id === a.target_id || e.id === a.employee_id)?.full_name_ar;
                            return <Badge key={a.id} className="bg-slate-100 text-slate-800 border-slate-300 text-[11px] gap-1"><Users className="w-3 h-3" />{eName || (ar ? "موظف" : "Emp")}</Badge>;
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
                    {ar ? "تخصيص / تعيين الشيفت" : "Assign Shift"}
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
              <span>{ar ? "تعيين الشيفت: " + (assignShift?.name || "") : "Assign Shift: " + (assignShift?.name || "")}</span>
            </DialogTitle>
            <DialogDescription>
              {ar ? "حدد النطاق والمستهدفين لتطبيق هذا الشيفت عليهم" : "Select target scope to apply this shift"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Target Type Selection */}
            <div className="space-y-2">
              <Label className="font-semibold">{ar ? "نوع التخصيص والتعيين:" : "Assignment Scope:"}</Label>
              <Select value={assignmentType} onValueChange={(v: any) => { setAssignmentType(v); setSelectedTargetId(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">{ar ? "🏢 الشركة بالكامل" : "Company-wide"}</SelectItem>
                  <SelectItem value="branch">{ar ? "🏛️ فرع محدد" : "Specific Branch"}</SelectItem>
                  <SelectItem value="department">{ar ? "📂 قسم محدد" : "Specific Department"}</SelectItem>
                  <SelectItem value="employee">{ar ? "👤 موظف خاص" : "Specific Employee"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target Selector */}
            {assignmentType === "branch" && (
              <div className="space-y-2">
                <Label>{ar ? "اختر الفرع:" : "Select Branch:"}</Label>
                <Select value={selectedTargetId} onValueChange={setSelectedTargetId}>
                  <SelectTrigger><SelectValue placeholder={ar ? "اختر فرع..." : "Select Branch"} /></SelectTrigger>
                  <SelectContent>
                    {branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name_ar || b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {assignmentType === "department" && (
              <div className="space-y-2">
                <Label>{ar ? "اختر القسم:" : "Select Department:"}</Label>
                <Select value={selectedTargetId} onValueChange={setSelectedTargetId}>
                  <SelectTrigger><SelectValue placeholder={ar ? "اختر قسم..." : "Select Department"} /></SelectTrigger>
                  <SelectContent>
                    {departments.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name_ar || d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {assignmentType === "employee" && (
              <div className="space-y-2">
                <Label>{ar ? "اختر الموظف:" : "Select Employee:"}</Label>
                <Select value={selectedTargetId} onValueChange={setSelectedTargetId}>
                  <SelectTrigger><SelectValue placeholder={ar ? "اختر موظف..." : "Select Employee"} /></SelectTrigger>
                  <SelectContent>
                    {employees.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.full_name_ar || e.full_name || e.first_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <Label>{ar ? "تاريخ البداية:" : "Start Date:"}</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{ar ? "تاريخ النهاية (اختياري):" : "End Date:"}</Label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} placeholder="دائم" />
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setAssignShift(null)} disabled={isAssigning}>{ar ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleAssignSubmit} disabled={isAssigning} className="bg-brand-primary text-white gap-2">
              {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {ar ? "تأكيد التعيين" : "Confirm Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Shift Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" dir={ar ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{editingShift ? (ar ? "تعديل الشيفت: " + (editingShift.name || "") : "Edit Shift") : (ar ? "إضافة شيفت جديد" : "Add New Shift")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>{ar ? "اسم الشيفت:" : "Shift Name:"}</Label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder={ar ? "مثال: الشيفت الصباحي الرئيسي" : "Shift Name"} />
            </div>
            <div>
              <Label>{ar ? "نوع الشيفت:" : "Shift Type:"}</Label>
              <Select value={formData.shift_type} onValueChange={v => setFormData({ ...formData, shift_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">{ar ? "صباحي" : "Morning"}</SelectItem>
                  <SelectItem value="evening">{ar ? "مسائي" : "Evening"}</SelectItem>
                  <SelectItem value="night">{ar ? "ليلي" : "Night"}</SelectItem>
                  <SelectItem value="fixed">{ar ? "ثابت" : "Fixed"}</SelectItem>
                  <SelectItem value="flexible">{ar ? "مرن" : "Flexible"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{ar ? "وقت البداية:" : "Start Time:"}</Label>
                <Input type="time" value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} />
              </div>
              <div>
                <Label>{ar ? "وقت النهاية:" : "End Time:"}</Label>
                <Input type="time" value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{ar ? "ساعات العمل المطلوب:" : "Work Hours:"}</Label>
                <Input type="number" value={formData.required_daily_hours} onChange={e => setFormData({ ...formData, required_daily_hours: Number(e.target.value) })} />
              </div>
              <div>
                <Label>{ar ? "سماح التأخير (دقائق):" : "Grace Period (min):"}</Label>
                <Input type="number" value={formData.grace_period} onChange={e => setFormData({ ...formData, grace_period: Number(e.target.value) })} />
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>{ar ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleSaveShift} disabled={isSaving} className="bg-brand-primary text-white">{ar ? "حفظ" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteShiftId} onOpenChange={(o) => !o && setDeleteShiftId(null)}>
        <DialogContent className="max-w-md" dir={ar ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-red-600">{ar ? "تأكيد حذف الشيفت" : "Delete Shift"}</DialogTitle>
            <DialogDescription>{ar ? "هل أنت متأكد من رغبتك في حذف هذا الشيفت؟" : "Are you sure you want to delete this shift?"}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDeleteShiftId(null)} disabled={isDeleting}>{ar ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleDeleteShift} disabled={isDeleting} className="bg-red-600 text-white hover:bg-red-700">{ar ? "نعم، حذف" : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
