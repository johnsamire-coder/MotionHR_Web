"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users, UserCheck, UserX, Clock, Calendar, DollarSign, Wallet,
  Inbox, FileWarning, AlertTriangle, TrendingUp, TrendingDown,
  Award, Building2, MapPin, ArrowUpRight, ArrowDownRight,
  Sparkles, Activity, Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STORAGE_KEYS } from "@/lib/constants/config";
import { useLangStore } from "@/lib/stores/language";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";

interface DashboardData {
  today: string;
  pulse: {
    total_employees: number;
    present: number;
    late: number;
    absent: number;
    on_leave: number;
    attendance_rate: number;
  };
  financial: {
    monthly_salary: number;
    yearly_salary: number;
    active_loans_amount: number;
    active_loans_count: number;
    this_month_attendance: number;
    last_month_attendance: number;
    attendance_change: number;
  };
  decisions: {
    pending_requests: number;
    pending_leaves: number;
    contracts_expiring_30d: number;
    probation_ending_30d: number;
  };
  trend: {
    attendance_last_30_days: { date: string; present: number }[];
  };
  distribution: {
    by_department: { name: string; count: number }[];
    by_branch: { name: string; count: number; total_salary: number }[];
  };
  turnover: {
    hired_this_month: number;
    terminated_this_month: number;
  };
  top_performers: any[];
  need_attention: any[];
  alerts: any[];
}

