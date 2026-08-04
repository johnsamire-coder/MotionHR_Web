"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ShieldCheck, Loader2, Clock, TrendingUp, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Balance {
  total_hours?: number;
  used_hours?: number;
  remaining_hours?: number;
  total_count?: number;
  used_count?: number;
  remaining_count?: number;
  max_hours_per_month?: number;
  max_times_per_month?: number;
}

export default function MyPermissionsPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
    if (!token) return;
    const authHeader = token.startsWith("Token") ? token : `Token ${token}`;

    fetch("/api/employee/permission-balance", { headers: { Authorization: authHeader } })
      .then(r => r.json())
      .then(setBalance)
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, []);

  const totalHours = balance?.max_hours_per_month || balance?.total_hours || 4;
  const usedHours = balance?.used_hours || 0;
  const remainingHours = totalHours - usedHours;
  const usedPercent = totalHours > 0 ? (usedHours / totalHours) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{d.myPermissions}</h1>
        <p className="text-muted-foreground mt-1">
          {lang === "ar" ? "رصيد الأذونات الشهرية" : "Monthly permission balance"}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Main Balance */}
          <Card className="border-0 bg-gradient-to-br from-brand-primary/10 to-brand-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-primary/20 flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-brand-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{lang === "ar" ? "الرصيد المتاح" : "Available Balance"}</p>
                  <p className="text-4xl font-bold text-brand-primary">
                    {remainingHours.toFixed(1)} <span className="text-lg">{d.hoursUnit}</span>
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{lang === "ar" ? "المستخدم" : "Used"}: <span className="font-semibold text-foreground">{usedHours}</span></span>
                  <span className="text-muted-foreground">{lang === "ar" ? "الإجمالي" : "Total"}: <span className="font-semibold text-foreground">{totalHours}</span></span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div className="h-full bg-brand-primary transition-all" style={{ width: `${usedPercent}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{d.maxHoursPerMonth}</p>
                    <p className="text-2xl font-bold">{totalHours}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{lang === "ar" ? "المستخدم" : "Used"}</p>
                    <p className="text-2xl font-bold text-amber-600">{usedHours}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{lang === "ar" ? "المتبقي" : "Remaining"}</p>
                    <p className="text-2xl font-bold text-emerald-600">{remainingHours.toFixed(1)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
