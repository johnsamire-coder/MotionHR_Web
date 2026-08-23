"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Clock, Plus, Search, Users, Edit, Trash2,
  MoreVertical, Loader2, Sun, Moon, Sunrise, Star, Coffee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/lib/stores/auth";
import { useDict, useLangStore } from "@/lib/stores/language";
import axios from "axios";

interface Shift {
  id: number;
  name: string;
  shift_type?: string;
  start_time?: string;
  end_time?: string;
  required_daily_hours?: number;
  grace_period?: number;
  break_duration?: number;
  crosses_midnight?: boolean;
  early_checkout_allowed?: boolean;
  early_checkout_minutes?: number;
  late_checkout_allowed?: boolean;
  late_checkout_minutes?: number;
  is_default?: boolean;
  is_active?: boolean;
  work_sunday?: boolean;
  work_monday?: boolean;
  work_tuesday?: boolean;
  work_wednesday?: boolean;
  work_thursday?: boolean;
  work_friday?: boolean;
  work_saturday?: boolean;
}

function getShiftIcon(startTime?: string) {
  if (!startTime) return Clock;
  const hour = parseInt(startTime.split(":")[0]);
  if (hour >= 5 && hour < 12) return Sunrise;
  if (hour >= 12 && hour < 17) return Sun;
  return Moon;
}

function getShiftColor(startTime?: string) {
  if (!startTime) return "text-brand-primary bg-brand-primary/10";
  const hour = parseInt(startTime.split(":")[0]);
  if (hour >= 5 && hour < 12) return "text-orange-600 bg-orange-500/10";
  if (hour >= 12 && hour < 17) return "text-yellow-600 bg-yellow-500/10";
  return "text-indigo-600 bg-indigo-500/10";
}

function formatTime(time?: string) {
  if (!time) return "—";
  return time.substring(0, 5);
}

