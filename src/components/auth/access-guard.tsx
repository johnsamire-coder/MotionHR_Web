"use client";

/**
 * لو السيرفر رد إن الحساب موقوف أو اشتراك الشركة متوقف:
 * نخرّج المستخدم ونوديه صفحة الدخول ونعرضله الرسالة.
 */

import { useEffect } from "react";
import { STORAGE_KEYS } from "@/lib/constants/config";

export const BLOCKED_MESSAGE_KEY = "motionhr_blocked_message";

const BLOCK_CODES = ["company_suspended", "account_disabled"];
const BLOCK_TEXTS = ["اشتراك الشركة متوقف", "حسابك موقوف"];

function isBlocked(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const message = String(d.message || d.detail || d.error || "");
  if (BLOCK_CODES.includes(String(d.code || "")) || BLOCK_TEXTS.some((t) => message.includes(t))) {
    return message || "اشتراك الشركة متوقف. برجاء التواصل مع إدارة الشركة.";
  }
  return null;
}

function signOut(message: string) {
  try {
    sessionStorage.setItem(BLOCKED_MESSAGE_KEY, message);
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    localStorage.removeItem(STORAGE_KEYS.user);
    localStorage.removeItem(STORAGE_KEYS.company);
    localStorage.removeItem(STORAGE_KEYS.employee);
    localStorage.removeItem("motionhr-auth");
  } catch {}
  if (!window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
}

export function AccessGuard() {
  useEffect(() => {
    const w = window as typeof window & { __motionhrAccessGuard?: boolean };
    if (w.__motionhrAccessGuard) return;
    w.__motionhrAccessGuard = true;

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const response = await originalFetch(...args);
      if ((response.status === 401 || response.status === 403) && !window.location.pathname.startsWith("/login")) {
        response
          .clone()
          .json()
          .then((data) => {
            const message = isBlocked(data);
            if (message) signOut(message);
          })
          .catch(() => {});
      }
      return response;
    };
  }, []);

  return null;
}
