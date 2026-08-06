"use client";

import { useRouter } from "next/navigation";
import { Key, Users, Shield, Download, Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLangStore } from "@/lib/stores/language";

const cards = [
  {
    key: "roles",
    href: "/hr/permissions/roles",
    icon: Key,
    color: "bg-blue-500/10 text-blue-600",
    title_ar: "الأدوار",
    desc_ar: "إنشاء وتعديل الأدوار المخصصة",
    title_en: "Roles",
    desc_en: "Create and manage custom roles",
  },
  {
    key: "assign",
    href: "/hr/permissions/assign",
    icon: Users,
    color: "bg-teal-500/10 text-teal-600",
    title_ar: "تعيين الأدوار",
    desc_ar: "ربط الأدوار بالمستخدمين",
    title_en: "Assign Roles",
    desc_en: "Link roles to users",
  },
  {
    key: "exceptions",
    href: "/hr/permissions/exceptions",
    icon: Settings,
    color: "bg-orange-500/10 text-orange-600",
    title_ar: "استثناءات المستخدمين",
    desc_ar: "منح أو منع صلاحيات خاصة لشخص معين",
    title_en: "User Exceptions",
    desc_en: "Grant or deny specific permissions per user",
  },
  {
    key: "defaults",
    href: "/hr/permissions/defaults",
    icon: Shield,
    color: "bg-purple-500/10 text-purple-600",
    title_ar: "الصلاحيات الافتراضية",
    desc_ar: "عرض وتعديل صلاحيات الأدوار الافتراضية",
    title_en: "Default Permissions",
    desc_en: "View and edit default role permissions",
  },
  {
    key: "export",
    href: "/hr/permissions/export",
    icon: Download,
    color: "bg-emerald-500/10 text-emerald-600",
    title_ar: "تصدير الصلاحيات",
    desc_ar: "صدّر تقرير الصلاحيات كـ PDF أو Excel",
    title_en: "Export Permissions",
    desc_en: "Export permissions report as PDF or Excel",
  },
];

export default function PermissionsHubPage() {
  const router = useRouter();
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {ar ? "إدارة الصلاحيات" : "Permissions Management"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {ar
            ? "اعمل أدوار مخصصة، عينها للمستخدمين، واعمل استثناءات خاصة لأي شخص"
            : "Create custom roles, assign them to users, and set personal exceptions"}
        </p>
      </div>

      <Card className="border-0 bg-gradient-to-br from-brand-primary/10 to-brand-primary/5">
        <CardContent className="p-5">
          <p className="font-semibold text-brand-primary mb-1">
            {ar ? "يعني إيه دور؟" : "What is a Role?"}
          </p>
          <p className="text-sm text-muted-foreground">
            {ar
              ? "الدور هو قالب صلاحيات. مثال: HR أو مدير مالي أو مدير فرع. اعمل الدور الأول وبعدها افتحه وحدد صلاحياته وبعد كده اربطه بالموظف."
              : "A role is a permissions template. Example: HR, Finance Manager, or Branch Manager. Create a role, define its permissions, then assign it to users."}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.key}
              onClick={() => router.push(card.href)}
              className="border-border/50 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-base">
                      {ar ? card.title_ar : card.title_en}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {ar ? card.desc_ar : card.desc_en}
                    </p>
                  </div>
                  <span className="text-muted-foreground text-lg">›</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}


