"use client";

import { useDict, useLangStore } from "@/lib/stores/language";
import { Clock, Calendar, FileText, Banknote, ShieldAlert, Award, FileSignature, Receipt, Landmark, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default function PoliciesPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";

  const policyGroups = [
    {
      title: ar ? "مجموعة الحضور ومواعيد العمل" : "Time & Attendance Group",
      items: [
        {
          title: ar ? "سياسات الحضور والغياب" : "Attendance & Absence Policies",
          desc: ar ? "إعدادات التأخيرات، الغياب المتدرج، والـ Overtime." : "Configure late rules, progressive absence, and overtime.",
          icon: Clock,
          href: "/hr/policies/attendance",
          color: "text-blue-600 bg-blue-500/10",
        },
        {
          title: ar ? "دورة حساب المرتبات" : "Payroll Cycle & Cut-off",
          desc: ar ? "تحديد أيام إغلاق الحضور وبداية ونهاية دورة الرواتب." : "Define cut-off dates and payroll cycles.",
          icon: RefreshCw,
          href: "/hr/policies/payroll",
          color: "text-indigo-600 bg-indigo-500/10",
        },
        {
          title: ar ? "العطلات الرسمية" : "Official Holidays",
          desc: ar ? "تعيين الإجازات والعطلات القومية وأيام العمل البديلة." : "Set national holidays and alternative working days.",
          icon: Calendar,
          href: "/hr/regulations",
          color: "text-pink-600 bg-purple-500/10",
        },
      ]
    },
    {
      title: ar ? "مجموعة الإجازات والأرصدة" : "Leaves & Balances Group",
      items: [
        {
          title: ar ? "سياسات وتدرج الإجازات" : "Leave Policies & Tiers",
          desc: ar ? "أرصدة الإجازات المتدرجة حسب مدة الخدمة وأنواع الإجازات المسموحة." : "Leave entitlement tiers based on tenure months.",
          icon: FileText,
          href: "/hr/policies/leave",
          color: "text-emerald-600 bg-emerald-500/10",
        },
      ]
    },
    {
      title: ar ? "مجموعة الرواتب والبدلات والحوافز" : "Payroll, Allowances & Bonuses Group",
      items: [
        {
          title: ar ? "سياسات البدلات الثابتة" : "Fixed Allowances",
          desc: ar ? "بدلات الانتقال والمواقع وبدل المأموريات اليومية والشهرية." : "Monthly and daily field mission allowances.",
          icon: Receipt,
          href: "/hr/policies/allowance",
          color: "text-amber-600 bg-amber-500/10",
        },
        {
          title: ar ? "سياسات المكافآت" : "Bonuses Policy",
          desc: ar ? "المكافآت والمنح الدورية." : "Configure periodic bonuses and grants.",
          icon: Award,
          href: "/hr/policies/bonus",
          color: "text-yellow-600 bg-yellow-500/10",
        },
      ]
    },
    {
      title: ar ? "مجموعة التأمينات والإداريات" : "Insurance & Administrative Group",
      items: [
        {
          title: ar ? "التأمينات الاجتماعية" : "Social Insurance",
          desc: ar ? "إعدادات الأجر التأميني وحصص الشركة والموظف." : "Set min/max limits and company/employee shares.",
          icon: ShieldAlert,
          href: "/hr/policies/insurance",
          color: "text-teal-600 bg-teal-500/10",
        },
        {
          title: ar ? "شرائح الضرائب" : "Tax Brackets",
          desc: ar ? "شرائح ضريبة الدخل وقيمة الإعفاء الشخصي." : "Income tax brackets and personal exemption limit.",
          icon: Landmark,
          href: "/hr/policies/tax",
          color: "text-slate-600 bg-slate-500/10",
        },
        {
          title: ar ? "لائحة الجزاءات الإدارية" : "Disciplinary Penalties",
          desc: ar ? "المخالفات التأديبية والسلوكية فقط (لا تشمل الغياب)." : "Administrative and behavioral violations.",
          icon: FileSignature,
          href: "/hr/policies/deduction",
          color: "text-red-600 bg-red-500/10",
        },
        {
          title: ar ? "مكافأة نهاية الخدمة (EOS)" : "End of Service (EOS)",
          desc: ar ? "حساب قيمة نهاية الخدمة عند الاستقالة أو التقاعد حسب السنوات." : "EOS calculation upon resignation or retirement.",
          icon: Banknote,
          href: "/hr/policies/eos",
          color: "text-orange-600 bg-orange-500/10",
        },
      ]
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{ar ? "السياسات واللوائح" : "Policies & Regulations"}</h1>
        <p className="text-muted-foreground mt-1">
          {ar ? "إدارة وتكوين محرك الرواتب والغياب والإجازات والمكافآت" : "Configure payroll engine, attendance, leaves, and bonuses"}
        </p>
      </div>

      <div className="space-y-10">
        {policyGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-4">
            <h2 className="text-lg font-bold text-brand-primary border-b border-border pb-2">{group.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <Link key={i} href={item.href} className="block group">
                    <Card className="border-border/50 hover:border-brand-primary/50 hover:shadow-md transition-all h-full">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${item.color}`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="space-y-1.5">
                            <h3 className="font-semibold text-base group-hover:text-brand-primary transition-colors">{item.title}</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
