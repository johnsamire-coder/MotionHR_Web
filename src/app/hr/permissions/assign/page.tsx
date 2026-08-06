"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Users, Loader2, ChevronRight, ChevronLeft, Crown, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Role { id: number; name: string; }
interface UserItem {
  id: number;
  username: string;
  full_name: string;
  role: string;
  assigned_roles: string[];
}

const ROLE_COLORS: Record<string, string> = {
  company_admin: "bg-brand-primary/10 text-brand-primary",
  hr_manager: "bg-purple-500/10 text-purple-700",
  manager: "bg-blue-500/10 text-blue-700",
  employee: "bg-gray-500/10 text-gray-700",
};

export default function AssignRolesPage() {
  const router = useRouter();
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";

  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<{ userId: number; roleId: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, usersRes] = await Promise.all([
        fetch("/api/hr/permissions-roles", { headers: { Authorization: authH } }).then(r => r.json()),
        fetch("/api/hr/permissions-users", { headers: { Authorization: authH } }).then(r => r.json()),
      ]);
      setRoles(rolesRes?.roles || []);
      setUsers(usersRes?.users || []);
    } catch {
      toast.error(ar ? "فشل تحميل البيانات" : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [authH, ar]);

  useEffect(() => { load(); }, [load]);

  const handleAssign = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/hr/permissions-assign", {
        method: "POST",
        headers: { Authorization: authH, "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: selected.userId, role_id: selected.roleId, action: "assign" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(ar ? "تم تعيين الدور" : "Role assigned");
        setSelected(null);
        load();
      } else {
        toast.error(data.error || data.message || (ar ? "فشل" : "Failed"));
      }
    } catch {
      toast.error(ar ? "خطأ في الاتصال" : "Connection error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (userId: number, roleName: string) => {
    const role = roles.find(r => r.name === roleName);
    if (!role) return;
    try {
      const res = await fetch("/api/hr/permissions-assign", {
        method: "POST",
        headers: { Authorization: authH, "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, role_id: role.id, action: "remove" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(ar ? "تم إزالة الدور" : "Role removed");
        load();
      } else {
        toast.error(data.error || (ar ? "فشل" : "Failed"));
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
          <h1 className="text-3xl font-bold tracking-tight">{ar ? "تعيين الأدوار" : "Assign Roles"}</h1>
          <p className="text-muted-foreground mt-1">{ar ? "ربط الأدوار بالمستخدمين" : "Link roles to users"}</p>
        </div>
      </div>

      {/* Quick Assign */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <p className="font-semibold">{ar ? "تعيين سريع" : "Quick Assign"}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground">{ar ? "اختر مستخدم" : "Select User"}</p>
              <select
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                value={selected?.userId || ""}
                onChange={e => setSelected(prev => ({ userId: Number(e.target.value), roleId: prev?.roleId || 0 }))}
              >
                <option value="">{ar ? "-- اختر مستخدم --" : "-- Select User --"}</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.full_name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground">{ar ? "اختر دور" : "Select Role"}</p>
              <select
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                value={selected?.roleId || ""}
                onChange={e => setSelected(prev => ({ userId: prev?.userId || 0, roleId: Number(e.target.value) }))}
              >
                <option value="">{ar ? "-- اختر دور --" : "-- Select Role --"}</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>
          <Button
            onClick={handleAssign}
            disabled={!selected?.userId || !selected?.roleId || submitting}
            className="gap-2 bg-brand-primary hover:bg-brand-primary/90"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {ar ? "تعيين الدور" : "Assign Role"}
          </Button>
        </CardContent>
      </Card>

      {/* Users List */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(user => (
            <Card key={user.id} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-brand-primary/10 text-brand-primary font-semibold">
                      {user.full_name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.full_name}</p>
                    <Badge className={`${ROLE_COLORS[user.role] || ROLE_COLORS.employee} border-0 text-[10px] mt-0.5`}>
                      {user.role}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {user.assigned_roles?.length > 0 ? (
                      user.assigned_roles.map((r, i) => (
                        <Badge key={i} variant="outline" className="gap-1 text-[10px]">
                          <Crown className="w-3 h-3" />
                          {r}
                          <button onClick={() => handleRemove(user.id, r)}>
                            <X className="w-3 h-3 text-red-500" />
                          </button>
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">{ar ? "لا يوجد أدوار" : "No roles"}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
