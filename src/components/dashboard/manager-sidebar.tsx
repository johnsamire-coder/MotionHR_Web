"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Clock, Briefcase,
  MapPin, FileText, FileBarChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDict } from "@/lib/stores/language";

export function ManagerSidebar() {
  const pathname = usePathname();
  const d = useDict();

  const navigation = [
    { key: "dashboard",   href: "/manager/dashboard",   icon: LayoutDashboard },
    { key: "myTeam",      href: "/manager/team",        icon: Users },
    { key: "attendance",  href: "/manager/attendance",  icon: Clock },
    { key: "missions",    href: "/manager/missions",    icon: Briefcase },
    { key: "locations",   href: "/manager/locations",   icon: MapPin },
    { key: "requests",    href: "/manager/requests",    icon: FileText },
    { key: "reports",     href: "/manager/reports",     icon: FileBarChart },
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
            Manager Portal
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
              <span>{d[item.key as keyof typeof d]}</span>
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
