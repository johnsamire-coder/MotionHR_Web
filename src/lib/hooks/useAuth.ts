"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import { ROLES } from "@/lib/constants/config";

export function useAuth(requiredRoles?: string[]) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(user.role)) {
        router.push("/login");
      }
    }
  }, [isHydrated, isAuthenticated, user, requiredRoles, router]);

  return { user, isAuthenticated: isHydrated && isAuthenticated, logout };
}

export function useIsHR() {
  const { user } = useAuthStore();
  return (
    user?.role === ROLES.hrManager || user?.role === ROLES.companyAdmin
  );
}
