"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Download, Building2, Key, User, FileSpreadsheet, FileText, Loader2, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLangStore } from "@/lib/stores/language";

const STORAGE_KEYS = { token: "motionhr_token" };

interface Role { id: number; name: string; }
interface User { id: number; username: string; first_name?: string; last_name?: string; }

export default function ExportPage() {
  const router = useRouter();
  const { lang } = useLangStore();
  const ar = lang === "ar";

  const [tab, setTab] = useState<"company" | "role" | "user">("company");
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [downloading, setDownloading] = useState<"pdf" | "excel" | null>(null);
  const [loading, setLoading] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hr/permissions-roles", { headers: { Authorization: authH }, cache: "no-store" });
      const data = await res.json();
      if (data.success) setRoles(data.roles || []);
    } catch {
      toast.error(ar ? "فشل تحميل الأدوار" : "Failed to load roles");
    } finally {
      setLoading(false);
    }
  }, [authH, ar]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employees/list", { headers: { Authorization: authH }, cache: "no-store" });
      const data = await res.json();
      const list = data.employees || data.data || data || [];
      setUsers(list.map((e: any) => ({
        id: e.user_id || e.id,
        username: e.username || `emp${e.id}`,
        first_name: e.first_name_ar || e.first_name,
        last_name: e.last_name_ar || e.last_name,
      })));
    } catch {
      toast.error(ar ? "فشل تحميل المستخدمين" : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [authH, ar]);

  useEffect(() => {
    if (tab === "role") loadRoles();
    else if (tab === "user") loadUsers();
    setSelectedId(null);
    setSearch("");
  }, [tab, loadRoles, loadUsers]);

  const handleExport = async (format: "pdf" | "excel") => {
    if (tab !== "company" && !selectedId) {
      toast.error(ar ? "اختر عنصر أولاً" : "Select an item first");
      return;
    }

    setDownloading(format);
    try {
      const params = new URLSearchParams({ type: tab, format });
      if (selectedId) params.set("id", String(selectedId));

      const res = await fetch(`/api/hr/permissions-export?${params.toString()}`, {
        headers: { Authorization: authH },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || (ar ? "فشل التصدير" : "Export failed"));
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      a.download = match?.[1] || `permissions_${tab}_${Date.now()}.${format === "pdf" ? "pdf" : "xlsx"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(ar ? "تم التصدير" : "Exported");
    } catch {
      toast.error(ar ? "خطأ في الاتصال" : "Network error");
    } finally {
      setDownloading(null);
    }
  };

  const filteredRoles = roles.filter(r => r.name?.toLowerCase().includes(search.toLowerCase()));
  const filteredUsers = users.filter(u => {
    const name = `${u.first_name || ""} ${u.last_name || ""} ${u.username}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const tabs = [
    { key: "company", label_ar: "الشركة كاملة", label_en: "Full Company", icon: Building2, color: "bg-blue-500/10 text-blue-600" },
    { key: "role", label_ar: "دور معيّن", label_en: "Specific Role", icon: Key, color: "bg-purple-500/10 text-purple-600" },
    { key: "user", label_ar: "مستخدم معيّن", label_en: "Specific User", icon: User, color: "bg-orange-500/10 text-orange-600" },
  ] as const;

  return (
    <div className="p-6 space-y-6" dir={ar ? "rtl" : "ltr"}>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/hr/permissions")}>
          <span className="text-xl">→</span>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Download className="w-6 h-6 text-brand-primary" />
            {ar ? "تصدير الصلاحيات" : "Export Permissions"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {ar ? "صدّر تقرير الصلاحيات كـ PDF أو Excel" : "Export permissions report as PDF or Excel"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {tabs.map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <Card
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`cursor-pointer transition ${active ? "ring-2 ring-brand-primary" : "hover:shadow-md"}`}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${t.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-semibold">{ar ? t.label_ar : t.label_en}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* List (for role/user) */}
      {tab !== "company" && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={ar ? "ابحث..." : "Search..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-1">
                {tab === "role" && filteredRoles.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className={`w-full text-right p-3 rounded-lg border transition ${
                      selectedId === r.id ? "bg-brand-primary/10 border-brand-primary" : "border-border hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-brand-primary" />
                      <span className="font-medium">{r.name}</span>
                    </div>
                  </button>
                ))}

                {tab === "user" && filteredUsers.map(u => (
                  <button
                    key={u.id}
                    onClick={() => setSelectedId(u.id)}
                    className={`w-full text-right p-3 rounded-lg border transition ${
                      selectedId === u.id ? "bg-brand-primary/10 border-brand-primary" : "border-border hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-brand-primary" />
                      <div className="text-right">
                        <div className="font-medium">{u.first_name} {u.last_name}</div>
                        <div className="text-xs text-muted-foreground">{u.username}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Export Buttons */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground mb-3">
            {ar ? "اختر صيغة التصدير:" : "Choose export format:"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleExport("pdf")}
              disabled={downloading !== null || (tab !== "company" && !selectedId)}
              className="gap-2 h-14 bg-red-500 hover:bg-red-600"
            >
              {downloading === "pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-5 h-5" />}
              {ar ? "تصدير PDF" : "Export PDF"}
            </Button>
            <Button
              onClick={() => handleExport("excel")}
              disabled={downloading !== null || (tab !== "company" && !selectedId)}
              className="gap-2 h-14 bg-green-600 hover:bg-green-700"
            >
              {downloading === "excel" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-5 h-5" />}
              {ar ? "تصدير Excel" : "Export Excel"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
