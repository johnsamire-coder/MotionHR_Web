"use client";

import { ScrollText, Download, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDict, useLangStore } from "@/lib/stores/language";

export default function RegulationsPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{d.companyRegulations}</h1>
        <p className="text-muted-foreground mt-1">
          {lang === "ar" ? "لائحة الشركة والنظام الداخلي" : "Company regulations and internal policies"}
        </p>
      </div>

      <Card>
        <CardContent className="py-24 text-center">
          <ScrollText className="w-20 h-20 text-brand-primary/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {lang === "ar" ? "لا يوجد لائحة منشورة" : "No regulations published"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {lang === "ar" ? "يمكن للـ HR رفع لائحة الشركة وستظهر هنا للاطلاع" : "HR can upload regulations to appear here"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
