"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Clock,
  Plus,
  Search,
  Users,
  Edit,
  Trash2,
  MoreVertical,
  Loader2,
  Sun,
  Moon,
  Sunrise,
  Star,
  Coffee,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAuthStore } from "@/lib/stores/auth";
import axios from "axios";

interface Shift {
  id: number;
  name: string;
  shift_type?: string;
  shift_mode?: string;
  start_time?: string;
  end_time?: string;
  required_daily_hours?: number;
  grace_period?: number;
  break_duration?: number;
  is_default?: boolean;
  is_active?: boolean;
  crosses_midnight?: boolean;
  work_sunday?: boolean;
  work_monday?: boolean;
  work_tuesday?: boolean;
  work_wednesday?: boolean;
  work_thursday?: boolean;
  work_friday?: boolean;
  work_saturday?: boolean;
}

const DAYS = [
  { key: "work_saturday", label: "س" },
  { key: "work_sunday", label: "ح" },
  { key: "work_monday", label: "ن" },
  { key: "work_tuesday", label: "ث" },
  { key: "work_wednesday", label: "ر" },
  { key: "work_thursday", label: "خ" },
  { key: "work_friday", label: "ج" },
];

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
  return time.substring(0, 5); // HH:MM
}

export default function ShiftsPage() {
  const { token } = useAuthStore();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    shift_type: "fixed",
    start_time: "09:00",
    end_time: "17:00",
    required_daily_hours: 8,
    grace_period: 15,
    break_duration: 60,
  });

  useEffect(() => {
    if (!token) return;
    loadShifts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadShifts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get<{ shifts?: Shift[] } | Shift[]>("/api/shifts", {
        headers: { Authorization: `Token ${token}` },
      });
      const list = Array.isArray(response.data)
        ? response.data
        : response.data.shifts || [];
      setShifts(list);
    } catch {
      toast.error("فشل تحميل الشيفتات");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredShifts = useMemo(() => {
    return shifts.filter(
      (s) => !search || (s.name || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [shifts, search]);

  const openCreateDialog = () => {
    setFormData({
      name: "",
      shift_type: "fixed",
      start_time: "09:00",
      end_time: "17:00",
      required_daily_hours: 8,
      grace_period: 15,
      break_duration: 60,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("اسم الشيفت مطلوب");
      return;
    }

    setIsSaving(true);
    try {
      await axios.post("/api/shifts", formData, {
        headers: { Authorization: `Token ${token}` },
      });
      toast.success("تم إنشاء الشيفت بنجاح");
      setDialogOpen(false);
      loadShifts();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "فشل إنشاء الشيفت");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الشيفتات</h1>
          <p className="text-muted-foreground mt-1">إدارة شيفتات العمل</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة شيفت
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Clock}
          label="إجمالي الشيفتات"
          value={shifts.length}
          color="text-blue-600 bg-blue-500/10"
        />
        <StatCard
          icon={Star}
          label="الشيفت الافتراضي"
          value={shifts.filter((s) => s.is_default).length}
          color="text-yellow-600 bg-yellow-500/10"
        />
        <StatCard
          icon={Users}
          label="النشطة"
          value={shifts.filter((s) => s.is_active !== false).length}
          color="text-emerald-600 bg-emerald-500/10"
        />
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث في الشيفتات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
              {search ? "لم يتم العثور على شيفتات" : "لا يوجد شيفتات بعد"}
            </p>
            {!search && (
              <Button onClick={openCreateDialog} className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                إضافة أول شيفت
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredShifts.map((shift) => {
            const Icon = getShiftIcon(shift.start_time);
            const colorClass = getShiftColor(shift.start_time);
            return (
              <Card
                key={shift.id}
                className="group hover:shadow-md transition-all hover:-translate-y-0.5"
              >
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
                          {shift.shift_type === "fixed" ? "ثابت" :
                           shift.shift_type === "flex" ? "مرن" :
                           shift.shift_type || "—"}
                        </p>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-muted">
                        <MoreVertical className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 ml-2" />
                          تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Users className="w-4 h-4 ml-2" />
                          تعيين موظفين
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="w-4 h-4 ml-2" />
                          حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Time Range */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-3">
                    <div className="text-center flex-1">
                      <div className="text-xs text-muted-foreground mb-1">البداية</div>
                      <div className="text-lg font-bold" dir="ltr">{formatTime(shift.start_time)}</div>
                    </div>
                    <div className="text-muted-foreground px-2">←</div>
                    <div className="text-center flex-1">
                      <div className="text-xs text-muted-foreground mb-1">النهاية</div>
                      <div className="text-lg font-bold" dir="ltr">{formatTime(shift.end_time)}</div>
                    </div>
                  </div>

                  {/* Info Row */}
                  <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                    <div className="p-2 rounded bg-muted/30">
                      <div className="text-xs text-muted-foreground">ساعات</div>
                      <div className="text-sm font-semibold">{shift.required_daily_hours || 8}</div>
                    </div>
                    <div className="p-2 rounded bg-muted/30">
                      <div className="text-xs text-muted-foreground">سماح</div>
                      <div className="text-sm font-semibold">{shift.grace_period || 0} د</div>
                    </div>
                    <div className="p-2 rounded bg-muted/30">
                      <div className="text-xs text-muted-foreground">راحة</div>
                      <div className="text-sm font-semibold">{shift.break_duration || 0} د</div>
                    </div>
                  </div>

                  {/* Working Days */}
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">أيام العمل</div>
                    <div className="flex items-center gap-1">
                      {DAYS.map((day) => {
                        const isWorking = shift[day.key as keyof Shift] as boolean;
                        return (
                          <div
                            key={day.key}
                            className={`
                              w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                              ${isWorking
                                ? "bg-brand-primary text-white"
                                : "bg-muted text-muted-foreground"}
                            `}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>إضافة شيفت جديد</DialogTitle>
            <DialogDescription>حدد بيانات الشيفت الجديد</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">اسم الشيفت *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: الشيفت الصباحي"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label>نوع الشيفت</Label>
              <Select
                value={formData.shift_type}
                onValueChange={(v) => setFormData({ ...formData, shift_type: v })}
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">ثابت</SelectItem>
                  <SelectItem value="flex">مرن</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="start_time">وقت البداية</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">وقت النهاية</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="hours">ساعات</Label>
                <Input
                  id="hours"
                  type="number"
                  value={formData.required_daily_hours}
                  onChange={(e) => setFormData({ ...formData, required_daily_hours: Number(e.target.value) })}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grace">سماح (د)</Label>
                <Input
                  id="grace"
                  type="number"
                  value={formData.grace_period}
                  onChange={(e) => setFormData({ ...formData, grace_period: Number(e.target.value) })}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="break">راحة (د)</Label>
                <Input
                  id="break"
                  type="number"
                  value={formData.break_duration}
                  onChange={(e) => setFormData({ ...formData, break_duration: Number(e.target.value) })}
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جارِ الحفظ...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  إنشاء الشيفت
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
