"use client";

import { Wallet, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useDict, useLangStore } from "@/lib/stores/language";

export default function MyPayslipPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{d.myPayslip}</h1>
        <p className="text-muted-foreground mt-1">
          {lang === "ar" ? "كشف مرتبك الشهري" : "Your monthly payslip"}
        </p>
      </div>

      <Card>
        <CardContent className="py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-brand-primary/10 flex items-center justify-center mb-4 mx-auto">
            <Wallet className="w-10 h-10 text-brand-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            {lang === "ar" ? "قريباً" : "Coming Soon"}
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {lang === "ar"
              ? "ستتمكن قريباً من عرض وتحميل كشف مرتبك الشهري بشكل احترافي"
              : "Soon you'll be able to view and download your monthly payslip professionally"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
