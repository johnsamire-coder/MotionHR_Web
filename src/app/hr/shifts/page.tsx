"use client";

import { useState, useEffect } from "react";
import { Plus, Clock, Users, Loader2, Edit3, Trash2, Moon, Sun, Sunrise, Sunset, Layers } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useDict, useLangStore } from "@/lib/stores/language";
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
  early_checkout_allowed?: boolean;
  early_checkout_minutes?: number;
  late_checkout_allowed?: boolean;
  late_checkout_minutes?: number;
}

export default function ShiftsPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [deleteShiftId, setDeleteShiftId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    shift_type: "fixed",
    start_time: "09:00",
    end_time: "17:00",
    required_daily_hours: 8,
    grace_period: 15,
    break_duration: 60,
    crosses_midnight: false,
    early_checkout_allowed: false,
    early_checkout_minutes: 0,
    late_checkout_allowed: false,
    late_checkout_minutes: 0,
  });

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") || token?.startsWith("Bearer ") ? token : `Token ${token}`;

  const loadShifts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shifts", { headers: { Authorization: authHeader } });
      const data = await res.json();
      setShifts(Array.isArray(data) ? data : data.shifts || []);
    } catch {
      toast.error(ar ? "فشل تحميل الشيفتات" : "Failed to load shifts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadShifts();
  }, []);

  const openCreateDialog = () => {
    setEditingShift(null);
    setFormData({
      name: "",
      shift_type: "fixed",
      start_time: "09:00",
      end_time: "17:00",
      required_daily_hours: 8,
      grace_period: 15,
      break_duration: 60,
      crosses_midnight: false,
      early_checkout_allowed: false,
      early_checkout_minutes: 0,
      late_checkout_allowed: false,
      late_checkout_minutes: 0,
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
      early_checkout_allowed: shift.early_checkout_allowed || false,
      early_checkout_minutes: shift.early_checkout_minutes || 0,
      late_checkout_allowed: shift.late_checkout_allowed || false,
      late_checkout_minutes: shift.late_checkout_minutes || 0,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error(ar ? "اسم الشيفت مطلوب" : "Shift name required");
      return;
    }
    setIsSaving(true);
    try {
      const isEdit = !!editingShift;
      const url = isEdit ? `/api/shifts?id=${editingShift.id}` : "/api/shifts";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error();
      toast.success(isEdit ? (ar ? "تم تعديل الشيفت بنجاح ✅" : "Shift updated ✅") : (ar ? "تم إضافة الشيفت بنجاح ✅" : "Shift created ✅"));
      setDialogOpen(false);
      loadShifts();
    } catch {
      toast.error(ar ? "فشل حفظ الشيفت" : "Failed to save shift");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteShiftId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/shifts?id=${deleteShiftId}`, {
        method: "DELETE",
        headers: { Authorization: authHeader },
      });
      if (!res.ok) throw new Error();
      toast.success(ar ? "تم حذف الشيفت 🗑️" : "Shift deleted 🗑️");
      setDeleteShiftId(null);
      loadShifts();
    } catch {
      toast.error(ar ? "فشل حذف الشيفت" : "Failed to delete shift");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "—";
    const parts = timeStr.split(":");
    if (parts.length < 2) return timeStr;
    let h = parseInt(parts[0], 10);
    const m = parts[1];
    const ampm = h >= 12 ? (ar ? "م" : "PM") : (ar ? "ص" : "AM");
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{ar ? "إدارة مواعيد وحساب الشيفتات" : "Shifts Management"}</h1>
          <p className="text-muted-foreground mt-1">{ar ? "إعداد الشيفتات الثابتة والمارنة والممتدة لليوم التالي لمهندسي المواقع والمكتب" : "Configure fixed, flexible, and overnight shifts"}</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2 bg-brand-primary text-white hover:bg-brand-primary/90">
          <Plus className="w-4 h-4" />
          {ar ? "إضافة شيفت جديد" : "Add Shift"}
        </Button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : shifts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">{ar ? "لم يتم إضافة أي شيفتات بعد" : "No shifts added yet"}</p>
            <Button onClick={openCreateDialog} variant="outline" className="mt-4 gap-2">
              <Plus className="w-4 h-4" />{ar ? "إضافة أول شيفت" : "Add First Shift"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {shifts.map(shift => (
            <Card key={shift.id} className="border-border/60 hover:shadow-md transition">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold">
                      {shift.shift_type === "night" ? <Moon className="w-5 h-5 text-indigo-600" /> : <Sun className="w-5 h-5 text-amber-600" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-base">{shift.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {shift.shift_type === "flex" || shift.shift_type === "flexible" ? (ar ? "شيفت مرن" : "Flexible") : (ar ? "شيفت ثابت" : "Fixed")}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditDialog(shift)}>
                      <Edit3 className="w-4 h-4 text-muted-foreground hover:text-brand-primary" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setDeleteShiftId(shift.id)}>
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-600" />
                    </Button>
                  </div>
                </div>

                {/* Times */}
                <div className="grid grid-cols-2 gap-2 p-3 bg-muted/30 rounded-lg text-center font-mono">
                  <div>
                    <span className="text-[11px] text-muted-foreground block font-sans">{ar ? "من (البداية)" : "From"}</span>
                    <span className="text-sm font-bold text-foreground">{formatTime(shift.start_time)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block font-sans">{ar ? "إلى (النهاية)" : "To"}</span>
                    <span className="text-sm font-bold text-foreground">{formatTime(shift.end_time)}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs border-t pt-3">
                  <div>
                    <span className="text-muted-foreground block">{ar ? "الساعات" : "Hours"}</span>
                    <span className="font-bold text-foreground">{shift.required_daily_hours || 8} س</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">{ar ? "سماحية" : "Grace"}</span>
                    <span className="font-bold text-amber-600">{shift.grace_period || 0} د</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">{ar ? "الراحة" : "Break"}</span>
                    <span className="font-bold text-foreground">{shift.break_duration || 0} د</span>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {shift.crosses_midnight && (
                    <Badge variant="outline" className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-0 text-[10px] gap-1 font-semibold">
                      <Moon className="w-3 h-3" />
                      <span>{ar ? "يمتد لليوم التالي" : "Overnight"}</span>
                    </Badge>
                  )}
                  {shift.early_checkout_allowed && (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-0 text-[10px]">
                      {ar ? `سماحية انصراف: ${shift.early_checkout_minutes} د` : `Early Grace: ${shift.early_checkout_minutes}m`}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Clean & Spacious Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl sm:max-w-2xl overflow-y-auto max-h-[90vh]" dir={ar ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-primary" />
              <span>{editingShift ? (ar ? `تعديل الشيفت: ${editingShift.name}` : `Edit Shift: ${editingShift.name}`) : (ar ? "إضافة شيفت عمل جديد" : "Add New Shift")}</span>
            </DialogTitle>
            <DialogDescription>
              {ar ? "حدد مواعيد وساعات وقواعد الشيفت بدقة لضمان دقة احتساب المرتبات" : "Configure shift timings and attendance grace rules"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-3">
            {/* Shift Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-semibold">{ar ? "اسم الشيفت *" : "Shift Name *"}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder={ar ? "مثال: شيفت المواقع والتشطيبات" : "e.g. Site Engineers Shift"}
                className="h-10 text-sm"
              />
            </div>

            {/* Shift Type */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">{ar ? "نوع ونظام الشيفت *" : "Shift Type *"}</Label>
              <Select
                value={formData.shift_type}
                onValueChange={v => setFormData({ ...formData, shift_type: v })}
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">{ar ? "شيفت ثابت (بمواعيد بداية ونهاية محددة)" : "Fixed Shift"}</SelectItem>
                  <SelectItem value="flex">{ar ? "شيفت مرن (حسب إجمالي الساعات اليومية)" : "Flexible Shift"}</SelectItem>
                  <SelectItem value="morning">{ar ? "شيفت صباحي" : "Morning Shift"}</SelectItem>
                  <SelectItem value="evening">{ar ? "شيفت مسائي" : "Evening Shift"}</SelectItem>
                  <SelectItem value="night">{ar ? "شيفت ليلي (ممتد)" : "Night Shift"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Timings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-muted/20 border border-border/60 rounded-xl">
              <div className="space-y-1.5">
                <Label htmlFor="start_time" className="text-xs font-semibold">{ar ? "وقت البداية الرسمي" : "Start Time"}</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                  className="h-10 text-sm font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="end_time" className="text-xs font-semibold">{ar ? "وقت النهاية الرسمي" : "End Time"}</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                  className="h-10 text-sm font-mono"
                />
              </div>
            </div>

            {/* 3 Metrics: Hours / Grace / Break */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 p-3 border rounded-xl bg-background">
                <Label htmlFor="hours" className="text-xs font-semibold text-muted-foreground block">{ar ? "ساعات العمل اليومية" : "Daily Hours"}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="hours"
                    type="number"
                    step="0.5"
                    value={formData.required_daily_hours}
                    onChange={e => setFormData({ ...formData, required_daily_hours: Number(e.target.value) })}
                    className="h-9 text-base font-bold text-foreground"
                  />
                  <span className="text-xs font-semibold text-muted-foreground">{ar ? "ساعات" : "hrs"}</span>
                </div>
              </div>

              <div className="space-y-1.5 p-3 border rounded-xl bg-background">
                <Label htmlFor="grace" className="text-xs font-semibold text-muted-foreground block">{ar ? "سماحية التأخير (حضور)" : "Check-in Grace"}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="grace"
                    type="number"
                    value={formData.grace_period}
                    onChange={e => setFormData({ ...formData, grace_period: Number(e.target.value) })}
                    className="h-9 text-base font-bold text-amber-600"
                  />
                  <span className="text-xs font-semibold text-muted-foreground">{ar ? "دقيقة" : "mins"}</span>
                </div>
              </div>

              <div className="space-y-1.5 p-3 border rounded-xl bg-background">
                <Label htmlFor="break" className="text-xs font-semibold text-muted-foreground block">{ar ? "فترة الراحة (بريك)" : "Break Duration"}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="break"
                    type="number"
                    value={formData.break_duration}
                    onChange={e => setFormData({ ...formData, break_duration: Number(e.target.value) })}
                    className="h-9 text-base font-bold text-foreground"
                  />
                  <span className="text-xs font-semibold text-muted-foreground">{ar ? "دقيقة" : "mins"}</span>
                </div>
              </div>
            </div>

            {/* Overnight Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <div className="space-y-0.5">
                <Label htmlFor="crosses_midnight" className="text-sm font-semibold cursor-pointer text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                  <Moon className="w-4 h-4" />
                  <span>{ar ? "شيفت يمتد لليوم التالي (يعبر منتصف الليل)" : "Shift Crosses Midnight (Spans 2 Days)"}</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  {ar ? "تفعيل للشيفتات الليلية (مثل من 10 م إلى 6 ص) لضمان احتساب المواعيد على يوم واحد." : "Enable for overnight shifts spanning across two days."}
                </p>
              </div>
              <Switch
                id="crosses_midnight"
                checked={
                  formData.crosses_midnight ||
                  Boolean(formData.start_time && formData.end_time && formData.end_time < formData.start_time)
                }
                onCheckedChange={(checked) => setFormData({ ...formData, crosses_midnight: checked })}
              />
            </div>

            {/* Flex Checkout Section */}
            <div className="p-4 border border-border/80 rounded-xl bg-muted/20 space-y-3">
              <p className="text-xs font-bold text-brand-primary uppercase tracking-wider">
                {ar ? "مرونة الانصراف (خاصة بالمواقع والميدانيين)" : "Checkout Flexibility (Site & Field Workers)"}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Early Checkout */}
                <div className="p-3 bg-background rounded-lg border border-border/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="early_allowed" className="text-xs font-semibold cursor-pointer">
                      {ar ? "السماح بالانصراف المبكر" : "Allow Early Checkout"}
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
                        className="h-8 text-xs font-bold w-24"
                        value={formData.early_checkout_minutes || ""}
                        onChange={(e) => setFormData({ ...formData, early_checkout_minutes: Number(e.target.value) })}
                      />
                      <span className="text-xs text-muted-foreground font-semibold">{ar ? "دقيقة قبل الميعاد" : "mins before end"}</span>
                    </div>
                  )}
                </div>

                {/* Late Checkout */}
                <div className="p-3 bg-background rounded-lg border border-border/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="late_allowed" className="text-xs font-semibold cursor-pointer">
                      {ar ? "السماح بالانصراف المتأخر" : "Allow Late Checkout"}
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
                        className="h-8 text-xs font-bold w-24"
                        value={formData.late_checkout_minutes || ""}
                        onChange={(e) => setFormData({ ...formData, late_checkout_minutes: Number(e.target.value) })}
                      />
                      <span className="text-xs text-muted-foreground font-semibold">{ar ? "دقيقة بعد الميعاد" : "mins after end"}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-brand-primary text-white hover:bg-brand-primary/90 gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{editingShift ? (ar ? "حفظ التعديلات" : "Save Changes") : (ar ? "إضافة الشيفت" : "Create Shift")}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteShiftId} onOpenChange={(open) => !open && setDeleteShiftId(null)}>
        <DialogContent className="sm:max-w-md" dir={ar ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              <span>{ar ? "تأكيد حذف الشيفت" : "Confirm Delete"}</span>
            </DialogTitle>
            <DialogDescription>
              {ar ? "هل أنت متأكد من رغبتك في حذف هذا الشيفت؟" : "Are you sure you want to delete this shift?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDeleteShiftId(null)} disabled={isDeleting}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="bg-red-600 text-white">
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : null}
              <span>{ar ? "نعم، حذف" : "Delete"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}