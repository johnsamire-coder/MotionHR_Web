"use client";

import { Clock, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useDict, useLangStore } from "@/lib/stores/language";

export default function FlexShiftPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{d.flexShiftTitle}</h1>
        <p className="text-muted-foreground mt-1">{d.flexShiftDesc}</p>
      </div>

      <Card className="border-0 bg-gradient-to-br from-brand-primary/5 to-brand-accent/5">
        <CardContent className="py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-brand-primary/10 flex items-center justify-center mb-4 mx-auto">
            <Clock className="w-10 h-10 text-brand-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {lang === "ar" ? "قريباً" : "Coming Soon"}
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            {lang === "ar"
              ? "ستتمكن قريباً من إدارة تسويات ساعات العمل للشيفت المرن وتحديد قواعد التعويض"
              : "You'll be able to manage flex shift working hours settlements and set compensation rules"}
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-amber-700 bg-amber-500/10 rounded-lg px-4 py-2 max-w-md mx-auto">
            <AlertCircle className="w-4 h-4" />
            <span>
              {lang === "ar" ? "قيد التطوير - قريباً جداً" : "In development - very soon"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