function StatCard({
  icon: Icon, label, value, color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
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

export default function ShiftsPage() {
  const { token } = useAuthStore();
  const d = useDict();
  const lang = useLangStore((s) => s.lang);

  const DAYS = [
    { key: "work_saturday", label: lang === "en" ? "Sa" : "س" },
    { key: "work_sunday",   label: lang === "en" ? "Su" : "ح" },
    { key: "work_monday",   label: lang === "en" ? "Mo" : "ن" },
    { key: "work_tuesday",  label: lang === "en" ? "Tu" : "ث" },
    { key: "work_wednesday",label: lang === "en" ? "We" : "ر" },
    { key: "work_thursday", label: lang === "en" ? "Th" : "خ" },
    { key: "work_friday",   label: lang === "en" ? "Fr" : "ج" },
  ];

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [deleteShiftId, setDeleteShiftId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // Assign Dialog
  const [assignShift, setAssignShift] = useState<Shift | null>(null);
  const [employees, setEmployees] = useState<Array<{id: number; name: string}>>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [assignForm, setAssignForm] = useState({ employee_ids: [] as number[], start_date: "", end_date: "" });
  const [isAssigning, setIsAssigning] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    shift_type: "fixed",
    start_time: "09:00",
    end_time: "17:00",
    required_daily_hours: 8,
    crosses_midnight: false,
    grace_period: 15,
    break_duration: 60,
    early_checkout_allowed: false,
    early_checkout_minutes: 0,
    late_checkout_allowed: false,
    late_checkout_minutes: 0,
  });

  useEffect(() => {
    if (!token) return;
    loadShifts();
  }, [token]);

  const loadEmployees = async () => {
    setEmployeesLoading(true);
    try {
      const res = await fetch("/api/employees/list", {
        headers: { Authorization: token.startsWith("Token ") ? token : (token.startsWith("Token ") ? token : `Token ${token}`) },
      });
      const data = await res.json();

      const rawList =
        data?.employees ||
        data?.items ||
        data?.results ||
        data?.data ||
        (Array.isArray(data) ? data : []);

      const normalized = Array.isArray(rawList)
        ? rawList.map((e: any) => ({
            id: e.id,
            name:
              e.full_name_ar ||
              e.full_name ||
              e.name ||
              `${e.first_name_ar || e.first_name || ""} ${e.last_name_ar || e.last_name || ""}`.trim() ||
              `#${e.id}`,
          }))
        : [];

      setEmployees(normalized);
    } catch (err) {
      console.error("loadEmployees error:", err);
      setEmployees([]);
      toast.error(lang === "ar" ? "تعذر تحميل الموظفين" : "Failed to load employees");
    } finally {
      setEmployeesLoading(false);
    }
  };

  const loadShifts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get<{ shifts?: Shift[] } | Shift[]>("/api/shifts", {
        headers: { Authorization: token.startsWith("Token ") ? token : (token.startsWith("Token ") ? token : `Token ${token}`) },
      });
      const list = Array.isArray(response.data)
        ? response.data
        : response.data.shifts || [];
      setShifts(list);
    } catch {
      toast.error(d.failedLoad);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredShifts = useMemo(() =>
    shifts.filter((s) => (s.is_active !== false) && (!search || (s.name || "").toLowerCase().includes(search.toLowerCase()))),
    [shifts, search]
  );

  const openCreateDialog = () => {
    setEditingShift(null);
    setFormData({
      name: "", shift_type: "fixed",
      start_time: "09:00", end_time: "17:00",
      required_daily_hours: 8, crosses_midnight: false,
    grace_period: 15, break_duration: 60,
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
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteShiftId) return;
    setIsDeleting(true);
    try {
      const res = await axios.delete(`/api/shifts?id=${deleteShiftId}`, {
        headers: { Authorization: token.startsWith("Token ") ? token : `Token ${token}` },
      });
      const data = res.data;

      if (data?.soft_deleted) {
        // Soft delete - الشيفت اتعطل مش اتمسح
        toast.success(data.message || (lang === "ar" ? "تم إلغاء تفعيل الشيفت (مرتبط ببيانات)" : "Shift deactivated (has related data)"));
      } else {
        toast.success(lang === "ar" ? "تم حذف الشيفت نهائياً" : "Shift permanently deleted");
      }
      setDeleteShiftId(null);
      loadShifts();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string; message?: string } } };
      toast.error(err?.response?.data?.error || err?.response?.data?.message || (lang === "ar" ? "فشل الحذف" : "Delete failed"));
    } finally {
      setIsDeleting(false);
    }
  };

  
  const handleSave = async () => {
    if (!formData.name.trim()) { toast.error(d.shiftNameRequired); return; }
    setIsSaving(true);
    try {
      if (editingShift) {
        // Edit mode
        await axios.put(`/api/shifts?id=${editingShift.id}`, formData, {
          headers: { Authorization: token.startsWith("Token ") ? token : (token.startsWith("Token ") ? token : `Token ${token}`) },
        });
        toast.success(lang === "ar" ? "تم تعديل الشيفت" : "Shift updated");
      } else {
        // Create mode
        await axios.post("/api/shifts", formData, {
          headers: { Authorization: token.startsWith("Token ") ? token : (token.startsWith("Token ") ? token : `Token ${token}`) },
        });
        toast.success(d.createdShiftSuccess);
      }
      setDialogOpen(false);
      setEditingShift(null);
      loadShifts();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string; message?: string } } };
      toast.error(err?.response?.data?.error || err?.response?.data?.message || d.failedCreateShift);
    } finally {
      setIsSaving(false);
    }
  };

  const openAssignDialog = (shift: Shift) => {
    setAssignShift(shift);
    setAssignForm({ employee_ids: [], start_date: new Date().toISOString().split("T")[0], end_date: "" });
    if (employees.length === 0) loadEmployees();
  };

  const handleAssign = async () => {
    if (!assignShift || assignForm.employee_ids.length === 0 || !assignForm.start_date) {
      toast.error(lang === "ar" ? "اختر موظف وتاريخ البداية" : "Select employee and start date");
      return;
    }
    setIsAssigning(true);
    try {
      const res = await fetch("/api/hr/shifts/assign", {
        method: "POST",
        headers: { Authorization: (token.startsWith("Token ") ? token : `Token ${token}`), "Content-Type": "application/json" },
        body: JSON.stringify({
          shift_id: assignShift.id,
          employee_ids: assignForm.employee_ids,
          start_date: assignForm.start_date,
          end_date: assignForm.end_date || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(lang === "ar" ? `تم تعيين الشيفت لـ ${assignForm.employee_ids.length} موظف` : `Shift assigned to ${assignForm.employee_ids.length} employee(s)`);
        setAssignShift(null);
      } else {
        toast.error(data.error || data.message || (lang === "ar" ? "فشل التعيين" : "Assignment failed"));
      }
    } catch {
      toast.error(lang === "ar" ? "خطأ في الاتصال" : "Connection error");
    } finally {
      setIsAssigning(false);
    }
  };

  const getShiftTypeLabel = (type?: string) => {
    if (type === "fixed") return d.shiftFixed;
    if (type === "flex") return d.shiftFlex;
    return d.shiftOpen;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.shiftsTitle}</h1>
          <p className="text-muted-foreground mt-1">{d.shiftsDesc}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/hr/shifts/exceptions">
            <Button variant="outline" className="gap-2">
              <Clock className="w-4 h-4" />
              {lang === "ar" ? "استثناءات الشيفت" : "Shift Exceptions"}
            </Button>
          </Link>
          <Link href="/hr/shifts/rotations">
            <Button variant="outline" className="gap-2">
              <Users className="w-4 h-4" />
              {lang === "ar" ? "تناوب الشيفت" : "Shift Rotations"}
            </Button>
          </Link>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="w-4 h-4" />
            {d.addShift}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={Clock} label={d.totalShifts} value={shifts.length} color="text-blue-600 bg-blue-500/10" />
        <StatCard icon={Star} label={d.defaultShift} value={shifts.filter(s => s.is_default).length} color="text-yellow-600 bg-yellow-500/10" />
        <StatCard icon={Users} label={d.activeShifts} value={shifts.filter(s => s.is_active !== false).length} color="text-emerald-600 bg-emerald-500/10" />
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={d.searchShifts}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Shifts Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredShifts.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <Clock className="w-12 h-12 text-muted-foreground opacity-40 mb-3" />
            <p className="text-muted-foreground">
              {search ? d.noResults : d.noShifts}
            </p>
            {!search && (
              <Button onClick={openCreateDialog} className="mt-4 gap-2">
                <Plus className="w-4 h-4" />{d.addFirstShift}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredShifts.map(shift => {
            const Icon = getShiftIcon(shift.start_time);
            const colorClass = getShiftColor(shift.start_time);
            return (
              <Card key={shift.id} className="group hover:shadow-md transition-all hover:-translate-y-0.5">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{shift.name}</h3>
                          {shift.is_default && (
                            <Star className="w-4 h-4 text-brand-highlight fill-brand-highlight" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {getShiftTypeLabel(shift.shift_type)}
                        </p>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-muted">
                        <MoreVertical className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(shift)}>
                          <Edit className="w-4 h-4 ml-2" />{d.edit}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openAssignDialog(shift)}>
                          <Users className="w-4 h-4 ml-2" />{d.assignEmployees}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => setDeleteShiftId(shift.id)}
                        >
                          <Trash2 className="w-4 h-4 ml-2" />{d.delete}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Time Range */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-3">
                    <div className="text-center flex-1">
                      <div className="text-xs text-muted-foreground mb-1">{d.shiftStart}</div>
                      <div className="text-lg font-bold" dir="ltr">{formatTime(shift.start_time)}</div>
                    </div>
                    <div className="text-muted-foreground px-2">←</div>
                    <div className="text-center flex-1">
                      <div className="text-xs text-muted-foreground mb-1">{d.shiftEnd}</div>
                      <div className="text-lg font-bold" dir="ltr">{formatTime(shift.end_time)}</div>
                    </div>
                  </div>

                  {/* Info Row */}
                  <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                    <div className="p-2 rounded bg-muted/30">
                      <div className="text-xs text-muted-foreground">{d.shiftHours}</div>
                      <div className="text-sm font-semibold">{shift.required_daily_hours || 8}</div>
                    </div>
                    <div className="p-2 rounded bg-muted/30">
                      <div className="text-xs text-muted-foreground">{d.shiftGrace}</div>
                      <div className="text-sm font-semibold">{shift.grace_period || 0} {d.shiftMin}</div>
                    </div>
                    <div className="p-2 rounded bg-muted/30">
                      <div className="text-xs text-muted-foreground">{d.shiftBreak}</div>
                      <div className="text-sm font-semibold">{shift.break_duration || 0} {d.shiftMin}</div>
                    </div>
                  </div>

                  {/* Working Days */}
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {lang === "en" ? "Working Days" : "أيام العمل"}
                    </div>
                    <div className="flex items-center gap-1">
                      {DAYS.map(day => {
                        const isWorking = shift[day.key as keyof Shift] as boolean;
                        return (
                          <div
                            key={day.key}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                              ${isWorking ? "bg-brand-primary text-white" : "bg-muted text-muted-foreground"}`}
                          >
                            {day.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl sm:max-w-2xl" dir={lang === "ar" ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{editingShift ? (lang === "ar" ? "تعديل الشيفت" : "Edit Shift") : d.addShift}</DialogTitle>
            <DialogDescription>{d.shiftsDesc}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">{lang === "en" ? "Shift Name *" : "اسم الشيفت *"}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder={lang === "en" ? "e.g. Morning Shift" : "مثال: الشيفت الصباحي"}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label>{lang === "en" ? "Shift Type" : "نوع الشيفت"}</Label>
              <Select
                value={formData.shift_type}
                onValueChange={v => setFormData({ ...formData, shift_type: v })}
                disabled={isSaving}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">{lang === "ar" ? "ثابت (بمواعيد حضور وانصراف محددة)" : "Fixed Shift"}</SelectItem>
                  <SelectItem value="flex">{lang === "ar" ? "مرن (حسب مجموع الساعات اليومية)" : "Flexible Shift"}</SelectItem>
                  <SelectItem value="morning">{lang === "ar" ? "صباحي" : "Morning Shift"}</SelectItem>
                  <SelectItem value="evening">{lang === "ar" ? "مسائي" : "Evening Shift"}</SelectItem>
                  <SelectItem value="night">{lang === "ar" ? "ليلي" : "Night Shift"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic UI based on Shift Type */}
            {formData.shift_type === "flex" || formData.shift_type === "flexible" ? (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400">
                  <span>ℹ️ {lang === "ar" ? "نظام الشيفت المرن (Flex Shift)" : "Flexible Shift Mode"}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {lang === "ar"
                    ? "في الشيفت المرن، الموظف مطالب بإنهاء الساعات اليومية المطلوبة في أي وقت خلال نافذة العمل المتاحة."
                    : "Employees fulfill required daily hours within the allowed working window."}
                </p>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="start_time" className="text-xs">
                      {lang === "ar" ? "أبكر وقت لبداية الحضور" : "Earliest Allowed Check-in"}
                    </Label>
                    <Input id="start_time" type="time" value={formData.start_time}
                      onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                      disabled={isSaving} className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="end_time" className="text-xs">
                      {lang === "ar" ? "أقصى وقت لنهاية الانصراف" : "Latest Allowed Check-out"}
                    </Label>
                    <Input id="end_time" type="time" value={formData.end_time}
                      onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                      disabled={isSaving} className="h-9 text-xs" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="start_time">{lang === "ar" ? "وقت البداية الرسمي *" : "Start Time *"}</Label>
                  <Input id="start_time" type="time" value={formData.start_time}
                    onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                    disabled={isSaving} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">{lang === "ar" ? "وقت النهاية الرسمي *" : "End Time *"}</Label>
                  <Input id="end_time" type="time" value={formData.end_time}
                    onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                    disabled={isSaving} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2 p-2.5 border rounded-lg bg-muted/10">
                <Label htmlFor="hours" className="text-xs font-semibold block whitespace-nowrap">
                  {lang === "ar" ? "ساعات العمل اليومية" : "Required Daily Hours"}
                </Label>
                <div className="flex items-center gap-1.5">
                  <Input id="hours" type="number" step="0.5" className="h-9 text-sm font-bold" value={formData.required_daily_hours}
                    onChange={e => setFormData({ ...formData, required_daily_hours: Number(e.target.value) })}
                    disabled={isSaving} />
                  <span className="text-xs text-muted-foreground font-semibold">{lang === "ar" ? "ساعات" : "hrs"}</span>
                </div>
              </div>

              <div className="space-y-2 p-2.5 border rounded-lg bg-muted/10">
                <Label htmlFor="grace" className="text-xs font-semibold block whitespace-nowrap">
                  {lang === "ar" ? "سماحية التأخير (حضور)" : "Check-in Grace Period"}
                </Label>
                <div className="flex items-center gap-1.5">
                  <Input id="grace" type="number" className="h-9 text-sm font-bold" value={formData.grace_period}
                    onChange={e => setFormData({ ...formData, grace_period: Number(e.target.value) })}
                    disabled={isSaving} />
                  <span className="text-xs text-muted-foreground font-semibold">{lang === "ar" ? "دقيقة" : "mins"}</span>
                </div>
              </div>

              <div className="space-y-2 p-2.5 border rounded-lg bg-muted/10">
                <Label htmlFor="break" className="text-xs font-semibold block whitespace-nowrap">
                  {lang === "ar" ? "فترة الراحة (بريك)" : "Break Duration"}
                </Label>
                <div className="flex items-center gap-1.5">
                  <Input id="break" type="number" className="h-9 text-sm font-bold" value={formData.break_duration}
                    onChange={e => setFormData({ ...formData, break_duration: Number(e.target.value) })}
                    disabled={isSaving} />
                  <span className="text-xs text-muted-foreground font-semibold">{lang === "ar" ? "دقيقة" : "mins"}</span>
                </div>
              </div>
            </div>
          </div>

          
            
            {/* Cross-Midnight Shift Indicator */}
            <div className="flex items-center justify-between p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="crosses_midnight" className="text-xs font-semibold cursor-pointer text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                  <span>🌙 {lang === "ar" ? "شيفت يمتد لليوم التالي (يعبر منتصف الليل)" : "Shift Crosses Midnight (Spans 2 Days)"}</span>
                </Label>

                <p className="text-[11px] text-muted-foreground">
                  {lang === "ar"
                    ? "فعّل هذا الخيار للشيفتات الليلية (مثل من 10 م إلى 6 ص) لضمان احتساب الحضور والانصراف بدقة."
                    : "Enable for overnight shifts (e.g. 10 PM to 6 AM) to handle dates accurately."}
                </p>
              </div>

              <Switch
                id="crosses_midnight"
                checked={
                  formData.crosses_midnight ||
                  (Boolean(formData.start_time && formData.end_time && formData.end_time < formData.start_time))
                }
                onCheckedChange={(checked) => setFormData({ ...formData, crosses_midnight: checked })}
              />
            </div>


            {/* Flex Checkout Section */}
            <div className="p-3.5 border rounded-lg bg-muted/20 space-y-3.5 col-span-2">
              <div className="text-xs font-semibold text-brand-primary flex items-center justify-between">
                <span>{lang === "ar" ? "مرونة الانصراف (المواقع والميدانيين)" : "Checkout Flexibility (Sites & Field)"}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Early Checkout */}
                <div className="space-y-2 p-2.5 bg-background rounded border border-border/60">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="early_allowed" className="text-xs cursor-pointer">
                      {lang === "ar" ? "السماح بالانصراف المبكر" : "Allow Early Checkout"}
                    </Label>
                    <Switch
                      id="early_allowed"
                      checked={formData.early_checkout_allowed}
                      onCheckedChange={(v) => setFormData({ ...formData, early_checkout_allowed: v })}
                    />
                  </div>
                  {formData.early_checkout_allowed && (
                    <div className="flex items-center gap-2 pt-1">
                      <Input
                        type="number"
                        min="0"
                        step="5"
                        placeholder="60"
                        className="h-8 text-xs"
                        value={formData.early_checkout_minutes || ""}
                        onChange={(e) => setFormData({ ...formData, early_checkout_minutes: Number(e.target.value) })}
                      />
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">{d.shiftMin}</span>
                    </div>
                  )}
                </div>

                {/* Late Checkout */}
                <div className="space-y-2 p-2.5 bg-background rounded border border-border/60">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="late_allowed" className="text-xs cursor-pointer">
                      {lang === "ar" ? "السماح بالانصراف المتأخر" : "Allow Late Checkout"}
                    </Label>
                    <Switch
                      id="late_allowed"
                      checked={formData.late_checkout_allowed}
                      onCheckedChange={(v) => setFormData({ ...formData, late_checkout_allowed: v })}
                    />
                  </div>
                  {formData.late_checkout_allowed && (
                    <div className="flex items-center gap-2 pt-1">
                      <Input
                        type="number"
                        min="0"
                        step="15"
                        placeholder="180"
                        className="h-8 text-xs"
                        value={formData.late_checkout_minutes || ""}
                        onChange={(e) => setFormData({ ...formData, late_checkout_minutes: Number(e.target.value) })}
                      />
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">{d.shiftMin}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
              {d.cancel}
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving
                ? <><Loader2 className="w-4 h-4 animate-spin" />{d.saving}</>
                : editingShift
                  ? <>{lang === "ar" ? "حفظ التعديلات" : "Save Changes"}</>
                  : <><Plus className="w-4 h-4" />{d.addShift}</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteShiftId} onOpenChange={(open) => !open && setDeleteShiftId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang === "ar" ? "تأكيد الحذف" : "Confirm Delete"}</DialogTitle>
            <DialogDescription>
              {lang === "ar" 
                ? "هل أنت متأكد من حذف هذا الشيفت؟ لن يمكن التراجع." 
                : "Are you sure you want to delete this shift? This cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          
            
            {/* Cross-Midnight Shift Indicator */}
            <div className="flex items-center justify-between p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="crosses_midnight" className="text-xs font-semibold cursor-pointer text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                  <span>🌙 {lang === "ar" ? "شيفت يمتد لليوم التالي (يعبر منتصف الليل)" : "Shift Crosses Midnight (Spans 2 Days)"}</span>
                </Label>

                <p className="text-[11px] text-muted-foreground">
                  {lang === "ar"
                    ? "فعّل هذا الخيار للشيفتات الليلية (مثل من 10 م إلى 6 ص) لضمان احتساب الحضور والانصراف بدقة."
                    : "Enable for overnight shifts (e.g. 10 PM to 6 AM) to handle dates accurately."}
                </p>
              </div>

              <Switch
                id="crosses_midnight"
                checked={
                  formData.crosses_midnight ||
                  (Boolean(formData.start_time && formData.end_time && formData.end_time < formData.start_time))
                }
                onCheckedChange={(checked) => setFormData({ ...formData, crosses_midnight: checked })}
              />
            </div>


            {/* Flex Checkout Section */}
            <div className="p-3.5 border rounded-lg bg-muted/20 space-y-3.5 col-span-2">
              <div className="text-xs font-semibold text-brand-primary flex items-center justify-between">
                <span>{lang === "ar" ? "مرونة الانصراف (المواقع والميدانيين)" : "Checkout Flexibility (Sites & Field)"}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Early Checkout */}
                <div className="space-y-2 p-2.5 bg-background rounded border border-border/60">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="early_allowed" className="text-xs cursor-pointer">
                      {lang === "ar" ? "السماح بالانصراف المبكر" : "Allow Early Checkout"}
                    </Label>
                    <Switch
                      id="early_allowed"
                      checked={formData.early_checkout_allowed}
                      onCheckedChange={(v) => setFormData({ ...formData, early_checkout_allowed: v })}
                    />
                  </div>
                  {formData.early_checkout_allowed && (
                    <div className="flex items-center gap-2 pt-1">
                      <Input
                        type="number"
                        min="0"
                        step="5"
                        placeholder="60"
                        className="h-8 text-xs"
                        value={formData.early_checkout_minutes || ""}
                        onChange={(e) => setFormData({ ...formData, early_checkout_minutes: Number(e.target.value) })}
                      />
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">{d.shiftMin}</span>
                    </div>
                  )}
                </div>

                {/* Late Checkout */}
                <div className="space-y-2 p-2.5 bg-background rounded border border-border/60">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="late_allowed" className="text-xs cursor-pointer">
                      {lang === "ar" ? "السماح بالانصراف المتأخر" : "Allow Late Checkout"}
                    </Label>
                    <Switch
                      id="late_allowed"
                      checked={formData.late_checkout_allowed}
                      onCheckedChange={(v) => setFormData({ ...formData, late_checkout_allowed: v })}
                    />
                  </div>
                  {formData.late_checkout_allowed && (
                    <div className="flex items-center gap-2 pt-1">
                      <Input
                        type="number"
                        min="0"
                        step="15"
                        placeholder="180"
                        className="h-8 text-xs"
                        value={formData.late_checkout_minutes || ""}
                        onChange={(e) => setFormData({ ...formData, late_checkout_minutes: Number(e.target.value) })}
                      />
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">{d.shiftMin}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteShiftId(null)} disabled={isDeleting}>
              {d.cancel}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="gap-2">
              {isDeleting 
                ? <><Loader2 className="w-4 h-4 animate-spin" />{lang === "ar" ? "جاري الحذف..." : "Deleting..."}</>
                : <><Trash2 className="w-4 h-4" />{d.delete}</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Employees Dialog */}
      <Dialog open={!!assignShift} onOpenChange={(open) => !open && setAssignShift(null)}>
        <DialogContent className="max-w-2xl sm:max-w-2xl" dir={lang === "ar" ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>
              {lang === "ar" ? `تعيين موظفين للشيفت: ${assignShift?.name}` : `Assign to Shift: ${assignShift?.name}`}
            </DialogTitle>
            <DialogDescription>
              {lang === "ar" ? "اختر موظف أو أكثر وتاريخ البداية" : "Select employee(s) and start date"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{lang === "ar" ? "الموظفون *" : "Employees *"}</Label>
              <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
                {employeesLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : employees.length === 0 ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    {lang === "ar" ? "لا يوجد موظفون متاحون" : "No employees available"}
                  </div>
                ) : employees.map(emp => (
                  <label key={emp.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={assignForm.employee_ids.includes(emp.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAssignForm(prev => ({ ...prev, employee_ids: [...prev.employee_ids, emp.id] }));
                        } else {
                          setAssignForm(prev => ({ ...prev, employee_ids: prev.employee_ids.filter(id => id !== emp.id) }));
                        }
                      }}
                    />
                    <span className="text-sm">{emp.name}</span>
                  </label>
                ))}
              </div>
              {assignForm.employee_ids.length > 0 && (
                <p className="text-xs text-brand-primary">
                  {lang === "ar" ? `تم اختيار ${assignForm.employee_ids.length} موظف` : `${assignForm.employee_ids.length} selected`}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{lang === "ar" ? "تاريخ البداية *" : "Start Date *"}</Label>
                <input
                  type="date"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={assignForm.start_date}
                  onChange={e => setAssignForm(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{lang === "ar" ? "تاريخ النهاية (اختياري)" : "End Date (optional)"}</Label>
                <input
                  type="date"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={assignForm.end_date}
                  onChange={e => setAssignForm(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>
          </div>

          
            
            {/* Cross-Midnight Shift Indicator */}
            <div className="flex items-center justify-between p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="crosses_midnight" className="text-xs font-semibold cursor-pointer text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                  <span>🌙 {lang === "ar" ? "شيفت يمتد لليوم التالي (يعبر منتصف الليل)" : "Shift Crosses Midnight (Spans 2 Days)"}</span>
                </Label>

                <p className="text-[11px] text-muted-foreground">
                  {lang === "ar"
                    ? "فعّل هذا الخيار للشيفتات الليلية (مثل من 10 م إلى 6 ص) لضمان احتساب الحضور والانصراف بدقة."
                    : "Enable for overnight shifts (e.g. 10 PM to 6 AM) to handle dates accurately."}
                </p>
              </div>

              <Switch
                id="crosses_midnight"
                checked={
                  formData.crosses_midnight ||
                  (Boolean(formData.start_time && formData.end_time && formData.end_time < formData.start_time))
                }
                onCheckedChange={(checked) => setFormData({ ...formData, crosses_midnight: checked })}
              />
            </div>


            {/* Flex Checkout Section */}
            <div className="p-3.5 border rounded-lg bg-muted/20 space-y-3.5 col-span-2">
              <div className="text-xs font-semibold text-brand-primary flex items-center justify-between">
                <span>{lang === "ar" ? "مرونة الانصراف (المواقع والميدانيين)" : "Checkout Flexibility (Sites & Field)"}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Early Checkout */}
                <div className="space-y-2 p-2.5 bg-background rounded border border-border/60">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="early_allowed" className="text-xs cursor-pointer">
                      {lang === "ar" ? "السماح بالانصراف المبكر" : "Allow Early Checkout"}
                    </Label>
                    <Switch
                      id="early_allowed"
                      checked={formData.early_checkout_allowed}
                      onCheckedChange={(v) => setFormData({ ...formData, early_checkout_allowed: v })}
                    />
                  </div>
                  {formData.early_checkout_allowed && (
                    <div className="flex items-center gap-2 pt-1">
                      <Input
                        type="number"
                        min="0"
                        step="5"
                        placeholder="60"
                        className="h-8 text-xs"
                        value={formData.early_checkout_minutes || ""}
                        onChange={(e) => setFormData({ ...formData, early_checkout_minutes: Number(e.target.value) })}
                      />
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">{d.shiftMin}</span>
                    </div>
                  )}
                </div>

                {/* Late Checkout */}
                <div className="space-y-2 p-2.5 bg-background rounded border border-border/60">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="late_allowed" className="text-xs cursor-pointer">
                      {lang === "ar" ? "السماح بالانصراف المتأخر" : "Allow Late Checkout"}
                    </Label>
                    <Switch
                      id="late_allowed"
                      checked={formData.late_checkout_allowed}
                      onCheckedChange={(v) => setFormData({ ...formData, late_checkout_allowed: v })}
                    />
                  </div>
                  {formData.late_checkout_allowed && (
                    <div className="flex items-center gap-2 pt-1">
                      <Input
                        type="number"
                        min="0"
                        step="15"
                        placeholder="180"
                        className="h-8 text-xs"
                        value={formData.late_checkout_minutes || ""}
                        onChange={(e) => setFormData({ ...formData, late_checkout_minutes: Number(e.target.value) })}
                      />
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">{d.shiftMin}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignShift(null)} disabled={isAssigning}>
              {d.cancel}
            </Button>
            <Button onClick={handleAssign} disabled={isAssigning || assignForm.employee_ids.length === 0} className="gap-2">
              {isAssigning
                ? <><Loader2 className="w-4 h-4 animate-spin" />{lang === "ar" ? "جاري التعيين..." : "Assigning..."}</>
                : <><Users className="w-4 h-4" />{d.assignEmployees}</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
