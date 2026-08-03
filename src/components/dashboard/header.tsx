"use client";

import { Bell, LogOut, User } from "lucide-react";
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
import { useAuthStore } from "@/lib/stores/auth";
import { useLangStore, useDict } from "@/lib/stores/language";

export function Header() {
  const router = useRouter();
  const { user, company, logout } = useAuthStore();
  const { lang, setLang } = useLangStore();
  const d = useDict();

  // Sync lang/dir on mount
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
      {/* Search */}
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
            className="w-full h-9 pr-10 pl-4 rounded-md bg-muted/50 border border-input text-sm outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">

        {/* Language Switcher */}
        <button
          onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          className="h-9 px-3 rounded-md border border-input bg-muted/50 text-sm font-medium hover:bg-muted transition"
          title={lang === "ar" ? "Switch to English" : "التبديل للعربية"}
        >
          {lang === "ar" ? "EN" : "ع"}
        </button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 left-2 w-2 h-2 bg-brand-highlight rounded-full" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-3 rounded-lg hover:bg-muted p-1.5 pl-3 transition outline-none">
            <div className="text-right">
              <div className="text-sm font-medium">{user?.full_name}</div>
              <div className="text-xs text-muted-foreground">{company?.name}</div>
            </div>
            <Avatar className="w-9 h-9 border-2 border-brand-primary/20">
              <AvatarFallback className="bg-brand-primary text-white font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-semibold">{user?.full_name}</span>
                <span className="text-xs font-normal text-muted-foreground">{displayRole}</span>
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
