"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Wallet, Loader2, TrendingUp, TrendingDown, Calendar,
  DollarSign, FileText, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface PayslipData {
  employee_name?: string;
  employee_code?: string;
  year?: number;
  month?: number;
  basic_salary?: number;
  allowances_total?: number;
  bonuses_total?: number;
  overtime_bonus?: number;
  gross_salary?: number;
  late_deduction?: number;
  absence_deduction?: number;
  insurance_deduction?: number;
  // ═══ نظام التأمينات الجديد ═══
  social_insurance_employee?: number;
  social_insurance_company?: number;
  medical_insurance_employee?: number;
  medical_insurance_company?: number;
  total_company_insurance_contribution?: number;
  tax_deduction?: number;
  installments_total?: number;
  penalties_total?: number;
  total_deductions?: number;
  net_salary?: number;
  currency?: string;
  total_working_days?: number;
  present_days?: number;
  absent_days?: number;
  late_days?: number;
}

export default function MyPayslipPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<PayslipData | null>(null);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`/api/employee/my-payslip?year=${year}&month=${month}`, { headers: { Authorization: authHeader } })
      .then(r => r.json())
      .then(setData)
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, [year, month]);

  const monthNames = [d.January, d.February, d.March, d.April, d.May, d.June, d.July, d.August, d.September, d.October, d.November, d.December];
  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const formatMoney = (val?: number) => {
    if (!val) return "0";
    return new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-US").format(val);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.myPayslip}</h1>
          <p className="text-muted-foreground mt-1">
            {lang === "ar" ? "كشف مرتبك الشهري" : "Your monthly payslip"}
          </p>
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
      ) : !data ? (
        <Card>
          <CardContent className="py-24 text-center">
            <Wallet className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <p className="font-medium">{lang === "ar" ? "لا يوجد بيانات" : "No data"}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Net Salary Highlight */}
          <Card className="border-0 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                    <Wallet className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {lang === "ar" ? "صافي المرتب" : "Net Salary"}
                    </p>
                    <p className="text-4xl font-bold text-emerald-700">
                      {formatMoney(data.net_salary)}
                      <span className="text-lg mr-2 text-emerald-600">{data.currency || "EGP"}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {monthNames[(data.month || 1) - 1]} {data.year}
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  {lang === "ar" ? "تحميل PDF" : "Download PDF"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Earnings */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-emerald-600">
                <TrendingUp className="w-5 h-5" />
                {lang === "ar" ? "الإيرادات" : "Earnings"}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm">{d.basicSalary}</span>
                  <span className="font-mono font-semibold">{formatMoney(data.basic_salary)} {data.currency}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm">{d.allowancesCol}</span>
                  <span className="font-mono font-semibold text-emerald-600">+{formatMoney(data.allowances_total)} {data.currency}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm">{d.bonusesCol}</span>
                  <span className="font-mono font-semibold text-emerald-600">+{formatMoney(data.bonuses_total)} {data.currency}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm">{d.overtimeCol}</span>
                  <span className="font-mono font-semibold text-emerald-600">+{formatMoney(data.overtime_bonus)} {data.currency}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <span className="font-semibold">{d.grossSalary}</span>
                  <span className="font-mono font-bold text-emerald-700">{formatMoney(data.gross_salary)} {data.currency}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deductions */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-600">
                <TrendingDown className="w-5 h-5" />
                {d.deductionsBreakdown}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm">{d.lateDeduction}</span>
                  <span className="font-mono text-red-600">-{formatMoney(data.late_deduction)} {data.currency}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm">{d.absenceDeduction}</span>
                  <span className="font-mono text-red-600">-{formatMoney(data.absence_deduction)} {data.currency}</span>
                </div>
                {/* ═══ التأمينات (نظام جديد) ═══ */}
                {(data.social_insurance_employee || data.medical_insurance_employee) ? (
                  <>
                    {data.social_insurance_employee ? (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-200">
                        <span className="text-sm flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full bg-blue-600"></span>
                          {lang === "ar" ? "تأمين اجتماعي (حصة الموظف)" : "Social Insurance (Employee Share)"}
                        </span>
                        <span className="font-mono text-red-600">-{formatMoney(data.social_insurance_employee)} {data.currency}</span>
                      </div>
                    ) : null}
                    {data.medical_insurance_employee ? (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-200">
                        <span className="text-sm flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-600"></span>
                          {lang === "ar" ? "تأمين طبي (حصة الموظف)" : "Medical Insurance (Employee Share)"}
                        </span>
                        <span className="font-mono text-red-600">-{formatMoney(data.medical_insurance_employee)} {data.currency}</span>
                      </div>
                    ) : null}
                  </>
                ) : (data.insurance_deduction ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm">{d.insuranceDeduction}</span>
                    <span className="font-mono text-red-600">-{formatMoney(data.insurance_deduction)} {data.currency}</span>
                  </div>
                ) : null)}
                {data.tax_deduction ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-100">
                    <span className="text-sm text-orange-700">{ar ? "ضريبة الدخل" : "Income Tax"}</span>
                    <span className="font-mono text-orange-600">-{formatMoney(data.tax_deduction)} {data.currency}</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm">{d.installments}</span>
                  <span className="font-mono text-red-600">-{formatMoney(data.installments_total)} {data.currency}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm">{d.penalties}</span>
                  <span className="font-mono text-red-600">-{formatMoney(data.penalties_total)} {data.currency}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <span className="font-semibold">{d.grandTotalDeductions}</span>
                  <span className="font-mono font-bold text-red-700">-{formatMoney(data.total_deductions)} {data.currency}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ═══ مساهمة الشركة في التأمينات (للعلم فقط) ═══ */}
          {(data.social_insurance_company || data.medical_insurance_company) ? (
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-emerald-50">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-blue-700">
                  <span>🏢</span>
                  {lang === "ar" ? "مساهمة الشركة في التأمينات (للعلم فقط)" : "Company Insurance Contribution (Info Only)"}
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  {lang === "ar"
                    ? "هذه المبالغ لا تُخصم من راتبك - تدفعها الشركة بالكامل عنك"
                    : "These amounts are NOT deducted from your salary - fully paid by the company"}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {data.social_insurance_company ? (
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-200 text-center">
                      <p className="text-xs text-muted-foreground mb-1">
                        {lang === "ar" ? "تأمين اجتماعي" : "Social Insurance"}
                      </p>
                      <p className="text-xl font-bold text-blue-700 font-mono">
                        {formatMoney(data.social_insurance_company)} {data.currency}
                      </p>
                    </div>
                  ) : null}
                  {data.medical_insurance_company ? (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-200 text-center">
                      <p className="text-xs text-muted-foreground mb-1">
                        {lang === "ar" ? "تأمين طبي" : "Medical Insurance"}
                      </p>
                      <p className="text-xl font-bold text-emerald-700 font-mono">
                        {formatMoney(data.medical_insurance_company)} {data.currency}
                      </p>
                    </div>
                  ) : null}
                  {data.total_company_insurance_contribution ? (
                    <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-200 text-center">
                      <p className="text-xs text-muted-foreground mb-1">
                        {lang === "ar" ? "الإجمالي" : "Total"}
                      </p>
                      <p className="text-xl font-bold text-purple-700 font-mono">
                        {formatMoney(data.total_company_insurance_contribution)} {data.currency}
                      </p>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Attendance Summary */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">{d.attendanceSummary}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-blue-500/10 text-center">
                  <p className="text-xs text-muted-foreground">{d.workingDays}</p>
                  <p className="text-2xl font-bold text-blue-700">{data.total_working_days || 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/10 text-center">
                  <p className="text-xs text-muted-foreground">{d.presentDays}</p>
                  <p className="text-2xl font-bold text-emerald-700">{data.present_days || 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-red-500/10 text-center">
                  <p className="text-xs text-muted-foreground">{d.absentDays}</p>
                  <p className="text-2xl font-bold text-red-700">{data.absent_days || 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-500/10 text-center">
                  <p className="text-xs text-muted-foreground">{d.statusLate}</p>
                  <p className="text-2xl font-bold text-amber-700">{data.late_days || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
