"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Award, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface PolicyItem {
  id: number;
  name?: string;
  status?: string;
  created_at?: string;
}

export default function PoliciesPage() {
  const router = useRouter();
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const [items, setItems] = useState<PolicyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEYS.token) : null;
    if (!token) return;
    const authHeader = token.startsWith("Token") ? token : `Token ${token}`;

    fetch("/api/hr/policies-bonus", { headers: { Authorization: authHeader } })
      .then(r => r.json())
      .then(data => setItems(data?.results || data?.policies || []))
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/hr/policies")} className="gap-2">
            {lang === "ar" ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {lang === "ar" ? "العودة" : "Back"}
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{d.bonusPoliciesTitle}</h1>
            <p className="text-muted-foreground mt-1 text-sm">{d.bonusPoliciesDesc}</p>
          </div>
        </div>

        <Button className="bg-brand-primary hover:bg-brand-primary/90 gap-2">
          <Plus className="w-4 h-4" />
          {d.createPolicy}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 mx-auto">
              <Award className="w-8 h-8 text-amber-600" />
            </div>
            <p className="font-medium mb-4">{lang === "ar" ? "لا يوجد سياسات" : "No policies yet"}</p>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              {lang === "ar" ? "أنشئ سياسة جديدة لبدء إدارة الفريق" : "Create a new policy to manage your team"}
            </p>
            <Button className="gap-2 bg-brand-primary hover:bg-brand-primary/90">
              <Plus className="w-4 h-4" />
              {d.createPolicy}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(item => (
            <Card key={item.id}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Award className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{item.name || `#${item.id}`}</p>
                    {item.status && (
                      <Badge className="mt-1 text-xs">{item.status}</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
