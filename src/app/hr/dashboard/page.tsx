"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Users, UserCheck, Clock, UserX, Plane,
  TrendingUp, Award, AlertTriangle, FileText,
  Calendar, DollarSign, Bell
} from "lucide-react";

interface DashboardData {
  pulse?: {
    total_employees: number;
    present: number;
    late: number;
    absent: number;
    on_leave: number;
    attendance_rate: number;
  };
  decisions?: {
    pending_requests: number;
    pending_leaves: number;
    contracts_expiry: number;
    probation_ending: number;
  };
  top_performers?: Array<{
    employee_name: string;
    attendance_rate: number;
    on_time_percentage: number;
  }>;
  need_attention?: Array<{
    employee_name: string;
    issue: string;
    days: number;
  }>;
}

export default function HRDashboard() {
  const [data, setData] = useState<DashboardData>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    const authH = token.startsWith("Token") ? token : `Token ${token}`;

    fetch("/api/dashboard", { 
      headers: { Authorization: authH }, 
      cache: "no-store" 
    })
      .then((r) => r.json())
      .then((d) => { 
        setData(d); 
        setLoading(false); 
      })
      .catch(() => setLoading(false));
  }, []);

  const navigateTo = (path: string) => {
    router.push(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">جاري تحميل لوحة المعلومات...</p>
          </div>
        </div>
      </div>
    );
  }

  const pulse = data.pulse || { total_employees: 0, present: 0, late: 0, absent: 0, on_leave: 0, attendance_rate: 0 };
  const decisions = data.decisions || { pending_requests: 0, pending_leaves: 0, contracts_expiry: 0, probation_ending: 0 };
  const topPerformers = data.top_performers || [];
  const needAttention = data.need_attention || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" dir="rtl">
      <div className="max-w-7xl mx-auto p-6">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            لوحة المعلومات التنفيذية
          </h1>
          <p className="text-slate-600">
            نظرة شاملة على أداء الموارد البشرية
          </p>
        </div>

        <div className="mb-8">
          <Card 
            className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => navigateTo('/hr/requests')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-100 rounded-full">
                    <Bell className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-amber-800">الطلبات المعلقة</h3>
                    <p className="text-amber-600">تحتاج لمراجعتك</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-amber-600">
                    {(decisions.pending_requests || 0) + (decisions.pending_leaves || 0)}
                  </div>
                  <p className="text-sm text-amber-600">
                    {decisions.pending_requests || 0} طلبات • {decisions.pending_leaves || 0} إجازات
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            نبض الشركة النهاردة
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            
            <Card 
              className="cursor-pointer hover:shadow-md transition-all"
              onClick={() => navigateTo('/hr/employees')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">إجمالي الموظفين</p>
                    <p className="text-2xl font-bold text-slate-800">{pulse.total_employees || 0}</p>
                  </div>
                  <Users className="w-8 h-8 text-slate-400" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-all"
              onClick={() => navigateTo('/hr/attendance')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">حاضر</p>
                    <p className="text-2xl font-bold text-green-700">{pulse.present || 0}</p>
                  </div>
                  <UserCheck className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-all"
              onClick={() => navigateTo('/hr/reports/late')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600">متأخر</p>
                    <p className="text-2xl font-bold text-orange-700">{pulse.late || 0}</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-all"
              onClick={() => navigateTo('/hr/reports/absence')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600">غايب</p>
                    <p className="text-2xl font-bold text-red-700">{pulse.absent || 0}</p>
                  </div>
                  <UserX className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-all"
              onClick={() => navigateTo('/hr/leaves')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">في إجازة</p>
                    <p className="text-2xl font-bold text-blue-700">{pulse.on_leave || 0}</p>
                  </div>
                  <Plane className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-emerald-700">
                <Award className="w-5 h-5" />
                🏆 أفضل 5 موظفين من حيث التزام الحضور والانصراف
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topPerformers.length > 0 ? (
                topPerformers.slice(0, 5).map((emp: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-emerald-100 text-emerald-700">#{idx + 1}</Badge>
                      <span className="font-medium">{emp.employee_name}</span>
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-emerald-600 font-semibold">{emp.attendance_rate || 100}%</div>
                      <div className="text-gray-500">التزام: {emp.on_time_percentage || 100}%</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <Award className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>لا توجد بيانات أداء متاحة</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-red-700">
                <AlertTriangle className="w-5 h-5" />
                🔴 محتاجين متابعة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {needAttention.length > 0 ? (
                needAttention.slice(0, 5).map((emp: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                    <div>
                      <div className="font-medium">{emp.employee_name}</div>
                      <div className="text-sm text-red-600">{emp.issue}</div>
                    </div>
                    <Badge variant="destructive">{emp.days} أيام</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>لا توجد حالات تحتاج متابعة</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button 
            variant="outline" 
            className="p-6 h-auto flex flex-col gap-2"
            onClick={() => navigateTo('/hr/employees')}
          >
            <Users className="w-6 h-6" />
            <span>إدارة الموظفين</span>
          </Button>
          <Button 
            variant="outline" 
            className="p-6 h-auto flex flex-col gap-2"
            onClick={() => navigateTo('/hr/payroll')}
          >
            <DollarSign className="w-6 h-6" />
            <span>الرواتب</span>
          </Button>
          <Button 
            variant="outline" 
            className="p-6 h-auto flex flex-col gap-2"
            onClick={() => navigateTo('/hr/reports')}
          >
            <FileText className="w-6 h-6" />
            <span>التقارير</span>
          </Button>
          <Button 
            variant="outline" 
            className="p-6 h-auto flex flex-col gap-2"
            onClick={() => navigateTo('/hr/shifts')}
          >
            <Calendar className="w-6 h-6" />
            <span>إدارة الشيفتات</span>
          </Button>
        </div>

      </div>
    </div>
  );
}
