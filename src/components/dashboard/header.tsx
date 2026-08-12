"use client";

import { Bell, LogOut, User, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import { STORAGE_KEYS } from "@/lib/constants/config";
import { useAuthStore } from "@/lib/stores/auth";
import { useLangStore, useDict } from "@/lib/stores/language";

interface Notification {
  id: number;
  title: string;
  title_en?: string;
  message: string;
  message_en?: string;
  notification_type?: string;
  severity?: string;
  is_read: boolean;
  created_at: string;
  link?: string;
  related_type?: string;
  related_id?: number;
}

export function Header() {
  const router = useRouter();
  const { user, company, logout } = useAuthStore();
  const { lang, setLang } = useLangStore();
  const d = useDict();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const handleLogout = () => {
    logout();
    toast.success(lang === "ar" ? "تم تسجيل الخروج بنجاح" : "Logged out successfully");
    router.push("/login");
  };

  const initials = user?.first_name?.[0] || "M";

  const [jobInfo, setJobInfo] = useState<{ job_title?: string; department?: string; job_title_en?: string; department_en?: string } | null>(null);

  const getAuthHeader = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
    if (!token) return null;
    return token.startsWith("Token") ? token : `Token ${token}`;
  };

  const loadNotifications = async () => {
    const authHeader = getAuthHeader();
    if (!authHeader) return;

    setLoadingNotifs(true);
    try {
      const res = await fetch("/api/employee/notifications", {
        headers: {
          Authorization: authHeader,
          "Accept-Language": lang,
        },
        cache: "no-store",
      });
      const data = await res.json();
      const items = data?.notifications || data?.results || data || [];
      setNotifications(Array.isArray(items) ? items : []);
    } catch {
      setNotifications([]);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, [lang]);

  useEffect(() => {
    const authHeader = getAuthHeader();
    if (!authHeader) return;

    fetch("/api/profile", { headers: { Authorization: authHeader } })
      .then(r => r.json())
      .then(data => setJobInfo({
        job_title: data.job_title,
        department: data.department,
      }))
      .catch(() => {});
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const translateAR2EN = (text: string): string => {
    if (!text) return text;
    const translations: Record<string, string> = {
      "تأخير موظف": "Employee Late",
      "طلب جديد": "New Request",
      "طلب إجازة جديد": "New Leave Request",
      "طلب إذن جديد": "New Permission Request",
      "انصراف موظف": "Employee Check-out",
      "حضور موظف": "Employee Check-in",
      "تنبيه تتبع": "Tracking Alert",
      "الموظف": "Employee",
      "تأخر": "was late",
      "دقيقة": "min",
      "دقائق": "minutes",
      "ساعة": "hour",
      "ساعات": "hours",
      "اليوم": "today",
      "اجازة": "leave",
      "إجازة": "leave",
      "طلب": "Request",
      "قدم": "submitted",
      "قدّم": "submitted",
      "من": "from",
      "الى": "to",
      "إلى": "to",
      "بتاريخ": "on",
      "خارج نطاق العمل": "outside work range",
      "منذ": "since",
      "آخر موقع": "Last location",
      "غير محدد": "unknown",
      "تاريخ/وقت": "Date/Time",
      "مواقع": "locations",
      "GPS مغلق": "GPS disabled",
      "لم يتم تحديد الموقع": "Location not determined",
    };
    let result = text;
    for (const [ar, en] of Object.entries(translations)) {
      result = result.split(ar).join(en);
    }
    return result;
  };

  const getNotifTitle = (n: Notification) => {
    if (lang === "en" && n.title_en) return n.title_en;
    if (lang === "en") return translateAR2EN(n.title);
    return n.title;
  };

  const getNotifMessage = (n: Notification) => {
    if (lang === "en" && n.message_en) return n.message_en;
    if (lang === "en") return translateAR2EN(n.message);
    return n.message;
  };

  const handleNotificationClick = async (notif: Notification) => {
    const authHeader = getAuthHeader();
    if (authHeader && !notif.is_read) {
      try {
        await fetch("/api/employee/notifications", {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notification_id: notif.id }),
        });
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      } catch {}
    }

    setNotifsOpen(false);

    if (notif.link) {
      router.push(notif.link);
      return;
    }

    const type = (notif.related_type || notif.notification_type || "").toLowerCase();
    if (type.includes("leave")) {
      router.push("/hr/leaves");
    } else if (type.includes("request")) {
      router.push("/hr/requests");
    } else if (type.includes("attendance") || type.includes("late") || type.includes("tracking")) {
      router.push("/hr/attendance");
    } else if (type.includes("mission")) {
      router.push("/hr/missions");
    } else {
      router.push("/hr/announcements");
    }
  };

  const handleMarkAllRead = async () => {
    const authHeader = getAuthHeader();
    if (!authHeader) return;
    try {
      await fetch("/api/employee/notifications", {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mark_all: true }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success(lang === "ar" ? "تم تعليم الكل كمقروء" : "All marked as read");
    } catch {
      toast.error(lang === "ar" ? "حدث خطأ" : "Error");
    }
  };

  const SIDEBAR_PAGES = [
    { key: "dashboard", href: "/hr/dashboard", label_ar: "لوحة التحكم", label_en: "Dashboard" },
    { key: "employees", href: "/hr/employees", label_ar: "الموظفون", label_en: "Employees" },
    { key: "importEmployees", href: "/hr/employees/import", label_ar: "استيراد موظفين", label_en: "Import Employees" },
    { key: "attendance", href: "/hr/attendance", label_ar: "الحضور والانصراف", label_en: "Attendance" },
    { key: "leaves", href: "/hr/leaves", label_ar: "الإجازات", label_en: "Leaves" },
    { key: "requests", href: "/hr/requests", label_ar: "الطلبات", label_en: "Requests" },
    { key: "payroll", href: "/hr/payroll", label_ar: "الرواتب", label_en: "Payroll" },
    { key: "payrollRuns", href: "/hr/payroll-runs", label_ar: "تشغيل المرتبات", label_en: "Payroll Runs" },
    { key: "manualEntries", href: "/hr/manual-entries", label_ar: "الإدخالات اليدوية", label_en: "Manual Entries" },
    { key: "missions", href: "/hr/missions", label_ar: "المهام", label_en: "Missions" },
    { key: "locations", href: "/hr/locations", label_ar: "المواقع", label_en: "Locations" },
    { key: "announcements", href: "/hr/announcements", label_ar: "الإعلانات", label_en: "Announcements" },
    { key: "reports", href: "/hr/reports", label_ar: "التقارير", label_en: "Reports" },
    { key: "departments", href: "/hr/departments", label_ar: "الأقسام", label_en: "Departments" },
    { key: "branches", href: "/hr/branches", label_ar: "الفروع", label_en: "Branches" },
    { key: "shifts", href: "/hr/shifts", label_ar: "الشيفتات", label_en: "Shifts" },
    { key: "jobTitles", href: "/hr/job-titles", label_ar: "المسميات الوظيفية", label_en: "Job Titles" },
    { key: "company", href: "/hr/company", label_ar: "الشركة", label_en: "Company" },
    { key: "permissions", href: "/hr/permissions", label_ar: "الصلاحيات", label_en: "Permissions" },
    { key: "policies", href: "/hr/policies", label_ar: "السياسات", label_en: "Policies" },
    { key: "orgChart", href: "/hr/org-chart", label_ar: "الهيكل التنظيمي", label_en: "Org Chart" },
    { key: "termination", href: "/hr/termination", label_ar: "إنهاء الخدمة", label_en: "Termination" },
    { key: "workLocations", href: "/hr/work-locations", label_ar: "مواقع العمل", label_en: "Work Locations" },
    { key: "geofence", href: "/hr/geofence", label_ar: "النطاق الجغرافي", label_en: "Geofence" },
    { key: "companyPolicies", href: "/hr/company-policies", label_ar: "سياسات الشركة", label_en: "Company Policies" },
    { key: "regulations", href: "/hr/regulations", label_ar: "اللوائح", label_en: "Regulations" },
    { key: "leaveRecall", href: "/hr/leave-recall", label_ar: "استرجاع الإجازات", label_en: "Leave Recall" },
    { key: "flexShift", href: "/hr/flex-shift", label_ar: "الشيفت المرن", label_en: "Flex Shift" },
    { key: "reminders", href: "/hr/reminders", label_ar: "التذكيرات", label_en: "Reminders" },
    { key: "settings", href: "/hr/settings", label_ar: "الإعدادات", label_en: "Settings" },
  ];

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      setSearchOpen(false);
      router.push(`/hr/employees?search=${encodeURIComponent(searchQuery.trim())}`);
    }
    if (e.key === "Escape") {
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  useEffect(() => {
    const authHeader = getAuthHeader();
    const q = searchQuery.trim();
    if (!authHeader || !q || q.length < 2) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }

    // Filter sidebar pages instantly (client-side)
    const qLower = q.toLowerCase();
    const matchedPages = SIDEBAR_PAGES.filter(p =>
      p.label_ar.toLowerCase().includes(qLower) ||
      p.label_en.toLowerCase().includes(qLower)
    ).slice(0, 4);

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const [empRes, deptRes, brRes, jtRes] = await Promise.all([
          fetch(`/api/employees/list?search=${encodeURIComponent(q)}&page_size=5`, {
            headers: { Authorization: authHeader },
          }).then(r => r.json()).catch(() => ({})),
          fetch(`/api/departments`, {
            headers: { Authorization: authHeader },
          }).then(r => r.json()).catch(() => ({})),
          fetch(`/api/branches`, {
            headers: { Authorization: authHeader },
          }).then(r => r.json()).catch(() => ({})),
          fetch(`/api/job-titles`, {
            headers: { Authorization: authHeader },
          }).then(r => r.json()).catch(() => ({})),
        ]);

        const employees = (empRes?.results || empRes?.employees || []).slice(0, 5);

        const filterByName = (arr: any[], nameKeys: string[]) => {
          return arr.filter((item: any) => {
            return nameKeys.some(k => {
              const v = item[k];
              return v && v.toLowerCase && v.toLowerCase().includes(qLower);
            });
          }).slice(0, 3);
        };

        const deptsRaw = Array.isArray(deptRes) ? deptRes : (deptRes?.departments || deptRes?.results || []);
        const brsRaw = Array.isArray(brRes) ? brRes : (brRes?.branches || brRes?.results || []);
        const jtsRaw = Array.isArray(jtRes) ? jtRes : (jtRes?.job_titles || jtRes?.jobTitles || jtRes?.results || []);

        const departments = filterByName(deptsRaw, ["name", "name_ar", "name_en"]);
        const branches = filterByName(brsRaw, ["name", "name_ar", "name_en"]);
        const jobTitles = filterByName(jtsRaw, ["title", "name", "title_ar", "name_ar", "title_en", "name_en"]);

        setSearchResults([
          { type: "pages", items: matchedPages },
          { type: "employees", items: employees },
          { type: "departments", items: departments },
          { type: "branches", items: branches },
          { type: "jobTitles", items: jobTitles },
        ]);
        setSearchOpen(true);
      } catch {
        setSearchResults([{ type: "pages", items: matchedPages }]);
        setSearchOpen(true);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectResult = (item: any, type: string) => {
    setSearchOpen(false);
    setSearchQuery("");
    if (type === "pages") {
      router.push(item.href);
    } else if (type === "employees") {
      router.push(`/hr/employees/${item.id}`);
    } else if (type === "departments") {
      router.push(`/hr/departments`);
    } else if (type === "branches") {
      router.push(`/hr/branches`);
    } else if (type === "jobTitles") {
      router.push(`/hr/job-titles`);
    }
  };

  const getSectionLabel = (type: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      pages: { ar: "الشاشات", en: "Pages" },
      employees: { ar: "الموظفون", en: "Employees" },
      departments: { ar: "الأقسام", en: "Departments" },
      branches: { ar: "الفروع", en: "Branches" },
      jobTitles: { ar: "المسميات الوظيفية", en: "Job Titles" },
    };
    return labels[type]?.[lang] || type;
  };

  const getItemLabel = (item: any, type: string) => {
    if (type === "pages") return lang === "ar" ? item.label_ar : item.label_en;
    if (type === "employees") return item.full_name || item.name || "";
    return lang === "ar"
      ? (item.name || item.name_ar || item.title || item.title_ar || "")
      : (item.name_en || item.title_en || item.name || item.title || "");
  };

  const totalResults = searchResults.reduce((sum: number, s: any) => sum + (s.items?.length || 0), 0);

  const formatTime = (timestamp: string) => {
    if (!timestamp) return "";
    try {
      const d = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMin < 1) return lang === "ar" ? "الآن" : "Now";
      if (diffMin < 60) return lang === "ar" ? `منذ ${diffMin} دقيقة` : `${diffMin}m ago`;
      if (diffHours < 24) return lang === "ar" ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
      if (diffDays < 7) return lang === "ar" ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
      return d.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US");
    } catch {
      return "";
    }
  };

  const roleLabels = {
    ar: {
      super_admin: "مدير النظام",
      company_admin: "صاحب الشركة",
      hr_manager: "مدير الموارد البشرية",
      manager: "مدير",
      employee: "موظف",
      "مدير النظام": "مدير النظام",
      "صاحب الشركة": "صاحب الشركة",
      "مدير الموارد البشرية": "مدير الموارد البشرية",
      "مدير": "مدير",
      "موظف": "موظف",
    },
    en: {
      super_admin: "Super Admin",
      company_admin: "Company Admin",
      hr_manager: "HR Manager",
      manager: "Manager",
      employee: "Employee",
      "مدير النظام": "Super Admin",
      "صاحب الشركة": "Company Admin",
      "مدير الموارد البشرية": "HR Manager",
      "مدير": "Manager",
      "موظف": "Employee",
    },
  } as const;

  const displayRole =
    roleLabels[lang][(user?.role as keyof typeof roleLabels.ar) ?? "employee"] ||
    user?.role ||
    "";

  return (
    <header className="h-16 bg-background border-b border-border flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Search - G1 Fix */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            placeholder={d.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
            className="w-full h-9 pr-10 pl-4 rounded-md bg-muted/50 border border-input text-sm outline-none focus:ring-2 focus:ring-brand-primary/30"
          />

          {searchOpen && (searchLoading || totalResults > 0 || searchQuery.trim().length >= 2) && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-background border border-border rounded-lg shadow-xl z-50 max-h-[500px] overflow-y-auto">
              {searchLoading && totalResults === 0 ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground ml-2">
                    {lang === "ar" ? "جاري البحث..." : "Searching..."}
                  </span>
                </div>
              ) : totalResults === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {lang === "ar" ? "لا توجد نتائج" : "No results found"}
                </div>
              ) : (
                <>
                  {searchResults.map((section: any) => {
                    if (!section.items || section.items.length === 0) return null;
                    return (
                      <div key={section.type}>
                        <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase bg-muted/30 sticky top-0">
                          {getSectionLabel(section.type)}
                        </div>
                        {section.items.map((item: any, idx: number) => (
                          <button
                            key={`${section.type}-${item.id || idx}`}
                            onMouseDown={() => handleSelectResult(item, section.type)}
                            className="w-full text-start px-3 py-2 hover:bg-muted/50 transition flex items-center gap-3 border-b last:border-0"
                          >
                            {section.type === "employees" ? (
                              <Avatar className="w-7 h-7">
                                <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-xs font-semibold">
                                  {item.full_name?.[0] || "?"}
                                </AvatarFallback>
                              </Avatar>
                            ) : section.type === "pages" ? (
                              <div className="w-7 h-7 rounded bg-brand-primary/10 flex items-center justify-center text-brand-primary text-xs">→</div>
                            ) : (
                              <div className="w-7 h-7 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">
                                {section.type === "departments" ? "🏢" : section.type === "branches" ? "📍" : "💼"}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{getItemLabel(item, section.type)}</p>
                              {section.type === "employees" && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {item.employee_code} {item.job_title ? `• ${item.job_title}` : ""}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                  <button
                    onMouseDown={() => {
                      setSearchOpen(false);
                      router.push(`/hr/employees?search=${encodeURIComponent(searchQuery.trim())}`);
                    }}
                    className="w-full text-center py-2 text-xs text-brand-primary hover:bg-muted/30 font-medium border-t"
                  >
                    {lang === "ar" ? "عرض كل النتائج ←" : "See all results →"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Language Switcher */}
        <button
          onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          className="h-9 px-3 rounded-md border border-input bg-muted/50 text-sm font-medium hover:bg-muted transition"
          title={lang === "ar" ? "Switch to English" : "التبديل للعربية"}
        >
          {lang === "ar" ? "EN" : "ع"}
        </button>

        {/* Notifications - G2 + NOTIF-1 + NOTIF-2 Fix */}
        <DropdownMenu open={notifsOpen} onOpenChange={setNotifsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 left-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96 max-h-[500px] overflow-hidden flex flex-col">
            <div className="p-3 border-b flex items-center justify-between">
              <span className="font-semibold text-sm">
                {lang === "ar" ? "الإشعارات" : "Notifications"}
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-brand-primary hover:underline"
                >
                  {lang === "ar" ? "تعليم الكل كمقروء" : "Mark all read"}
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {loadingNotifs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                  <Bell className="w-10 h-10 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {lang === "ar" ? "لا توجد إشعارات" : "No notifications"}
                  </p>
                </div>
              ) : (
                notifications.slice(0, 20).map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`w-full text-start p-3 border-b hover:bg-muted/50 transition ${
                      !notif.is_read ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!notif.is_read && (
                        <span className="w-2 h-2 bg-brand-primary rounded-full mt-1.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notif.is_read ? "font-semibold" : "font-medium"}`}>
                          {getNotifTitle(notif)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {getNotifMessage(notif)}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatTime(notif.created_at)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-2 border-t">
                <button
                  onClick={() => {
                    setNotifsOpen(false);
                    router.push("/hr/announcements");
                  }}
                  className="w-full text-center text-xs text-brand-primary hover:underline py-1"
                >
                  {lang === "ar" ? "عرض كل الإشعارات" : "View all notifications"}
                </button>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-3 rounded-lg hover:bg-muted p-1.5 pl-3 transition outline-none">
            <div className="text-right">
              <div className="text-sm font-medium">{user?.full_name}</div>
              <div className="text-xs text-muted-foreground">
                {jobInfo?.job_title
                  ? (jobInfo.department ? `${jobInfo.job_title} — ${jobInfo.department}` : jobInfo.job_title)
                  : company?.name}
              </div>
            </div>
            <Avatar className="w-9 h-9 border-2 border-brand-primary/20">
              <AvatarFallback className="bg-brand-primary text-white font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold">{user?.full_name}</span>
                {jobInfo?.job_title && (
                  <span className="text-xs font-medium text-brand-primary">
                    {jobInfo.job_title}
                    {jobInfo.department && ` — ${jobInfo.department}`}
                  </span>
                )}
                <span className="text-[10px] font-normal text-muted-foreground">{displayRole}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="w-4 h-4 ml-2" />
              {d.profile}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="w-4 h-4 ml-2" />
              {d.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
