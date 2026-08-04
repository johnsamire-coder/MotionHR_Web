"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Calendar, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Recall {
  id: number;
  employee_name?: string;
  recall_date?: string;
  reason?: string;
  status?: string;
}

export default function LeaveRecallPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const [recalls, setRecalls] = useState<Recall[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEYS.token) : null;
    if (!token) return;
    const authHeader = token.startsWith("Token") ? token : `Token ${token}`;

    fetch("/api/hr/leave-recalls", { headers: { Authorization: authHeader } })
      .then(r => r.json())
      .then(data => setRecalls(data?.recalls || []))
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.leaveRecallTitle}</h1>
          <p className="text-muted-foreground mt-1">{d.leaveRecallDesc}</p>
        </div>
        <Button className="bg-brand-primary hover:bg-brand-primary/90 gap-2">
          <Plus className="w-4 h-4" />
          {d.recallEmployee}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : recalls.length === 0 ? (
        <Card>
          <CardContent className="py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 mx-auto">
              <Calendar className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="font-medium">{d.noRecalls}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {recalls.map(r => (
            <Card key={r.id}>
              <CardContent className="p-5">
                <p className="font-semibold">{r.employee_name}</p>
                {r.reason && <p className="text-sm text-muted-foreground mt-1">{r.reason}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
