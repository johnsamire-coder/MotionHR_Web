"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  UserMinus, Loader2, RotateCcw, Calendar, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface OffboardedEmployee {
  id: number;
  full_name: string;
  employee_code: string;
  termination_date?: string;
  termination_reason?: string;
  department?: string;
}

export default function TerminationPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const [employees, setEmployees] = useState<OffboardedEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEYS.token) : null;
    if (!token) return;
    const authHeader = token.startsWith("Token") ? token : `Token ${token}`;

    fetch("/api/hr/offboarding-list", { headers: { Authorization: authHeader } })
      .then(r => r.json())
      .then(data => setEmployees(data?.employees || []))
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{d.terminationTitle}</h1>
        <p className="text-muted-foreground mt-1">{d.terminationDesc}</p>
      </div>

      <Card className="border-0 bg-gradient-to-br from-red-500/10 to-red-500/5">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
              <UserMinus className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{d.offboardedEmployees}</p>
              <p className="text-2xl font-bold text-red-700">{employees.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : employees.length === 0 ? (
        <Card>
          <CardContent className="py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 mx-auto">
              <UserMinus className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="font-medium">{d.noOffboarded}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {employees.map(emp => (
            <Card key={emp.id}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-red-500/10 text-red-700">
                        {emp.full_name?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{emp.full_name}</p>
                      <p className="text-xs text-muted-foreground">{emp.employee_code}</p>
                      {emp.termination_reason && (
                        <p className="text-sm text-muted-foreground mt-1">{emp.termination_reason}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {emp.termination_date && (
                      <Badge className="bg-red-500/10 text-red-700 border-0 mb-2">
                        {emp.termination_date}
                      </Badge>
                    )}
                    <Button variant="outline" size="sm" className="gap-2">
                      <RotateCcw className="w-3 h-3" />
                      {d.reactivate}
                    </Button>
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
