"use client";

import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useDict } from "@/lib/stores/language";

export default function Page() {
  const d = useDict();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{d.requests}</h1>
        <p className="text-muted-foreground mt-1">{d.comingSoon}</p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-24">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
            <FileText className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{d.comingSoon}</h2>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            {d.requests}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
