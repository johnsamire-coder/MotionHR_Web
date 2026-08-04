"use client";

import { ReactNode } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { ManagerSidebar } from "@/components/dashboard/manager-sidebar";
import { Header } from "@/components/dashboard/header";
import { ROLES } from "@/lib/constants/config";

export default function ManagerLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth([ROLES.manager]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <ManagerSidebar />
      <div className="mr-64">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
