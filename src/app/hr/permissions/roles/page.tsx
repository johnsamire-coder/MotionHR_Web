"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, Search, Key, Users as UsersIcon, AlertCircle, Loader2, Shield, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLangStore } from "@/lib/stores/language";


const STORAGE_KEYS = { token: "motionhr_token" };

type Scope = "company" | "department" | "branch" | "self";

interface Permission {
  code: string;
  name: string;
  name_ar?: string;
  category?: string;
  scopes?: Scope[];
}

interface Role {
  id: number;
  name: string;
  permissions: { code: string; scope: string }[];
  is_system?: boolean;
  user_count?: number;
}

const SCOPE_LABELS: Record<Scope, { ar: string; en: string; color: string }> = {
  company:    { ar: "الشركة",        en: "Company",    color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  department: { ar: "القسم",         en: "Department", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  branch:     { ar: "الفرع",         en: "Branch",     color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  self:       { ar: "الموظف نفسه",   en: "Self",       color: "bg-gray-500/10 text-gray-600 border-gray-500/20" },
};

export default function RolesPage() {
  const router = useRouter();
  const { lang } = useLangStore();
  const ar = lang === "ar";

  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [availablePerms, setAvailablePerms] = useState<Permission[]>([]);
  const [search, setSearch] = useState("");

  // ديالوج إنشاء (اسم فقط)
  const [createDialog, setCreateDialog] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [creating, setCreating] = useState(false);

  // ديالوج تعديل الصلاحيات
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<{ code: string; scope: string }[]>([]);
  const [saving, setSaving] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        fetch(`/api/hr/permissions-roles`, { headers: { Authorization: authH } }),
        fetch(`/api/hr/permissions-available`, { headers: { Authorization: authH } }),
      ]);
      const rolesData = await rolesRes.json();
      const permsData = await permsRes.json();
      if (rolesData.success) setRoles(rolesData.roles || rolesData.data || []);
      if (permsData.success) setAvailablePerms(permsData.permissions || permsData.data || []);
    } catch (e) {
      toast.error(ar ? "فشل تحميل البيانات" : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [authH, ar]);

  useEffect(() => { load(); }, [load]);

  // ─────────── إنشاء دور (اسم فقط) ───────────
  const openCreate = () => {
    setNewRoleName("");
    setCreateDialog(true);
  };

  const handleCreate = async () => {
    if (!newRoleName.trim()) {
      toast.error(ar ? "اسم الدور مطلوب" : "Role name required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`/api/hr/permissions-role-create`, {
        method: "POST",
        headers: { Authorization: authH, "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRoleName.trim() }),
      });
      const data = await res.json();
      if (data.success && data.role) {
        toast.success(ar ? "تم إنشاء الدور" : "Role created");
        setCreateDialog(false);
        setNewRoleName("");
        // إعادة تحميل القائمة + فتح شاشة التعديل مباشرة
        await load();
        const newRole: Role = {
          id: data.role.id,
          name: data.role.name,
          permissions: data.role.permissions || [],
          is_system: false,
        };
        openEdit(newRole);
      } else {
        toast.error(data.message || (ar ? "فشل إنشاء الدور" : "Failed to create role"));
      }
    } catch (e) {
      toast.error(ar ? "خطأ في الاتصال" : "Network error");
    } finally {
      setCreating(false);
    }
  };

  // ─────────── تعديل صلاحيات دور ───────────
  const openEdit = (role: Role) => {
    setEditRole(role);
    setSelectedPerms((role.permissions || []).map(p => ({ code: p.code, scope: p.scope || "company" })));
  };

  const closeEdit = () => {
    setEditRole(null);
    setSelectedPerms([]);
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

  const handleSavePerms = async () => {
    if (!editRole) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/hr/permissions-role-update/${editRole.id}`, {
        method: "PUT",
        headers: { Authorization: authH, "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: selectedPerms }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(ar ? "تم حفظ الصلاحيات" : "Permissions saved");
        closeEdit();
        load();
      } else {
        toast.error(data.message || (ar ? "فشل الحفظ" : "Failed to save"));
      }
    } catch (e) {
      toast.error(ar ? "خطأ في الاتصال" : "Network error");
    } finally {
      setSaving(false);
    }
  };

  // ─────────── حذف دور ───────────
  const handleDelete = async (role: Role) => {
    if (role.is_system) {
      toast.error(ar ? "لا يمكن حذف دور نظامي" : "Cannot delete system role");
      return;
    }
    if (!confirm(ar ? `هل تريد حذف الدور "${role.name}"؟` : `Delete role "${role.name}"?`)) return;
    try {
      const res = await fetch(`/api/hr/permissions-role-delete/${role.id}`, {
        method: "DELETE",
        headers: { Authorization: authH },
      });
      const data = await res.json();
      if (data.success) {
        toast.success(ar ? "تم الحذف" : "Deleted");
        load();
      } else {
        toast.error(data.message || (ar ? "فشل الحذف" : "Failed to delete"));
      }
    } catch (e) {
      toast.error(ar ? "خطأ في الاتصال" : "Network error");
    }
  };

  const filteredRoles = useMemo(() => {
    if (!search.trim()) return roles;
    const q = search.toLowerCase();
    return roles.filter(r => r.name?.toLowerCase().includes(q));
  }, [roles, search]);

  const filteredPerms = useMemo(() => {
    if (!search.trim()) return availablePerms;
    const q = search.toLowerCase();
    return availablePerms.filter(p =>
      p.code?.toLowerCase().includes(q) ||
      p.name?.toLowerCase().includes(q) ||
      p.name_ar?.includes(q)
    );
  }, [availablePerms, search]);

  return (
    <div className="p-6 space-y-6" dir={ar ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/hr/permissions")}>
            <span className="text-xl">→</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Key className="w-6 h-6 text-brand-primary" />
              {ar ? "إدارة الأدوار" : "Roles Management"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {ar ? "أنشئ أدواراً مخصصة وحدد صلاحياتها" : "Create custom roles and define their permissions"}
            </p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-brand-primary hover:bg-brand-primary/90">
          <Plus className="w-4 h-4" />
          {ar ? "إضافة دور جديد" : "Add New Role"}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={ar ? "ابحث عن دور..." : "Search roles..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Roles Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        </div>
      ) : filteredRoles.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Key className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground mb-4">
              {ar ? "لا توجد أدوار بعد" : "No roles yet"}
            </p>
            <Button onClick={openCreate} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              {ar ? "إضافة دور جديد" : "Add New Role"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoles.map(role => (
            <Card key={role.id} className="hover:shadow-md transition cursor-pointer" onClick={() => openEdit(role)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5 text-brand-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{role.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {(role.permissions?.length || 0)} {ar ? "صلاحية" : "permissions"}
                      </p>
                    </div>
                  </div>
                  {role.is_system && (
                    <Badge variant="secondary" className="text-[10px]">{ar ? "نظامي" : "System"}</Badge>
                  )}
                </div>
                {role.user_count !== undefined && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                    <UsersIcon className="w-3.5 h-3.5" />
                    {role.user_count} {ar ? "مستخدم" : "users"}
                  </div>
                )}
                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={(e) => { e.stopPropagation(); openEdit(role); }}
                  >
                    <Edit className="w-3.5 h-3.5" />
                    {ar ? "تعديل الصلاحيات" : "Edit Permissions"}
                  </Button>
                  {!role.is_system && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={(e) => { e.stopPropagation(); handleDelete(role); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ──────── ديالوج إنشاء دور (اسم فقط) ──────── */}
      {createDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setCreateDialog(false)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-primary" />
                <h2 className="text-lg font-semibold">
                  {ar ? "إنشاء دور جديد" : "Create New Role"}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {ar ? "أدخل اسم الدور. بعد الإنشاء ستتمكن من تحديد صلاحياته." : "Enter the role name. After creation, you can define its permissions."}
              </p>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  {ar ? "اسم الدور" : "Role Name"} <span className="text-red-500">*</span>
                </label>
                <Input
                  autoFocus
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                  placeholder={ar ? "مثال: مدير مهندسين" : "e.g. Engineering Manager"}
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  {ar ? "أمثلة: مدير مالي، مدير حسابات، مدير عمليات..." : "Examples: Finance Manager, HR Manager, Ops Manager..."}
                </p>
              </div>
              <div className="flex gap-2 justify-end pt-2 border-t">
                <Button variant="outline" onClick={() => setCreateDialog(false)} disabled={creating}>
                  {ar ? "إلغاء" : "Cancel"}
                </Button>
                <Button onClick={handleCreate} disabled={creating} className="gap-2 bg-brand-primary hover:bg-brand-primary/90">
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  {creating ? (ar ? "جاري الإنشاء..." : "Creating...") : (ar ? "إنشاء ومتابعة" : "Create & Continue")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ──────── ديالوج تعديل الصلاحيات ──────── */}
      {editRole && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={closeEdit}>
          <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Shield className="w-5 h-5 text-brand-primary shrink-0" />
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold truncate">
                    {ar ? "صلاحيات:" : "Permissions for:"} {editRole.name}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedPerms.length} {ar ? "صلاحية مختارة" : "permissions selected"}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={closeEdit}>✕</Button>
            </div>

            <div className="p-4 border-b shrink-0">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={ar ? "ابحث عن صلاحية..." : "Search permissions..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {filteredPerms.map(perm => {
                const selected = selectedPerms.find(p => p.code === perm.code);
                return (
                  <div
                    key={perm.code}
                    className={`p-3 rounded-lg border transition ${
                      selected ? "bg-brand-primary/5 border-brand-primary/30" : "border-border hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => togglePerm(perm.code)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition ${
                          selected
                            ? "bg-brand-primary border-brand-primary"
                            : "border-border hover:border-brand-primary/50"
                        }`}
                      >
                        {selected && <Check className="w-3 h-3 text-white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-xs font-mono text-muted-foreground">{perm.code}</code>
                          {perm.category && (
                            <Badge variant="outline" className="text-[10px]">{perm.category}</Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium mt-0.5">
                          {ar ? (perm.name_ar || perm.name) : perm.name}
                        </p>
                      </div>
                    </div>
                    {selected && perm.scopes && perm.scopes.length > 0 && (
                      <div className="flex gap-1.5 mt-2 mr-8 flex-wrap">
                        {perm.scopes.map(scope => (
                          <button
                            key={scope}
                            onClick={() => setScope(perm.code, scope)}
                            className={`text-[10px] px-2 py-1 rounded-full border transition ${
                              selected.scope === scope
                                ? SCOPE_LABELS[scope].color + " font-semibold"
                                : "bg-transparent border-border text-muted-foreground hover:border-brand-primary/30"
                            }`}
                          >
                            {ar ? SCOPE_LABELS[scope].ar : SCOPE_LABELS[scope].en}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t flex gap-2 justify-end shrink-0">
              <Button variant="outline" onClick={closeEdit} disabled={saving}>
                {ar ? "إلغاء" : "Cancel"}
              </Button>
              <Button onClick={handleSavePerms} disabled={saving} className="gap-2 bg-brand-primary hover:bg-brand-primary/90">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ الصلاحيات" : "Save Permissions")}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}


