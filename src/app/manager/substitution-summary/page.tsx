"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, CheckCircle2, XCircle, Calendar, FileText, Briefcase, Loader2, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";
import { toast } from "sonner";

export default function SubstitutionSummaryPage() {
  const lang = useLangStore(s => s.lang);
  const ar = lang === "ar";
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;

  useEffect(() => {
    fetch("/api/manager/substitution-summary", { headers: { Authorization: authH } })
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => toast.error(ar ? "فشل التحميل" : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const markViewed = async () => {
    await fetch("/api/manager/substitution-summary", {
      method: "POST",
      headers: { Authorization: authH },
    });
    setData((prev: any) => ({ ...prev, summary_viewed: true }));
    toast.success(ar ? "تم تعليم الملخص كمُراجَع" : "Marked as reviewed");
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!data?.has_summary) return (
    <div className="text-center py-24">
      <CheckCircle2 className="w-16 h-16 text-emerald-500/50 mx-auto mb-4" />
      <p className="text-muted-foreground">{ar ? "لا يوجد سجل غياب سابق" : "No previous absence record"}</p>
    </div>
  );

  const stats = data.stats || {};
  const period = data.absence_period || {};

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-muted">
          {ar ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{ar ? "ملخص فترة الغياب" : "Absence Period Summary"}</h1>
          <p className="text-sm text-muted-foreground">
            {period.start} → {period.end}
            {period.substitute_name && ` | ${ar ? "البديل" : "Substitute"}: ${period.substitute_name}`}
          </p>
        </div>
        {!data.summary_viewed && (
          <Button onClick={markViewed} size="sm" className="gap-2">
            <Eye className="w-4 h-4" />
            {ar ? "تعليم كمُراجَع" : "Mark Reviewed"}
          </Button>
        )}
        {data.summary_viewed && (
          <Badge className="bg-emerald-500/10 text-emerald-700 border-0">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {ar ? "تمت المراجعة" : "Reviewed"}
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: ar ? "إجمالي الطلبات" : "Total Requests", value: stats.total_requests || 0, color: "text-purple-600", bg: "bg-purple-500/10", icon: FileText },
          { label: ar ? "إجمالي الإجازات" : "Total Leaves", value: stats.total_leaves || 0, color: "text-emerald-600", bg: "bg-emerald-500/10", icon: Calendar },
          { label: ar ? "إجمالي المهام" : "Total Missions", value: stats.total_missions || 0, color: "text-blue-600", bg: "bg-blue-500/10", icon: Briefcase },
          { label: ar ? "موافقات" : "Approved", value: (stats.approved_requests || 0) + (stats.approved_leaves || 0), color: "text-green-600", bg: "bg-green-500/10", icon: CheckCircle2 },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Requests */}
      {data.requests?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />{ar ? "الطلبات" : "Requests"}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-start">{ar ? "الموظف" : "Employee"}</th>
                  <th className="px-4 py-3 text-start">{ar ? "النوع" : "Type"}</th>
                  <th className="px-4 py-3 text-start">{ar ? "الموضوع" : "Subject"}</th>
                  <th className="px-4 py-3 text-start">{ar ? "الحالة" : "Status"}</th>
                  <th className="px-4 py-3 text-start">{ar ? "التاريخ" : "Date"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.requests.map((r: any) => (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">{r.employee_name}</td>
                    <td className="px-4 py-3">{r.type}</td>
                    <td className="px-4 py-3">{r.subject}</td>
                    <td className="px-4 py-3">
                      <Badge className={r.status === "approved" ? "bg-emerald-500/10 text-emerald-700 border-0" : "bg-red-500/10 text-red-700 border-0"}>
                        {r.status === "approved" ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                        {r.status === "approved" ? (ar ? "موافق" : "Approved") : (ar ? "مرفوض" : "Rejected")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{r.updated_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Leaves */}
      {data.leaves?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" />{ar ? "الإجازات" : "Leaves"}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-start">{ar ? "الموظف" : "Employee"}</th>
                  <th className="px-4 py-3 text-start">{ar ? "النوع" : "Type"}</th>
                  <th className="px-4 py-3 text-start">{ar ? "الفترة" : "Period"}</th>
                  <th className="px-4 py-3 text-start">{ar ? "الحالة" : "Status"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.leaves.map((l: any) => (
                  <tr key={l.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">{l.employee_name}</td>
                    <td className="px-4 py-3">{l.leave_type}</td>
                    <td className="px-4 py-3 font-mono text-xs">{l.start_date} → {l.end_date}</td>
                    <td className="px-4 py-3">
                      <Badge className={l.status === "approved" ? "bg-emerald-500/10 text-emerald-700 border-0" : "bg-red-500/10 text-red-700 border-0"}>
                        {l.status === "approved" ? (ar ? "موافق" : "Approved") : (ar ? "مرفوض" : "Rejected")}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Missions */}
      {data.missions?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5" />{ar ? "المهام" : "Missions"}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-start">{ar ? "المهمة" : "Mission"}</th>
                  <th className="px-4 py-3 text-start">{ar ? "الحالة" : "Status"}</th>
                  <th className="px-4 py-3 text-start">{ar ? "التاريخ" : "Date"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.missions.map((m: any) => (
                  <tr key={m.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">{m.title}</td>
                    <td className="px-4 py-3">{m.status}</td>
                    <td className="px-4 py-3 font-mono text-xs">{m.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
