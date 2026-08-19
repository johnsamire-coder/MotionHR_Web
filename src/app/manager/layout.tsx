"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Clock, Calendar, FileText, ShieldCheck,
  Briefcase, MapPin, DollarSign, Users, Inbox,
  Bell, Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TrialBanner } from "@/components/dashboard/trial-banner";
import { Header } from "@/components/dashboard/header";
import { useAuth } from "@/lib/hooks/useAuth";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS, ROLES } from "@/lib/constants/config";

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label_ar: string;
  label_en: string;
  href: string;
  badge?: number;
}

interface NavSection {
  title_ar: string;
  title_en: string;
  items: NavItem[];
}

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth([ROLES.manager, ROLES.employee]);
  const pathname = usePathname();
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";

  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
    if (!token) return;
    const authH = token.startsWith("Token") ? token : `Token ${token}`;

    fetch("/api/manager/pending", { headers: { Authorization: authH } })
      .then(r => r.json())
      .then(data => {
        const leaves   = Array.isArray(data?.pending_leaves)   ? data.pending_leaves.length   : 0;
        const requests = Array.isArray(data?.pending_requests) ? data.pending_requests.length : 0;
        setPendingCount(leaves + requests);
      })
      .catch(() => {});
  }, [pathname]);

  if (!isAuthenticated) return null;

  const sections: NavSection[] = [
    {
      title_ar: "حسابي",
      title_en: "My Account",
      items: [
        { icon: LayoutDashboard, label_ar: "الرئيسية",         label_en: "Dashboard",       href: "/manager/dashboard" },
        { icon: Clock,           label_ar: "حضوري",            label_en: "My Attendance",   href: "/manager/my-attendance" },
        { icon: Calendar,        label_ar: "إجازاتي",          label_en: "My Leaves",       href: "/manager/my-leaves" },
        { icon: FileText,        label_ar: "طلباتي",           label_en: "My Requests",     href: "/manager/my-requests" },
        { icon: ShieldCheck,     label_ar: "أذوناتي",          label_en: "My Permissions",  href: "/manager/my-permissions" },
        { icon: Briefcase,       label_ar: "مهماتي",           label_en: "My Missions",     href: "/manager/my-missions" },
        { icon: MapPin,          label_ar: "زياراتي الميدانية", label_en: "Field Visits",    href: "/manager/my-field-visits" },
        { icon: DollarSign,      label_ar: "كشف مرتبي",        label_en: "My Payslip",      href: "/manager/my-payslip" },
      ],
    },
    {
      title_ar: "فريقي",
      title_en: "My Team",
      items: [
        { icon: Users,     label_ar: "فريقي",           label_en: "My Team",         href: "/manager/team" },
        { icon: Inbox,     label_ar: "طلبات الفريق",    label_en: "Team Requests",   href: "/manager/requests", badge: pendingCount },
        { icon: Clock,     label_ar: "حضور الفريق",     label_en: "Team Attendance", href: "/manager/attendance" },
        { icon: Briefcase, label_ar: "مهمات الفريق",    label_en: "Team Missions",   href: "/manager/missions" },
        { icon: MapPin,    label_ar: "مواقع الفريق",    label_en: "Live Locations",  href: "/manager/locations" },
      ],
    },
    {
      title_ar: "عام",
      title_en: "General",
      items: [
        { icon: Bell,      label_ar: "الإعلانات",       label_en: "Announcements", href: "/manager/announcements" },
        { icon: Bell,      label_ar: "الإشعارات",       label_en: "Notifications", href: "/manager/notifications" },
        { icon: Building2, label_ar: "اللائحة",         label_en: "Regulations",   href: "/manager/regulations" },
        { icon: Users,     label_ar: "الهيكل التنظيمي", label_en: "Org Chart",     href: "/manager/org-chart" },
      ],
    },
  ];

  const isActive = (href: string) => pathname === href;

  const Sidebar = () => (
    <aside className={`fixed top-0 ${ar ? "right-0" : "left-0"} w-64 h-screen bg-brand-primary flex flex-col z-40`}>
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-accent to-emerald-500 flex items-center justify-center">
            <span className="text-brand-primary font-bold text-lg">M</span>
          </div>
          <div>
            <p className="font-bold text-white text-lg">MotionHR</p>
            <p className="text-xs text-white/60">
              {ar ? "بوابة المدير" : "Manager Portal"}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {sections.map((section, idx) => (
          <div key={idx}>
            <h3 className="px-3 py-1 text-xs font-semibold text-white/40 uppercase tracking-wider">
              {ar ? section.title_ar : section.title_en}
            </h3>
            <div className="space-y-0.5 mt-1">
              {section.items.map(item => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                      active
                        ? "bg-brand-accent text-brand-primary font-semibold"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1">{ar ? item.label_ar : item.label_en}</span>
                    {item.badge && item.badge > 0 && (
                      <Badge className="bg-red-500 text-white border-0 text-[10px] h-5 min-w-5 px-1.5">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );

  return (
    <div className="min-h-screen bg-background" dir={ar ? "rtl" : "ltr"}>
      <Sidebar />
      <div className={ar ? "lg:mr-64" : "lg:ml-64"}>
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