export default function DashboardPage() {
  const router = useRouter();
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
    if (!token) return;
    const authH = token.startsWith("Token") ? token : `Token ${token}`;

    fetch("/api/dashboard", { headers: { Authorization: authH }, cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat(ar ? "ar-EG" : "en-US", { maximumFractionDigits: 0 }).format(val);

  const formatNumber = (val: number) =>
    new Intl.NumberFormat(ar ? "ar-EG" : "en-US").format(val);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-20 text-muted-foreground">{ar ? "فشل التحميل" : "Failed to load"}</div>;
  }

  const maxTrend = Math.max(...data.trend.attendance_last_30_days.map((d) => d.present), 1);

  return (
    <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
      <OnboardingWizard />

      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-brand-primary to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              {ar ? "لوحة التحكم الرئيسية" : "Main Dashboard"}
            </h1>
            <p className="text-white/80 text-sm">
              {ar ? `نبض شركتك في ${data.today}` : `Your company pulse on ${data.today}`}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur rounded-xl px-4 py-2">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold">
              {ar ? `معدل الحضور: ${data.pulse.attendance_rate}%` : `Attendance: ${data.pulse.attendance_rate}%`}
            </span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.alerts.map((alert, i) => {
            const colorMap: Record<string, string> = {
              warning: "border-amber-300 bg-amber-50 text-amber-800",
              info: "border-blue-300 bg-blue-50 text-blue-800",
              danger: "border-red-300 bg-red-50 text-red-800",
            };
            const IconComponent = alert.icon === "file-warning" ? FileWarning :
                                  alert.icon === "inbox" ? Inbox :
                                  alert.icon === "wallet" ? Wallet :
                                  alert.icon === "alert-triangle" ? AlertTriangle :
                                  alert.icon === "user-check" ? UserCheck : AlertTriangle;
            return (
              <button
                key={i}
                onClick={() => router.push(alert.action)}
                className={`p-4 rounded-xl border-2 ${colorMap[alert.type]} text-start hover:shadow-md transition flex items-center gap-3`}
              >
                <IconComponent className="w-6 h-6 flex-shrink-0" />
                <p className="font-medium text-sm">{alert.title}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Pulse - نبض الشركة */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Activity className="w-5 h-5 text-brand-primary" />
          {ar ? "نبض الشركة النهاردة" : "Today's Pulse"}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <PulseCard icon={Users} label={ar ? "إجمالي الموظفين" : "Total"} value={data.pulse.total_employees} color="text-slate-700" bg="bg-slate-100" />
          <PulseCard icon={UserCheck} label={ar ? "حاضر" : "Present"} value={data.pulse.present} color="text-emerald-700" bg="bg-emerald-100" />
          <PulseCard icon={Clock} label={ar ? "متأخر" : "Late"} value={data.pulse.late} color="text-amber-700" bg="bg-amber-100" />
          <PulseCard icon={UserX} label={ar ? "غايب" : "Absent"} value={data.pulse.absent} color="text-red-700" bg="bg-red-100" />
          <PulseCard icon={Calendar} label={ar ? "في إجازة" : "On Leave"} value={data.pulse.on_leave} color="text-blue-700" bg="bg-blue-100" />
        </div>
      </div>

      {/* Financial & Decisions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              {ar ? "الوضع المالي" : "Financial Overview"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FinancialRow
              label={ar ? "المرتبات الشهرية" : "Monthly Salaries"}
              value={formatMoney(data.financial.monthly_salary)}
              unit={ar ? "جنيه" : "EGP"}
              color="text-emerald-700"
            />
            <FinancialRow
              label={ar ? "المرتبات السنوية المتوقعة" : "Yearly Projected"}
              value={formatMoney(data.financial.yearly_salary)}
              unit={ar ? "جنيه" : "EGP"}
              color="text-blue-700"
            />
            <FinancialRow
              label={ar ? `سلف قائمة (${data.financial.active_loans_count})` : `Active Loans (${data.financial.active_loans_count})`}
              value={formatMoney(data.financial.active_loans_amount)}
              unit={ar ? "جنيه" : "EGP"}
              color="text-orange-700"
            />
            {data.financial.attendance_change !== 0 && (
              <div className="pt-3 border-t flex items-center gap-2 text-sm">
                {data.financial.attendance_change > 0 ? (
                  <><TrendingUp className="w-4 h-4 text-emerald-600" /><span className="text-emerald-700">{ar ? `+${data.financial.attendance_change} أيام حضور عن الشهر السابق` : `+${data.financial.attendance_change} attendance days vs last month`}</span></>
                ) : (
                  <><TrendingDown className="w-4 h-4 text-red-600" /><span className="text-red-700">{ar ? `${data.financial.attendance_change} أيام حضور عن الشهر السابق` : `${data.financial.attendance_change} attendance days vs last month`}</span></>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Decisions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Inbox className="w-5 h-5 text-blue-600" />
              {ar ? "قرارات مطلوبة منك" : "Decisions Required"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <DecisionRow
              label={ar ? "طلبات إدارية معلقة" : "Pending Requests"}
              value={data.decisions.pending_requests}
              onClick={() => router.push("/hr/requests")}
              color="bg-blue-50 hover:bg-blue-100 text-blue-800"
            />
            <DecisionRow
              label={ar ? "إجازات معلقة" : "Pending Leaves"}
              value={data.decisions.pending_leaves}
              onClick={() => router.push("/hr/leaves")}
              color="bg-purple-50 hover:bg-purple-100 text-purple-800"
            />
            <DecisionRow
              label={ar ? "عقود قربت تنتهي" : "Contracts Expiring"}
              value={data.decisions.contracts_expiring_30d}
              onClick={() => router.push("/hr/reports/contracts-expiry")}
              color="bg-rose-50 hover:bg-rose-100 text-rose-800"
            />
            <DecisionRow
              label={ar ? "فترة تجربة قربت تنتهي" : "Probation Ending"}
              value={data.decisions.probation_ending_30d}
              onClick={() => router.push("/hr/employees")}
              color="bg-teal-50 hover:bg-teal-100 text-teal-800"
            />
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart - Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-5 h-5 text-brand-primary" />
            {ar ? "معدل الحضور - آخر 30 يوم" : "Attendance Trend - 30 Days"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.trend.attendance_last_30_days.map(d => ({
              date: d.date.slice(5),
              present: d.present,
            }))}>
              <defs>
                <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "8px" }} />
              <Area type="monotone" dataKey="present" stroke="#06B6D4" strokeWidth={2} fillOpacity={1} fill="url(#colorPresent)" name={ar ? "الحاضرين" : "Present"} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="w-5 h-5 text-purple-600" />
              {ar ? "الموظفين حسب القسم" : "By Department"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.distribution.by_department.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{ar ? "لا توجد أقسام" : "No departments"}</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={data.distribution.by_department} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} label={(entry: any) => `${entry.name}: ${entry.count}`} labelLine={false}>
                    {data.distribution.by_department.map((_, index) => {
                      const colors = ["#8B5CF6", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#6366F1", "#14B8A6"];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Pie>
                  <Tooltip contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="w-5 h-5 text-indigo-600" />
              {ar ? "المرتبات حسب الفرع" : "Salaries by Branch"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.distribution.by_branch.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{ar ? "لا توجد فروع" : "No branches"}</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.distribution.by_branch}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "8px" }} formatter={(value: any) => [formatMoney(value), ar ? "المرتبات" : "Salaries"]} />
                  <Bar dataKey="total_salary" fill="#6366F1" radius={[8, 8, 0, 0]} name={ar ? "إجمالي المرتبات" : "Total Salary"} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Turnover */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-emerald-700">{ar ? "موظفين جدد الشهر" : "Hired This Month"}</p>
              <p className="text-2xl font-bold text-emerald-800">{data.turnover.hired_this_month}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center text-white">
              <ArrowDownRight className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-red-700">{ar ? "انتهاء خدمة الشهر" : "Left This Month"}</p>
              <p className="text-2xl font-bold text-red-800">{data.turnover.terminated_this_month}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top & Need Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-emerald-700">
              <Award className="w-5 h-5" />
              {ar ? "🏆 أفضل 5 موظفين" : "🏆 Top 5 Performers"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.top_performers.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-4">{ar ? "لا توجد بيانات" : "No data"}</p>
            ) : (
              data.top_performers.map((emp, i) => (
                <div key={emp.employee_id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50 transition">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {ar ? "حاضر:" : "Present:"} {emp.present_days} {ar ? "|متأخر:" : "|Late:"} {emp.late_days}
                    </p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 border-0">{emp.score}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-red-700">
              <AlertTriangle className="w-5 h-5" />
              {ar ? "🔴 محتاجين متابعة" : "🔴 Need Attention"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.need_attention.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-4">{ar ? "الحمد لله كله تمام ✨" : "All good! ✨"}</p>
            ) : (
              data.need_attention.map((emp) => (
                <div key={emp.employee_id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 transition">
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {ar ? "غياب:" : "Absent:"} {emp.absent_days} {ar ? "|تأخير:" : "|Late:"} {emp.late_days}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PulseCard({ icon: Icon, label, value, color, bg }: any) {
  return (
    <Card className="hover:shadow-md transition">
      <CardContent className="p-4">
        <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center mb-2`}>
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function FinancialRow({ label, value, unit, color }: any) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-bold text-lg ${color}`}>{value} <span className="text-xs font-normal">{unit}</span></span>
    </div>
  );
}

function DecisionRow({ label, value, onClick, color }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex justify-between items-center p-3 rounded-lg transition ${color}`}
    >
      <span className="font-medium text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <Badge className="bg-white/50 border-0 font-bold">{value}</Badge>
        <ArrowUpRight className="w-4 h-4" />
      </div>
    </button>
  );
}
