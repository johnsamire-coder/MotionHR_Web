"use client";

// كشف المرتب للموظف وللمدير (نفس الشاشة): نفس البنود اللي في تطبيق الموبايل
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Wallet, Loader2, TrendingUp, TrendingDown, Calendar, Download, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";
import {
  buildPayslipBreakdown, hoursText, payslipNum,
  type PayslipData, type PayslipLine,
} from "@/lib/utils/payslip-breakdown";

export function PayslipView() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<PayslipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`/api/employee/my-payslip?year=${year}&month=${month}&lang=${lang}`, { headers: { Authorization: authHeader } })
      .then(r => r.json())
      .then(j => setData(j && !j.error ? j : null))
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, lang]);

  const b = useMemo(() => (data ? buildPayslipBreakdown(data, ar) : null), [data, ar]);

  const monthNames = [d.January, d.February, d.March, d.April, d.May, d.June, d.July, d.August, d.September, d.October, d.November, d.December];
  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const currency = (data?.currency as string) || "EGP";

  const money = (val?: number) =>
    new Intl.NumberFormat(ar ? "ar-EG" : "en-US", { maximumFractionDigits: 2 }).format(val || 0);

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/employee/my-payslip?year=${year}&month=${month}&lang=${lang}&export=pdf`, {
        headers: { Authorization: authHeader },
      });
      if (!res.ok || !(res.headers.get("content-type") || "").includes("pdf")) throw new Error();
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `payslip_${year}_${month}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(ar ? "فشل تحميل PDF" : "PDF download failed");
    } finally {
      setDownloading(false);
    }
  };

  const LineRow = ({ l, sign, tone }: { l: PayslipLine; sign: string; tone: string }) => (
    <div className="p-3 rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <span className="text-sm">{l.label}</span>
        <span className={`font-mono font-semibold ${tone}`}>{sign}{money(l.amount)} {currency}</span>
      </div>
      {l.items.length > 0 && (
        <div className="mt-2 space-y-1 ps-4">
          {l.items.map((it, i) => (
            <div key={i} className="flex items-center justify-between text-xs text-muted-foreground">
              <span>• {it.name}</span>
              <span className="font-mono">{money(it.amount)} {currency}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const otHours = payslipNum(data?.overtime_hours);
  const otCounted = data?.overtime_counted_hours;
  const otMultiplier = data?.overtime_multiplier;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.myPayslip}</h1>
          <p className="text-muted-foreground mt-1">{ar ? "كشف مرتبك الشهري" : "Your monthly payslip"}</p>
        </div>
        <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
          <Calendar className="w-4 h-4 text-muted-foreground mx-2" />
          <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
            <SelectTrigger className="border-0 bg-transparent w-[110px] focus:ring-0"><SelectValue /></SelectTrigger>
            <SelectContent>
              {months.map(m => <SelectItem key={m} value={String(m)}>{monthNames[m - 1]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
            <SelectTrigger className="border-0 bg-transparent w-[90px] focus:ring-0"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : !data || !b ? (
        <Card>
          <CardContent className="py-24 text-center">
            <Wallet className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <p className="font-medium">{ar ? "لا يوجد بيانات" : "No data"}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* صافي المرتب */}
          <Card className="border-0 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                    <Wallet className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{ar ? "صافي المرتب" : "Net Salary"}</p>
                    <p className="text-4xl font-bold text-emerald-700">
                      {money(b.net)}<span className="text-lg mx-2 text-emerald-600">{currency}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {monthNames[(payslipNum(data.month) || month) - 1]} {data.year || year}
                    </p>
                    {b.isFinal && (
                      <Badge className="mt-2 bg-emerald-600/10 text-emerald-700 border-0">
                        {ar ? "نهائي: من مسير الرواتب المعتمد" : "Final: from the approved payroll run"}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button variant="outline" className="gap-2" onClick={downloadPdf} disabled={downloading}>
                  {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {ar ? "تحميل PDF" : "Download PDF"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* الإيرادات */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-emerald-600">
                <TrendingUp className="w-5 h-5" />{ar ? "الإيرادات" : "Earnings"}
              </h3>
              <div className="space-y-3">
                {b.earnings.map(l => (
                  <LineRow key={l.key} l={l} sign={l.key === "basic_salary" ? "" : "+"}
                    tone={l.key === "basic_salary" ? "" : "text-emerald-600"} />
                ))}
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <span className="font-semibold">{ar ? "إجمالي المستحق" : "Gross Salary"}</span>
                  <span className="font-mono font-bold text-emerald-700">{money(b.gross)} {currency}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* الخصومات */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-600">
                <TrendingDown className="w-5 h-5" />{ar ? "الخصومات" : "Deductions"}
              </h3>
              <div className="space-y-3">
                {b.deductions.length === 0 && (
                  <p className="text-sm text-muted-foreground p-3">{ar ? "لا توجد خصومات" : "No deductions"}</p>
                )}
                {b.deductions.map(l => <LineRow key={l.key} l={l} sign="-" tone="text-red-600" />)}
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <span className="font-semibold">{ar ? "إجمالي الخصومات" : "Total Deductions"}</span>
                  <span className="font-mono font-bold text-red-700">-{money(b.totalDeductions)} {currency}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* مساهمة الشركة في التأمينات (للعلم فقط) */}
          {b.companyInsurance.length > 0 && (
            <Card className="border-blue-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2 text-blue-700">
                  {ar ? "مساهمة الشركة في التأمينات (للعلم فقط)" : "Company Insurance Contribution (Info Only)"}
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  {ar ? "المبالغ دي مش بتتخصم من مرتبك، الشركة بتدفعها عنك" : "These amounts are NOT deducted from your salary - paid by the company"}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {b.companyInsurance.map(l => (
                    <div key={l.key} className="p-3 rounded-lg bg-blue-500/10 border border-blue-200 text-center">
                      <p className="text-xs text-muted-foreground mb-1">{l.label}</p>
                      <p className="text-xl font-bold text-blue-700 font-mono">{money(l.amount)} {currency}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* السياسة المطبقة */}
          {data.policy_name && (
            <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-sm">
              <span className="text-emerald-700 text-xs">{ar ? "السياسة المطبقة" : "Applied Policy"}: </span>
              <span className="font-semibold">{String(data.policy_name)}</span>
            </div>
          )}

          {/* ملخص الحضور */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">{d.attendanceSummary}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: d.workingDays, v: data.total_working_days, c: "bg-blue-500/10 text-blue-700" },
                  { label: d.presentDays, v: data.present_days, c: "bg-emerald-500/10 text-emerald-700" },
                  { label: d.absentDays, v: data.absent_days, c: "bg-red-500/10 text-red-700" },
                  { label: d.statusLate, v: data.late_days, c: "bg-amber-500/10 text-amber-700" },
                  { label: ar ? "الأيام المحسوبة" : "Paid Days", v: data.attended_days, c: "bg-muted/50" },
                  ...(payslipNum(data.mission_days) > 0 ? [{ label: ar ? "أيام المأموريات" : "Mission Days", v: data.mission_days, c: "bg-muted/50" }] : []),
                  ...(payslipNum(data.on_leave_days) > 0 ? [{ label: ar ? "أيام الإجازات" : "Leave Days", v: data.on_leave_days, c: "bg-muted/50" }] : []),
                  ...(payslipNum(data.night_shift_days) > 0 ? [{ label: ar ? "أيام شيفتات ليلية" : "Night Shift Days", v: data.night_shift_days, c: "bg-muted/50" }] : []),
                  ...(payslipNum(data.weekend_work_days) > 0 ? [{ label: ar ? "أيام عمل في الراحة" : "Weekend Work Days", v: data.weekend_work_days, c: "bg-muted/50" }] : []),
                ].map((s, i) => (
                  <div key={i} className={`p-3 rounded-lg text-center ${s.c}`}>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold">{payslipNum(s.v)}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                <div className="p-3 rounded-lg bg-muted/30 flex justify-between">
                  <span>{ar ? "دقائق التأخير" : "Late Minutes"}</span>
                  <span className="font-mono">{payslipNum(data.total_late_minutes)} {ar ? "د" : "m"}</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 flex justify-between">
                  <span>{ar ? "ساعات العمل" : "Work Hours"}</span>
                  <span className="font-mono">{payslipNum(data.total_work_hours)} {ar ? "س" : "h"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ساعات الأوفر تايم: الفعلية، والمحسوبة (بعد أقل مدة في اليوم)، والمدفوعة (× المضاعف) */}
          {(otHours > 0 || payslipNum(otCounted) > 0) && (
            <Card>
              <CardContent className="p-6 space-y-2 text-sm">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><Clock className="w-5 h-5" />{ar ? "ساعات الأوفر تايم" : "Overtime Hours"}</h3>
                <div className="flex justify-between"><span>{ar ? "الساعات الفعلية" : "Actual"}</span><span className="font-mono">{hoursText(otHours, ar)}</span></div>
                {otCounted != null && (
                  <>
                    <div className="flex justify-between"><span>{ar ? "الساعات المحسوبة" : "Counted"}</span><span className="font-mono">{hoursText(otCounted, ar)}</span></div>
                    <div className="flex justify-between font-semibold">
                      <span>{ar ? "الساعات المدفوعة" : "Paid"}{otMultiplier != null ? ` (× ${otMultiplier})` : ""}</span>
                      <span className="font-mono">{hoursText(data.overtime_paid_hours, ar)}</span>
                    </div>
                    {otHours > 0 && payslipNum(otCounted) === 0 ? (
                      <p className="text-xs text-muted-foreground">{ar ? "الأوفر تايم مش بيتصرف ليك حسب سياسة الشركة" : "Overtime is not paid for you under the company policy"}</p>
                    ) : otHours > payslipNum(otCounted) ? (
                      <p className="text-xs text-muted-foreground">{ar ? "الأيام اللي فيها أوفر تايم أقل من الحد الأدنى مابتتحسبش" : "Days below the daily minimum are not counted"}</p>
                    ) : null}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
