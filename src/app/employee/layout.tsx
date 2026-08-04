"use client";

import { ReactNode } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { EmployeeSidebar } from "@/components/dashboard/employee-sidebar";
import { Header } from "@/components/dashboard/header";
import { ROLES } from "@/lib/constants/config";

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth([ROLES.employee, ROLES.manager]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <EmployeeSidebar />
      <div className="mr-64">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
