"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ScrollText, Upload, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDict, useLangStore } from "@/lib/stores/language";

export default function CompanyPoliciesPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const [files] = useState<{ id: number; name: string; size: string }[]>([]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.companyPoliciesTitle}</h1>
          <p className="text-muted-foreground mt-1">{d.companyPoliciesDesc}</p>
        </div>
        <Button className="bg-brand-primary hover:bg-brand-primary/90 gap-2">
          <Upload className="w-4 h-4" />
          {d.uploadPolicyFile}
        </Button>
      </div>

      {files.length === 0 ? (
        <Card>
          <CardContent className="py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 mx-auto">
              <ScrollText className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="font-medium mb-2">
              {lang === "ar" ? "لا يوجد ملفات" : "No files"}
            </p>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              {lang === "ar" ? "ارفع لائحة الشركة أو النظام الداخلي" : "Upload company regulations or internal policies"}
            </p>
            <Button className="gap-2">
              <Upload className="w-4 h-4" />
              {d.uploadPolicyFile}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {files.map(f => (
            <Card key={f.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-brand-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{f.name}</p>
                      <p className="text-xs text-muted-foreground">{f.size}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    {lang === "ar" ? "تحميل" : "Download"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
