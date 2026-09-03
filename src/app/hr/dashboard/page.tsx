"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Users, UserCheck, Clock, UserX, Plane,
  TrendingUp, Award, AlertTriangle, FileText,
  Calendar, DollarSign, Bell, Briefcase, Building2
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";

const COLORS = ["#1A0A3E", "#06b6d4", "#f59e0b", "#10b981", "#ef4444", "#3b82f6"];

interface DashboardData {
  pulse?: { total_employees: number; present: number; late: number; absent: number; on_leave: number; attendance_rate: number; };
  decisions?: { pending_requests: number; pending_leaves: number; contracts_expiry: number; probation_ending: number; };
  financial?: { monthly_salary: number; yearly_salary: number; active_loans_amount: number; active_loans_count: number; };
  trend?: { attendance_last_30_days: Array<{ date: string; present: number }>; };
  distribution?: { by_department: Array<{ name: string; count: number }>; by_branch: Array<{ name: string; count: number; total_salary: number }>; };
  top_performers?: Array<{ name: string; present_days: number; late_days: number; score: number; }>;
  need_attention?: Array<{ name: string; absent_days: number; late_days: number; }>;
}

export default function HRDashboard() {
  const [data, setData] = useState<DashboardData>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("motionhr_token") || "";
    const authH = token.startsWith("Token") ? token : `Token ${token}`;
    if (!token) { setLoading(false); return; }

    fetch("/api/dashboard", { headers: { Authorization: authH }, cache: "no-store" })
      .then((r) => r.ok ? r.json() : Promise.reject("API Error"))
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const navigateTo = (path: string) => router.push(path);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const pulse = data.pulse || { total_employees: 0, present: 0, late: 0, absent: 0, on_leave: 0, attendance_rate: 0 };
  const decisions = data.decisions || { pending_requests: 0, pending_leaves: 0, contracts_expiry: 0, probation_ending: 0 };
  const financial = data.financial || { monthly_salary: 0, yearly_salary: 0, active_loans_amount: 0, active_loans_count: 0 };
  const trendData = data.trend?.attendance_last_30_days || [];
  const deptData = data.distribution?.by_department || [];
  const branchData = data.distribution?.by_branch || [];
  const topPerformers = data.top_performers || [];
  const needAttention = data.need_attention || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" dir="rtl">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">لوحة المعلومات التنفيذية</h1>
          <p className="text-slate-600">نظرة شاملة على أداء الموارد البشرية</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 cursor-pointer hover:shadow-lg transition-all" onClick={() => navigateTo('/hr/requests')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-100 rounded-full"><Bell className="w-6 h-6 text-amber-600" /></div>
                  <div>
                    <h3 className="text-lg font-semibold text-amber-800">الطلبات المعلقة</h3>
                    <p className="text-amber-600 text-sm">تحتاج لمراجعتك</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-amber-600">{decisions.pending_requests || 0}</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-sky-50 to-blue-50 border-sky-200 cursor-pointer hover:shadow-lg transition-all" onClick={() => navigateTo('/hr/leaves')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-sky-100 rounded-full"><Calendar className="w-6 h-6 text-sky-600" /></div>
                  <div>
                    <h3 className="text-lg font-semibold text-sky-800">الإجازات المعلقة</h3>
                    <p className="text-sky-600 text-sm">تحتاج لمراجعتك</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-sky-600">{decisions.pending_leaves || 0}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5" /> نبض الشركة النهاردة</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigateTo('/hr/employees')}>
              <CardContent className="p-4 flex items-center justify-between">
                <div><p className="text-sm text-slate-600">إجمالي الموظفين</p><p className="text-2xl font-bold text-slate-800">{pulse.total_employees || 0}</p></div>
                <Users className="w-8 h-8 text-slate-400" />
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigateTo('/hr/attendance')}>
              <CardContent className="p-4 flex items-center justify-between">
                <div><p className="text-sm text-green-600">حاضر</p><p className="text-2xl font-bold text-green-700">{pulse.present || 0}</p></div>
                <UserCheck className="w-8 h-8 text-green-500" />
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigateTo('/hr/reports/late')}>
              <CardContent className="p-4 flex items-center justify-between">
                <div><p className="text-sm text-orange-600">متأخر</p><p className="text-2xl font-bold text-orange-700">{pulse.late || 0}</p></div>
                <Clock className="w-8 h-8 text-orange-500" />
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigateTo('/hr/reports/absence')}>
              <CardContent className="p-4 flex items-center justify-between">
                <div><p className="text-sm text-red-600">غايب</p><p className="text-2xl font-bold text-red-700">{pulse.absent || 0}</p></div>
                <UserX className="w-8 h-8 text-red-500" />
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigateTo('/hr/leaves')}>
              <CardContent className="p-4 flex items-center justify-between">
                <div><p className="text-sm text-blue-600">في إجازة</p><p className="text-2xl font-bold text-blue-700">{pulse.on_leave || 0}</p></div>
                <Plane className="w-8 h-8 text-blue-500" />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <DollarSign className="w-10 h-10 text-emerald-500" />
              <div>
                <p className="text-sm text-slate-600">الرواتب الشهرية</p>
                <p className="text-xl font-bold text-slate-800">{financial.monthly_salary?.toLocaleString() || 0} ج.م</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <Briefcase className="w-10 h-10 text-blue-500" />
              <div>
                <p className="text-sm text-slate-600">السلف النشطة</p>
                <p className="text-xl font-bold text-slate-800">{financial.active_loans_count || 0} سلفة</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <TrendingUp className="w-10 h-10 text-purple-500" />
              <div>
                <p className="text-sm text-slate-600">معدل الحضور</p>
                <p className="text-xl font-bold text-slate-800">{pulse.attendance_rate || 0}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> اتجاه الحضور (آخر 30 يوم)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="present" stroke="#1A0A3E" strokeWidth={3} dot={{ r: 4 }} name="حاضر" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base text-slate-800 flex items-center gap-2">
                <Building2 className="w-5 h-5" /> التوزيع حسب الأقسام
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={deptData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#1A0A3E" label>
                    {deptData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base text-slate-800 flex items-center gap-2">
                <Briefcase className="w-5 h-5" /> التوزيع حسب الفروع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={branchData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#06b6d4" name="عدد الموظفين" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-emerald-700">
                <Award className="w-5 h-5" /> 🏆 أفضل 5 موظفين من حيث التزام الحضور والانصراف
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topPerformers.length > 0 ? topPerformers.slice(0, 5).map((emp: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-700">#{idx + 1}</Badge>
                    <span className="font-medium">{emp.name}</span>
                  </div>
                  <div className="text-left text-sm">
                    <div className="text-emerald-600 font-semibold">{emp.score || 0}%</div>
                    <div className="text-gray-500">حضور: {emp.present_days || 0} | تأخير: {emp.late_days || 0}</div>
                  </div>
                </div>
              )) : <div className="text-center text-gray-500 py-4">لا توجد بيانات أداء متاحة</div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-red-700">
                <AlertTriangle className="w-5 h-5" />  محتاجين متابعة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {needAttention.length > 0 ? needAttention.slice(0, 5).map((emp: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                  <div>
                    <div className="font-medium">{emp.name}</div>
                    <div className="text-sm text-red-600">غياب: {emp.absent_days || 0} أيام | تأخير: {emp.late_days || 0} أيام</div>
                  </div>
                  <Badge variant="destructive">متابعة</Badge>
                </div>
              )) : <div className="text-center text-gray-500 py-4">لا توجد حالات تحتاج متابعة</div>}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="p-6 h-auto flex flex-col gap-2" onClick={() => navigateTo('/hr/employees')}>
            <Users className="w-6 h-6" /><span>إدارة الموظفين</span>
          </Button>
          <Button variant="outline" className="p-6 h-auto flex flex-col gap-2" onClick={() => navigateTo('/hr/payroll')}>
            <DollarSign className="w-6 h-6" /><span>الرواتب</span>
          </Button>
          <Button variant="outline" className="p-6 h-auto flex flex-col gap-2" onClick={() => navigateTo('/hr/reports')}>
            <FileText className="w-6 h-6" /><span>التقارير</span>
          </Button>
          <Button variant="outline" className="p-6 h-auto flex flex-col gap-2" onClick={() => navigateTo('/hr/shifts')}>
            <Calendar className="w-6 h-6" /><span>إدارة الشيفتات</span>
          </Button>
        </div>

      </div>
    </div>
  );
}
