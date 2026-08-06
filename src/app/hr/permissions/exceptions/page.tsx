"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Settings, Loader2, ChevronRight, ChevronLeft, Plus, X, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface AvailablePerm { code: string; label_ar: string; label_en: string; }
interface Override { permission: string; label_ar: string; scope: string; is_granted: boolean; }
interface UserItem {
  id: number;
  username: string;
  full_name: string;
  role: string;
  assigned_roles: string[];
}

const SCOPE_OPTIONS = [
  { value: "company", label_ar: "الشركة كلها" },
  { value: "self", label_ar: "نفسه" },
  { value: "department", label_ar: "القسم" },
  { value: "branch", label_ar: "الفرع" },
];

export default function ExceptionsPage() {
  const router = useRouter();
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";

  const [users, setUsers] = useState<UserItem[]>([]);
  const [availablePerms, setAvailablePerms] = useState<AvailablePerm[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOverrides, setLoadingOverrides] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [selPerm, setSelPerm] = useState("");
  const [selScope, setSelScope] = useState("company");
  const [selGranted, setSelGranted] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;

  useEffect(() => {
    Promise.all([
      fetch("/api/hr/permissions-users", { headers: { Authorization: authH } }).then(r => r.json()),
      fetch("/api/hr/permissions-available", { headers: { Authorization: authH } }).then(r => r.json()),
    ]).then(([uData, pData]) => {
      setUsers(uData?.users || []);
      setAvailablePerms(pData?.permissions || []);
    }).catch(() => toast.error(ar ? "فشل تحميل البيانات" : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const loadOverrides = useCallback(async (user: UserItem) => {
    setSelectedUser(user);
    setLoadingOverrides(true);
    try {
      const res = await fetch(`/api/hr/permissions-defaults?user_id=${user.id}`, {
        headers: { Authorization: authH },
      });
      const data = await res.json();
      setOverrides(data?.overrides || []);
    } catch {
      toast.error(ar ? "فشل تحميل الاستثناءات" : "Failed to load exceptions");
    } finally {
      setLoadingOverrides(false);
    }
  }, [authH, ar]);

  const handleAddOverride = async () => {
    if (!selectedUser || !selPerm) {
      toast.error(ar ? "اختر صلاحية" : "Select a permission");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/hr/permissions-override", {
        method: "POST",
        headers: { Authorization: authH, "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set",
          user_id: selectedUser.id,
          permission: selPerm,
          scope: selScope,
          is_granted: selGranted,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(selGranted
          ? (ar ? "تم منح الصلاحية" : "Permission granted")
          : (ar ? "تم سحب الصلاحية" : "Permission revoked"));
        setDialog(false);
        loadOverrides(selectedUser);
      } else {
        toast.error(data.error || (ar ? "فشل" : "Failed"));
      }
    } catch {
      toast.error(ar ? "خطأ" : "Error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveOverride = async (permission: string) => {
    if (!selectedUser) return;
    try {
      const res = await fetch("/api/hr/permissions-override", {
        method: "POST",
        headers: { Authorization: authH, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", user_id: selectedUser.id, permission }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(ar ? "تم إزالة الاستثناء" : "Exception removed");
        loadOverrides(selectedUser);
      }
    } catch {
      toast.error(ar ? "خطأ" : "Error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/hr/permissions")}>
          {ar ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{ar ? "استثناءات المستخدمين" : "User Exceptions"}</h1>
          <p className="text-muted-foreground mt-1">{ar ? "منح أو منع صلاحيات خاصة لشخص معين" : "Grant or deny specific permissions per user"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Users List */}
        <Card className="lg:col-span-1 border-border/50">
          <div className="p-4 border-b border-border">
            <p className="font-semibold text-sm">{ar ? "اختر مستخدم" : "Select User"}</p>
          </div>
          <div className="divide-y divide-border/50 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : users.map(user => (
              <button
                key={user.id}
                onClick={() => loadOverrides(user)}
                className={`w-full flex items-center gap-3 p-3 text-right transition hover:bg-muted/40 ${
                  selectedUser?.id === user.id ? "bg-brand-primary/10" : ""
                }`}
              >
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-xs">
                    {user.full_name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-start">
                  <p className="text-sm font-medium truncate">{user.full_name}</p>
                  <p className="text-xs text-muted-foreground">{user.role}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Overrides */}
        <Card className="lg:col-span-2 border-border/50">
          {!selectedUser ? (
            <CardContent className="flex flex-col items-center justify-center py-24 text-center">
              <Settings className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">{ar ? "اختر مستخدم من القائمة" : "Select a user from the list"}</p>
            </CardContent>
          ) : (
            <>
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <p className="font-semibold">{selectedUser.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {overrides.length} {ar ? "استثناء" : "exceptions"}
                  </p>
                </div>
                <Button onClick={() => { setSelPerm(""); setSelScope("company"); setSelGranted(true); setDialog(true); }}
                  className="gap-2 bg-brand-primary hover:bg-brand-primary/90" size="sm">
                  <Plus className="w-4 h-4" />
                  {ar ? "إضافة استثناء" : "Add Exception"}
                </Button>
              </div>

              <CardContent className="p-4">
                {loadingOverrides ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : overrides.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Settings className="w-10 h-10 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground text-sm">
                      {ar ? "لا توجد استثناءات لهذا المستخدم" : "No exceptions for this user"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {overrides.map((ov, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border/50">
                        {ov.is_granted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{ov.label_ar}</p>
                          <code className="text-[10px] text-muted-foreground">{ov.permission}</code>
                        </div>
                        <Badge className={`text-[10px] border-0 ${ov.is_granted ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-700"}`}>
                          {ov.is_granted ? (ar ? "ممنوح" : "Granted") : (ar ? "مسحوب" : "Denied")}
                        </Badge>
                        <button onClick={() => handleRemoveOverride(ov.permission)} className="text-muted-foreground hover:text-red-500 transition">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </div>

      {/* Add Exception Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{ar ? "إضافة استثناء" : "Add Exception"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <p className="text-sm font-medium">{ar ? "الصلاحية *" : "Permission *"}</p>
              <select
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                value={selPerm}
                onChange={e => setSelPerm(e.target.value)}
              >
                <option value="">{ar ? "-- اختر صلاحية --" : "-- Select Permission --"}</option>
                {availablePerms.map(p => (
                  <option key={p.code} value={p.code}>
                    {ar ? p.label_ar : p.label_en}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-medium">{ar ? "النطاق" : "Scope"}</p>
              <select
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                value={selScope}
                onChange={e => setSelScope(e.target.value)}
              >
                {SCOPE_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label_ar}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-medium">{ar ? "النوع" : "Type"}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelGranted(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border-2 text-sm font-medium transition ${
                    selGranted ? "border-emerald-500 bg-emerald-500/10 text-emerald-700" : "border-border"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {ar ? "منح" : "Grant"}
                </button>
                <button
                  onClick={() => setSelGranted(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border-2 text-sm font-medium transition ${
                    !selGranted ? "border-red-500 bg-red-500/10 text-red-700" : "border-border"
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  {ar ? "سحب" : "Deny"}
                </button>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t">
              <Button variant="outline" onClick={() => setDialog(false)} disabled={submitting}>
                {ar ? "إلغاء" : "Cancel"}
              </Button>
              <Button onClick={handleAddOverride} disabled={submitting || !selPerm}
                className="bg-brand-primary hover:bg-brand-primary/90 gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {ar ? "حفظ" : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
