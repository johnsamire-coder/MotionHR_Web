"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  Building2,
  CreditCard,
  Edit,
  FileText,
  DollarSign,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

import { useAuthStore } from "@/lib/stores/auth";
import axios from "axios";

interface EmployeeProfile {
  id: number;
  employee_code: string;
  photo: string | null;
  full_name_ar: string;
  full_name_en: string;
  national_id: string;
  birth_date: string;
  gender: string;
  marital_status: string;
  religion: string;
  nationality: string;
  email: string;
  phone: string;
  phone2: string | null;
  address: string;
  city: string;
  hire_date: string;
  contract_type: string;
  contract_end_date: string | null;
  branch: string;
  department: string;
  job_title: string;
  direct_manager: { id: number; name: string } | null;
  basic_salary: number;
  bank_name: string | null;
  bank_account: string | null;
  iban: string | null;
  status: string;
  worker_type: string;
  worker_type_display: string;
}

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuthStore();
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"personal" | "job" | "salary" | "contract">("personal");

  useEffect(() => {
    if (!token || !params.id) return;
    loadEmployee();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, params.id]);

  const loadEmployee = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get<EmployeeProfile>(
        `/api/employees/${params.id}`,
        { headers: { Authorization: `Token ${token}` } }
      );
      setEmployee(response.data);
    } catch {
      toast.error("فشل تحميل بيانات الموظف");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <User className="w-16 h-16 text-muted-foreground opacity-40 mb-4" />
        <h2 className="text-xl font-semibold mb-2">الموظف غير موجود</h2>
        <Button onClick={() => router.push("/hr/employees")} variant="outline">
          العودة للقائمة
        </Button>
      </div>
    );
  }

  const initial = employee.full_name_ar?.[0] || "?";

  const tabs = [
    { key: "personal" as const, label: "بيانات شخصية", icon: User },
    { key: "job" as const, label: "الوظيفة", icon: Briefcase },
    { key: "salary" as const, label: "المرتب", icon: DollarSign },
    { key: "contract" as const, label: "العقد", icon: FileText },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back Button */}
      <div>
        <Button
          variant="ghost"
          onClick={() => router.push("/hr/employees")}
          className="gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للموظفين
        </Button>
      </div>

      {/* Header Card */}
      <Card className="overflow-hidden">
        <div className="h-32 gradient-brand" />
        <CardContent className="px-6 pb-6 pt-0">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 -mt-16">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <Avatar className="w-28 h-28 border-4 border-background shadow-lg">
                <AvatarFallback className="bg-brand-primary text-white text-4xl font-bold">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="md:pb-2">
                <h1 className="text-2xl font-bold text-white drop-shadow-lg">{employee.full_name_ar}</h1>
                <div className="text-sm text-foreground mt-1 font-medium">
                  {employee.job_title} • {employee.department}
                </div>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <code className="text-xs px-2 py-1 rounded bg-muted font-mono">
                    {employee.employee_code}
                  </code>
                  {employee.status && (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-0">
                      {employee.status}
                    </Badge>
                  )}
                  {employee.worker_type_display && (
                    <Badge variant="outline" className="border-brand-primary/30 text-brand-primary">
                      {employee.worker_type_display}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="md:pb-2">
              <Button variant="outline" className="gap-2">
                <Edit className="w-4 h-4" />
                تعديل
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all
                ${
                  isActive
                    ? "border-brand-primary text-brand-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <Card>
        <CardContent className="p-6">
          {activeTab === "personal" && (
            <div>
              <h3 className="text-lg font-semibold mb-6">البيانات الشخصية</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                <Field label="الاسم بالعربي" value={employee.full_name_ar} />
                <Field label="الاسم بالإنجليزي" value={employee.full_name_en} />
                <Field label="الرقم القومي" value={employee.national_id} dir="ltr" />
                <Field label="تاريخ الميلاد" value={employee.birth_date} icon={Calendar} />
                <Field label="النوع" value={employee.gender} />
                <Field label="الحالة الاجتماعية" value={employee.marital_status} />
                <Field label="الديانة" value={employee.religion} />
                <Field label="الجنسية" value={employee.nationality} />
              </div>

              <div className="mt-8 pt-6 border-t">
                <h4 className="font-semibold mb-4 text-brand-primary">التواصل</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                  <Field label="الموبايل" value={employee.phone} icon={Phone} dir="ltr" />
                  <Field label="موبايل إضافي" value={employee.phone2} icon={Phone} dir="ltr" />
                  <Field label="البريد الإلكتروني" value={employee.email} icon={Mail} dir="ltr" />
                  <Field label="المدينة" value={employee.city} icon={MapPin} />
                  <Field label="العنوان" value={employee.address} icon={MapPin} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "job" && (
            <div>
              <h3 className="text-lg font-semibold mb-6">بيانات الوظيفة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                <Field label="كود الموظف" value={employee.employee_code} />
                <Field label="تاريخ التعيين" value={employee.hire_date} icon={Calendar} />
                <Field label="القسم" value={employee.department} icon={Building2} />
                <Field label="الفرع" value={employee.branch} icon={Building2} />
                <Field label="المسمى الوظيفي" value={employee.job_title} icon={Briefcase} />
                <Field label="المدير المباشر" value={employee.direct_manager?.name} icon={Users} />
                <Field label="تصنيف الموظف" value={employee.worker_type_display} />
              </div>
            </div>
          )}

          {activeTab === "salary" && (
            <div>
              <h3 className="text-lg font-semibold mb-6">المرتب والبيانات المالية</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <Field
                  label="المرتب الأساسي"
                  value={employee.basic_salary ? `${Number(employee.basic_salary).toLocaleString()} جنيه` : null}
                  icon={DollarSign}
                />
                <Field label="اسم البنك" value={employee.bank_name} icon={CreditCard} />
                <Field label="رقم الحساب" value={employee.bank_account} dir="ltr" />
                <Field label="IBAN" value={employee.iban} dir="ltr" />
              </div>
            </div>
          )}

          {activeTab === "contract" && (
            <div>
              <h3 className="text-lg font-semibold mb-6">بيانات العقد</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <Field label="نوع العقد" value={employee.contract_type} icon={FileText} />
                <Field
                  label="نهاية العقد"
                  value={employee.contract_end_date || "غير محدد (دائم)"}
                  icon={Calendar}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  icon: Icon,
  dir,
}: {
  label: string;
  value?: string | null | number;
  icon?: React.ComponentType<{ className?: string }>;
  dir?: "ltr" | "rtl";
}) {
  const display = value !== null && value !== undefined && value !== "" ? String(value) : "—";
  return (
    <div className="min-w-0">
      <div className="text-xs text-muted-foreground mb-1.5">{label}</div>
      <div className="flex items-center gap-2 text-sm font-medium">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
        <span dir={dir} className="truncate">{display}</span>
      </div>
    </div>
  );
}



