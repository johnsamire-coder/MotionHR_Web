"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  FileText,
  DollarSign,
  MapPin,
  Settings,
  Building2,
  Upload,
  Briefcase,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "الرئيسية", href: "/hr/dashboard", icon: LayoutDashboard },
  { name: "الموظفون", href: "/hr/employees", icon: Users },
  { name: "استيراد الموظفين", href: "/hr/employees/import", icon: Upload },
  { name: "الحضور والانصراف", href: "/hr/attendance", icon: Clock },
  { name: "الإجازات", href: "/hr/leaves", icon: Calendar },
  { name: "الطلبات", href: "/hr/requests", icon: FileText },
  { name: "الرواتب", href: "/hr/payroll", icon: DollarSign },
  { name: "المهمات", href: "/hr/missions", icon: Briefcase },
  { name: "المواقع المباشرة", href: "/hr/locations", icon: MapPin },
  { name: "الإعلانات", href: "/hr/announcements", icon: Bell },
    { name: "الأقسام", href: "/hr/departments", icon: Building2 },
  { name: "الفروع", href: "/hr/branches", icon: MapPin },
  { name: "الشركة", href: "/hr/company", icon: Building2 },
  { name: "الإعدادات", href: "/hr/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-sidebar text-sidebar-foreground flex flex-col fixed right-0 top-0 border-l border-sidebar-border">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-sidebar-border">
        <Image
          src="/brand/icon/icon-white.png"
          alt="MotionHR"
          width={32}
          height={32}
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
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="text-[10px] text-sidebar-foreground/50 text-center leading-tight">
          <div>Designed by</div>
          <div className="font-semibold">Eng/John Samir | JS Solutions</div>
        </div>
      </div>
    </aside>
  );
}



