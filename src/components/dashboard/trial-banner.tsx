"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Sparkles, MessageCircle, AlertTriangle } from "lucide-react";
import { STORAGE_KEYS } from "@/lib/constants/config";
import { useLangStore } from "@/lib/stores/language";

const WHATSAPP_URL = "https://wa.me/201501551593?text=%D8%B9%D8%A7%D9%8A%D8%B2%20%D8%A3%D8%B4%D8%AA%D8%B1%D9%83%20%D9%81%D9%8A%20MotionHR";

interface SubStatus {
  success: boolean;
  has_subscription: boolean;
  is_trial: boolean;
  plan_name: string;
  status: string;
  days_remaining: number;
  current_employees: number;
  max_employees: number;
  employees_percentage: number;
}

export function TrialBanner() {
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";

  const [status, setStatus] = useState<SubStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user dismissed today
    const dismissedKey = "motionhr_trial_banner_dismissed";
    const dismissedDate = localStorage.getItem(dismissedKey);
    const today = new Date().toDateString();
    if (dismissedDate === today) {
      setDismissed(true);
      return;
    }

    // Fetch subscription status
    const token = localStorage.getItem(STORAGE_KEYS.token);
    if (!token) return;

    const authH = token.startsWith("Token") ? token : `Token ${token}`;

    fetch("/api/subscription/status", {
      headers: { Authorization: authH },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.has_subscription && data.is_trial) {
          setStatus(data);
        }
      })
      .catch(() => {});
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(
      "motionhr_trial_banner_dismissed",
      new Date().toDateString()
    );
  };

  if (!status || dismissed || !status.is_trial) return null;

  const isUrgent = status.days_remaining <= 3;
  const isWarning = status.days_remaining <= 7;

  const bgColor = isUrgent
    ? "bg-gradient-to-r from-red-500 to-red-600"
    : isWarning
    ? "bg-gradient-to-r from-amber-500 to-orange-500"
    : "bg-gradient-to-r from-brand-primary to-brand-secondary";

  return (
    <div className={`${bgColor} text-white shadow-md relative z-40`}>
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          {isUrgent ? (
            <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse" />
          ) : (
            <Sparkles className="w-5 h-5 shrink-0" />
          )}

          <div className="flex items-center gap-2 text-sm flex-wrap">
            <span className="font-bold">
              {ar ? "🎁 تجربة مجانية" : "🎁 Free Trial"}
            </span>
            <span className="opacity-90">·</span>
            <span className="font-semibold">
              {ar
                ? `باقي ${status.days_remaining} يوم`
                : `${status.days_remaining} days left`}
            </span>
            <span className="opacity-90 hidden md:inline">·</span>
            <span className="hidden md:inline opacity-90">
              {status.current_employees}/{status.max_employees}{" "}
              {ar ? "موظفين" : "employees"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={WHATSAPP_URL}
            target="_blank"
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur px-3 py-1.5 rounded-lg text-sm font-semibold transition"
          >
            <MessageCircle className="w-4 h-4" />
            {isUrgent
              ? ar
                ? "🔥 اشترك دلوقتي"
                : "🔥 Subscribe Now"
              : ar
              ? "ترقية"
              : "Upgrade"}
          </Link>

          <button
            onClick={handleDismiss}
            className="p-1.5 hover:bg-white/20 rounded-lg transition"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}