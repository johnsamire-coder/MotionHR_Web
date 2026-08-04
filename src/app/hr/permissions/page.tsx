"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Shield, Users, Loader2, Plus, Search,
  Key, Crown, User, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Permission {
  code: string;
  label_ar: string;
  label_en: string;
}

interface Role {
  id: number;
  name: string;
  permissions_count?: number;
}

interface UserItem {
  id: number;
  username: string;
  full_name: string;
  role: string;
  assigned_roles: string[];
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
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PermissionsPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);

  const [activeTab, setActiveTab] = useState<"roles" | "users" | "perms">("roles");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      fetch("/api/hr/permissions-available", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/hr/permissions-roles", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/hr/permissions-users", { headers: { Authorization: authHeader } }).then(r => r.json()),
    ]).then(([permsData, rolesData, usersData]) => {
      setPermissions(permsData?.permissions || []);
      setRoles(rolesData?.roles || []);
      setUsers(usersData?.users || []);
    })
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, []);

  const tabs = [
    { key: "roles" as const, label: d.tabRoles, icon: Key },
    { key: "users" as const, label: d.tabUsers, icon: Users },
    { key: "perms" as const, label: d.tabPermsRef, icon: Shield },
  ];

  const getPermLabel = (perm: Permission) => {
    return lang === "en" && perm.label_en ? perm.label_en : perm.label_ar;
  };

  const filteredPerms = permissions.filter(p => {
    const searchLower = search.toLowerCase();
    return !search ||
      p.code.toLowerCase().includes(searchLower) ||
      p.label_ar.toLowerCase().includes(searchLower) ||
      p.label_en.toLowerCase().includes(searchLower);
  });

  const getRoleColor = (role: string) => {
    const map: Record<string, string> = {
      super_admin: "bg-red-500/10 text-red-700",
      company_admin: "bg-brand-primary/10 text-brand-primary",
      hr_manager: "bg-purple-500/10 text-purple-700",
      manager: "bg-blue-500/10 text-blue-700",
      employee: "bg-gray-500/10 text-gray-700",
    };
    return map[role] || map.employee;
  };

  const getRoleLabel = (role: string) => {
    const map: Record<string, string> = lang === "ar" ? {
      super_admin: "مدير النظام",
      company_admin: "صاحب الشركة",
      hr_manager: "مدير الموارد البشرية",
      manager: "مدير",
      employee: "موظف",
    } : {
      super_admin: "Super Admin",
      company_admin: "Company Admin",
      hr_manager: "HR Manager",
      manager: "Manager",
      employee: "Employee",
    };
    return map[role] || role;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{d.permissionsTitle}</h1>
        <p className="text-muted-foreground mt-1">{d.permissionsDesc}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard icon={Key} label={d.totalRoles} value={roles.length} color="bg-purple-500/10 text-purple-600" />
        <StatCard icon={Users} label={d.totalUsers} value={users.length} color="bg-blue-500/10 text-blue-600" />
        <StatCard icon={Shield} label={d.totalPerms} value={permissions.length} color="bg-emerald-500/10 text-emerald-600" />
      </div>

      {/* Tabs */}
      <Card>
        <div className="border-b border-border bg-muted/30">
          <div className="flex gap-1 px-4">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.key
                    ? "border-brand-primary text-brand-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Roles Tab */}
              {activeTab === "roles" && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button className="bg-brand-primary hover:bg-brand-primary/90 gap-2">
                      <Plus className="w-4 h-4" />
                      {d.createRole}
                    </Button>
                  </div>

                  {roles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Key className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <p className="font-medium mb-4">{d.noRolesData}</p>
                      <Button variant="outline" className="gap-2">
                        <Plus className="w-4 h-4" />
                        {d.createFirstRole}
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {roles.map(role => (
                        <Card key={role.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <Crown className="w-5 h-5 text-purple-600" />
                              </div>
                              <div>
                                <p className="font-semibold">{role.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {role.permissions_count || 0} {lang === "ar" ? "صلاحية" : "permissions"}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Users Tab */}
              {activeTab === "users" && (
                <div className="space-y-4">
                  <div className="relative max-w-md">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={d.searchEmployees}
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="pr-10"
                    />
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.colEmployee}</TableHead>
                        <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.userRole}</TableHead>
                        <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.assignedRoles}</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users
                        .filter(u => !search || u.full_name.toLowerCase().includes(search.toLowerCase()))
                        .slice(0, 20)
                        .map(user => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-xs">
                                    {user.full_name?.[0] || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">{user.full_name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getRoleColor(user.role)} border-0`}>
                                {getRoleLabel(user.role)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {user.assigned_roles && user.assigned_roles.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {user.assigned_roles.map((r, i) => (
                                    <Badge key={i} variant="outline" className="text-[10px]">
                                      {r}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">{d.noAssignedRoles}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm">
                                {d.assignRole}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Permissions Reference Tab */}
              {activeTab === "perms" && (
                <div className="space-y-4">
                  <div className="relative max-w-md">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={d.searchPerms}
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="pr-10"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {filteredPerms.map(perm => (
                      <div key={perm.code} className="p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition">
                        <div className="flex items-center gap-2 mb-1">
                          <Shield className="w-3 h-3 text-brand-primary" />
                          <code className="text-xs font-mono text-muted-foreground">{perm.code}</code>
                        </div>
                        <p className="text-sm font-medium">{getPermLabel(perm)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
