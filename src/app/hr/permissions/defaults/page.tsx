"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Shield, Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Perm { code: string; label_ar: string; scope: string; }

const ROLES = [
  { key: "company_admin", label_ar: "صاحب الشركة", label_en: "Company Admin" },
  { key: "hr_manager", label_ar: "مدير الموارد البشرية", label_en: "HR Manager" },
  { key: "manager", label_ar: "مدير", label_en: "Manager" },
  { key: "employee", label_ar: "موظف", label_en: "Employee" },
];

const SCOPE_COLORS: Record<string, string> = {
  company: "bg-blue-500/10 text-blue-700",
  self: "bg-purple-500/10 text-purple-700",
  department: "bg-teal-500/10 text-teal-700",
  branch: "bg-orange-500/10 text-orange-700",
};

const SCOPE_LABELS: Record<string, string> = {
  company: "الشركة كلها",
  self: "نفسه",
  department: "القسم",
  branch: "الفرع",
};

export default function DefaultsPage() {
  const router = useRouter();
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";

  const [selectedRole, setSelectedRole] = useState("manager");
  const [perms, setPerms] = useState<Perm[]>([]);
  const [loading, setLoading] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/hr/permissions-defaults?role=${selectedRole}`, {
      headers: { Authorization: authH },
    })
      .then(r => r.json())
      .then(data => setPerms(data?.permissions || []))
      .catch(() => toast.error(ar ? "فشل تحميل البيانات" : "Failed to load"))
      .finally(() => setLoading(false));
  }, [selectedRole, authH]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/hr/permissions")}>
          {ar ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {ar ? "الصلاحيات الافتراضية" : "Default Permissions"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {ar ? "عرض الصلاحيات الافتراضية لكل دور في النظام" : "View default permissions for each system role"}
          </p>
        </div>
      </div>

      {/* Role Selector */}
      <div className="flex flex-wrap gap-2">
        {ROLES.map(role => (
          <button
            key={role.key}
            onClick={() => setSelectedRole(role.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition ${
              selectedRole === role.key
                ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                : "border-border text-muted-foreground hover:border-brand-primary/50"
            }`}
          >
            {ar ? role.label_ar : role.label_en}
          </button>
        ))}
      </div>

      {/* Stats */}
      <Card className="border-0 bg-gradient-to-br from-brand-primary/10 to-brand-primary/5">
        <CardContent className="p-4 flex items-center gap-3">
          <Shield className="w-8 h-8 text-brand-primary" />
          <div>
            <p className="font-semibold">
              {ROLES.find(r => r.key === selectedRole)?.[ar ? "label_ar" : "label_en"]}
            </p>
            <p className="text-sm text-muted-foreground">
              {perms.length} {ar ? "صلاحية افتراضية" : "default permissions"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Permissions List */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : perms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Shield className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">
              {ar ? "لا توجد صلاحيات افتراضية" : "No default permissions"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {perms.map((perm, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition"
            >
              <div className="w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center shrink-0">
                <span className="text-white text-xs">✓</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{perm.label_ar}</p>
                <code className="text-[10px] text-muted-foreground">{perm.code}</code>
              </div>
              <Badge className={`text-[10px] border-0 shrink-0 ${SCOPE_COLORS[perm.scope] || SCOPE_COLORS.company}`}>
                {SCOPE_LABELS[perm.scope] || perm.scope}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
