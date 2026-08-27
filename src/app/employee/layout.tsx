"use client";

import { ReactNode } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { EmployeeSidebar } from "@/components/dashboard/employee-sidebar";
import { TrialBanner } from "@/components/dashboard/trial-banner";
import { Header } from "@/components/dashboard/header";
import { CharterGuard } from "@/components/dashboard/charter-guard";
import { ROLES } from "@/lib/constants/config";

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth([ROLES.employee, ROLES.manager]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <CharterGuard />
      <EmployeeSidebar />
      <div className="lg:mr-64">
        <TrialBanner />
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
