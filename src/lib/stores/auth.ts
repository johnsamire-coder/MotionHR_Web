/**
 * Authentication Store using Zustand with proper persistence
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User, Company, EmployeeMini } from "@/lib/types";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface AuthState {
  user: User | null;
  company: Company | null;
  employee: EmployeeMini | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (data: {
    user: User;
    company: Company;
    employee: EmployeeMini;
    token: string;
    refreshToken?: string;
  }) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      company: null,
      employee: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: ({ user, company, employee, token, refreshToken }) => {
        // Also save to localStorage manually for consistency
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEYS.token, token);
          if (refreshToken) {
            localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
          }
        }
        set({
          user,
          company,
          employee,
          token,
          refreshToken: refreshToken || null,
          isAuthenticated: true,
        });
      },

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem(STORAGE_KEYS.token);
          localStorage.removeItem(STORAGE_KEYS.refreshToken);
          localStorage.removeItem(STORAGE_KEYS.user);
          localStorage.removeItem(STORAGE_KEYS.company);
          localStorage.removeItem(STORAGE_KEYS.employee);
          localStorage.removeItem("motionhr-auth");
        }
        set({
          user: null,
          company: null,
          employee: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: "motionhr-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        company: state.company,
        employee: state.employee,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
