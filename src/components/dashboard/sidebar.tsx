"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Play,
  LayoutDashboard, Users, Clock, Calendar, FileText,
  DollarSign, MapPin, Settings, Building2, Upload,
  Briefcase, Bell, FileBarChart, Shield, BookOpen, GitBranch, UserMinus, Map, ScrollText, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDict } from "@/lib/stores/language";

export function Sidebar() {
  const pathname = usePathname();
  const d = useDict();

  const navigation = [
    { key: "dashboard",        href: "/hr/dashboard",        icon: LayoutDashboard },
    { key: "employees",        href: "/hr/employees",         icon: Users },
    { key: "importEmployees",  href: "/hr/employees/import",  icon: Upload },
    { key: "attendance",       href: "/hr/attendance",        icon: Clock },
    { key: "leaves",           href: "/hr/leaves",            icon: Calendar },
    { key: "requests",         href: "/hr/requests",          icon: FileText },
    { key: "payroll",          href: "/hr/payroll",           icon: DollarSign },
    { key: "payrollRuns",     href: "/hr/payroll-runs",     icon: Play },
    { key: "manualEntries",   href: "/hr/manual-entries",  icon: FileText },
    { key: "missions",         href: "/hr/missions",          icon: Briefcase },
    { key: "locations",        href: "/hr/locations",         icon: MapPin },
    { key: "announcements",    href: "/hr/announcements",     icon: Bell },
    { key: "reports",          href: "/hr/reports",           icon: FileBarChart },
    { key: "departments",      href: "/hr/departments",       icon: Building2 },
    { key: "branches",         href: "/hr/branches",          icon: MapPin },
    { key: "shifts",           href: "/hr/shifts",            icon: Clock },
    { key: "jobTitles",        href: "/hr/job-titles",        icon: Briefcase },
    { key: "company",          href: "/hr/company",           icon: Building2 },
    { key: "permissionsTitle",  href: "/hr/permissions",       icon: Shield },
    { key: "policiesTitle",     href: "/hr/policies",          icon: BookOpen },
    { key: "orgChartTitle",     href: "/hr/org-chart",         icon: GitBranch },
    { key: "terminationTitle",  href: "/hr/termination",       icon: UserMinus },
    { key: "workLocationsTitle",href: "/hr/work-locations",    icon: Map },
    { key: "geofenceTitle",     href: "/hr/geofence",          icon: MapPin },
    { key: "companyPoliciesTitle", href: "/hr/company-policies", icon: ScrollText },
    { key: "companyRegulations", href: "/hr/regulations", icon: ScrollText },
    { key: "leaveRecallTitle",  href: "/hr/leave-recall",      icon: Calendar },
    { key: "flexShiftTitle",    href: "/hr/flex-shift",        icon: Zap },
    { key: "dailyReports", href: "/hr/reminders", icon: Bell },
    { key: "settings",         href: "/hr/settings",          icon: Settings },
  ] as const;

  return (
    <aside className="w-64 h-screen bg-sidebar text-sidebar-foreground flex flex-col fixed right-0 top-0 z-50 border-l border-sidebar-border pointer-events-auto">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-sidebar-border">
        <Image
          src="/brand/icon/icon-white.png"
          alt="MotionHR"
          width={32} height={32}
          style={{ width: "auto", height: "auto" }}
          priority
        />
        <div className="flex flex-col">
          <span className="font-bold text-sm">MotionHR</span>
          <span className="text-[10px] text-sidebar-foreground/60 -mt-0.5">
            Workforce Platform
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer select-none",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{d[item.key]}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="text-[10px] text-sidebar-foreground/50 text-center leading-tight">
          <div>{d.designedBy}</div>
          <div className="font-semibold">{d.designedByName}</div>
        </div>
      </div>
    </aside>
  );
}


