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

    // لازم يغيّر كلمة السر الأول قبل أي صفحة تانية
    if (user.must_change_password) {
      router.replace("/change-password");
    }
  }, [isHydrated, isAuthenticated, user, requiredRoles, router]);

  // الصفحة ماتظهرش خالص لحد غير مسموحله (قبل كده كانت بتظهر لحظة قبل ما تطرده)
  const roleAllowed = !requiredRoles || requiredRoles.length === 0 || (!!user && requiredRoles.includes(user.role));
  const passwordOk = !user?.must_change_password;
  return { user, isAuthenticated: isHydrated && isAuthenticated && roleAllowed && passwordOk, logout };
}

export function useIsHR() {
  const { user } = useAuthStore();
  return (
    user?.role === ROLES.hrManager || user?.role === ROLES.companyAdmin
  );
}
