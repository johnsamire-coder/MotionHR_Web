"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Key, Plus, Loader2, Crown, Trash2, Edit2, ChevronRight, ChevronLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Permission {
  code: string;
  label_ar: string;
  scope?: string;
  scope_label_ar?: string;
}

interface Role {
  id: number;
  name: string;
  permissions: Permission[];
  users_count: number;
}

interface AvailablePerm {
  code: string;
  label_ar: string;
  label_en: string;
}

const SCOPE_OPTIONS = [
  { value: "company", label_ar: "الشركة كلها", label_en: "Company" },
  { value: "self", label_ar: "نفسه", label_en: "Self" },
  { value: "department", label_ar: "القسم", label_en: "Department" },
  { value: "branch", label_ar: "الفرع", label_en: "Branch" },
];

export default function RolesPage() {
  const router = useRouter();
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";

  const [roles, setRoles] = useState<Role[]>([]);
  const [availablePerms, setAvailablePerms] = useState<AvailablePerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialog, setCreateDialog] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<{ code: string; scope: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        fetch("/api/hr/permissions-roles", { headers: { Authorization: authH } }).then(r => r.json()),
        fetch("/api/hr/permissions-available", { headers: { Authorization: authH } }).then(r => r.json()),
      ]);
      setRoles(rolesRes?.roles || []);
      setAvailablePerms(permsRes?.permissions || []);
    } catch {
      toast.error(ar ? "فشل تحميل البيانات" : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [authH, ar]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setRoleName("");
    setSelectedPerms([]);
    setEditRole(null);
    setCreateDialog(true);
  };

  const openEdit = (role: Role) => {
    setRoleName(role.name);
    setSelectedPerms(role.permissions.map(p => ({ code: p.code, scope: p.scope || "company" })));
    setEditRole(role);
    setCreateDialog(true);
  };

  const togglePerm = (code: string) => {
    setSelectedPerms(prev => {
      const exists = prev.find(p => p.code === code);
      if (exists) return prev.filter(p => p.code !== code);
      return [...prev, { code, scope: "company" }];
    });
  };

  const setScope = (code: string, scope: string) => {
    setSelectedPerms(prev => prev.map(p => p.code === code ? { ...p, scope } : p));
  };

  const handleSave = async () => {
    if (!roleName.trim()) {
      toast.error(ar ? "اسم الدور مطلوب" : "Role name required");
      return;
    }
    setSubmitting(true);
    try {
      const isEdit = !!editRole;
      const url = isEdit
        ? `/api/hr/permissions-role-update/${editRole!.id}`
        : "/api/hr/permissions-role-create";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { Authorization: authH, "Content-Type": "application/json" },
        body: JSON.stringify({ name: roleName, permissions: selectedPerms }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isEdit
          ? (ar ? "تم تحديث الدور" : "Role updated")
          : (ar ? "تم إنشاء الدور" : "Role created"));
        setCreateDialog(false);
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

  const handleDelete = async (roleId: number) => {
    if (!confirm(ar ? "هتحذف الدور ده؟" : "Delete this role?")) return;
    try {
      const res = await fetch(`/api/hr/permissions-role-update/${roleId}`, {
        method: "DELETE",
        headers: { Authorization: authH },
      });
      const data = await res.json();
      if (data.success) {
        toast.success(ar ? "تم الحذف" : "Deleted");
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
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/hr/permissions")}>
            {ar ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {ar ? "الأدوار" : "Roles"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {ar ? "إنشاء وتعديل الأدوار المخصصة وصلاحياتها" : "Create and manage custom roles and their permissions"}
            </p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-brand-primary hover:bg-brand-primary/90">
          <Plus className="w-4 h-4" />
          {ar ? "إضافة دور جديد" : "Add New Role"}
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-0 bg-gradient-to-br from-brand-primary/10 to-brand-primary/5">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            {ar
              ? "اضغط على أي دور عشان تفتح صلاحياته وتعدلها"
              : "Click on any role to view and edit its permissions"}
          </p>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : roles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Key className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="font-semibold mb-2">
              {ar ? "مفيش أدوار لسه" : "No roles yet"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {ar ? 'اضغط "إضافة دور جديد" لإنشاء أول دور' : 'Click "Add New Role" to create the first role'}
            </p>
            <Button variant="outline" onClick={openCreate} className="gap-2">
              <Plus className="w-4 h-4" />
              {ar ? "إضافة دور جديد" : "Add New Role"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {roles.map(role => (
            <Card key={role.id} className="border-border/50 hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                    <Crown className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{role.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">
                        <Shield className="w-3 h-3 mr-1" />
                        {role.permissions.length} {ar ? "صلاحية" : "permissions"}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        <Users className="w-3 h-3 mr-1" />
                        {role.users_count} {ar ? "مستخدم" : "users"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(role)}>
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(role.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={createDialog} onOpenChange={open => { if (!open) setCreateDialog(false); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-brand-primary" />
              {editRole
                ? (ar ? "تعديل الدور" : "Edit Role")
                : (ar ? "إنشاء دور جديد" : "Create New Role")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Role Name */}
            <div className="space-y-1.5">
              <Label>{ar ? "اسم الدور *" : "Role Name *"}</Label>
              <Input
                value={roleName}
                onChange={e => setRoleName(e.target.value)}
                placeholder={ar ? "مثال: مدير مالي" : "e.g. Finance Manager"}
              />
            </div>

            {/* Permissions */}
            <div className="space-y-2">
              <Label>{ar ? "الصلاحيات" : "Permissions"}</Label>
              <div className="border border-border rounded-lg max-h-96 overflow-y-auto divide-y divide-border/50">
                {availablePerms.map(perm => {
                  const selected = selectedPerms.find(p => p.code === perm.code);
                  return (
                    <div key={perm.code} className={`p-3 transition ${selected ? "bg-brand-primary/5" : "hover:bg-muted/30"}`}>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => togglePerm(perm.code)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition ${
                            selected ? "bg-brand-primary border-brand-primary" : "border-border"
                          }`}
                        >
                          {selected && <span className="text-white text-xs">✓</span>}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{ar ? perm.label_ar : perm.label_en}</p>
                          <code className="text-[10px] text-muted-foreground">{perm.code}</code>
                        </div>
                        {selected && (
                          <select
                            value={selected.scope}
                            onChange={e => setScope(perm.code, e.target.value)}
                            className="text-xs border border-border rounded px-2 py-1 bg-background"
                          >
                            {SCOPE_OPTIONS.map(s => (
                              <option key={s.value} value={s.value}>
                                {ar ? s.label_ar : s.label_en}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedPerms.length} {ar ? "صلاحية مختارة" : "permissions selected"}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 justify-end pt-2 border-t">
              <Button variant="outline" onClick={() => setCreateDialog(false)} disabled={submitting}>
                {ar ? "إلغاء" : "Cancel"}
              </Button>
              <Button onClick={handleSave} disabled={submitting} className="bg-brand-primary hover:bg-brand-primary/90 gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {editRole ? (ar ? "حفظ التعديلات" : "Save Changes") : (ar ? "إنشاء الدور" : "Create Role")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
