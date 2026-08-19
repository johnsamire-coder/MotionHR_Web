"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Clock, Calendar, FileText, Briefcase,
  Wallet, User, MapPin, Bell, ScrollText, GitBranch,
  ShieldCheck, Megaphone, Menu, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDict } from "@/lib/stores/language";
import { useState, useEffect } from "react";

export function EmployeeSidebar() {
  const pathname = usePathname();
  const d = useDict();

  const navigation = [
    { key: "dashboard",      href: "/employee/dashboard",     icon: LayoutDashboard },
    { key: "myAttendance",   href: "/employee/attendance",    icon: Clock },
    { key: "myLeaves",       href: "/employee/leaves",        icon: Calendar },
    { key: "myRequests",     href: "/employee/requests",      icon: FileText },
    { key: "myPermissions",  href: "/employee/permissions",   icon: ShieldCheck },
    { key: "myMissions",     href: "/employee/missions",      icon: Briefcase },
    { key: "myFieldVisits",  href: "/employee/field-visits",  icon: MapPin },
    { key: "myPayslip",      href: "/employee/payslip",       icon: Wallet },
    { key: "announcementsTitle", href: "/employee/announcements", icon: Megaphone },
    { key: "notifications",  href: "/employee/notifications", icon: Bell },
    { key: "companyRegulations", href: "/employee/regulations", icon: ScrollText },
    { key: "orgChartTitle",  href: "/employee/org-chart",     icon: GitBranch },
    { key: "myProfile",      href: "/employee/profile",       icon: User },
  ] as const;

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-3 right-3 z-[60] bg-brand-primary text-white p-2.5 rounded-lg shadow-xl border border-white/20"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          aria-hidden="true"
        />
      )}

      <aside className={cn(
        "w-64 h-screen bg-sidebar text-sidebar-foreground flex flex-col fixed right-0 top-0 z-50 border-l border-sidebar-border pointer-events-auto transition-transform",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute top-4 left-4 text-sidebar-foreground/70 hover:text-sidebar-foreground z-10"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
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
            Employee Portal
          </span>
        </div>
      </div>

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

      <div className="p-4 border-t border-sidebar-border">
        <div className="text-[10px] text-sidebar-foreground/50 text-center leading-tight">
          <div>{d.designedBy}</div>
          <div className="font-semibold">{d.designedByName}</div>
        </div>
      </div>
    </aside>
    </>
  );
}
