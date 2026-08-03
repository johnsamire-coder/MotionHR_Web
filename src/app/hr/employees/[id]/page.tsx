"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, Edit, User, Briefcase, DollarSign, FileText,
  Phone, Mail, MapPin, Building2, Calendar, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Employee {
  id: number;
  employee_code: string;
  full_name_ar: string;
  full_name_en: string;
  national_id: string;
  birth_date: string;
  gender: string;
  marital_status: string;
  religion: string;
  nationality: string;
  phone: string;
  phone2: string;
  email: string;
  city: string;
  address: string;
  hire_date: string;
  department: string;
  branch: string;
  job_title: string;
  direct_manager: { id: number; name: string } | null;
  attendance_pattern: string;
  worker_type_display: string;
  status: string;
  status_code: string;
  basic_salary: number;
  currency: string;
  bank_name: string;
  bank_account: string;
  iban: string;
  contract_type: string;
  contract_start: string;
  contract_end: string;
}

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const d = useDict();
  const lang = useLangStore((s) => s.lang);

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"personal" | "job" | "salary" | "contract">("personal");

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  useEffect(() => {
    if (!token || !params.id) return;
    fetch(`/api/employees/${params.id}`, {
      headers: { Authorization: authHeader },
    })
      .then(r => r.json())
      .then(data => setEmployee(data.employee || data))
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-xl font-semibold mb-2">{d.employeeNotFound}</h2>
        <Button variant="outline" onClick={() => router.push("/hr/employees")} className="mt-4 gap-2">
          <ArrowLeft className="w-4 h-4" />
          {d.backToList}
        </Button>
      </div>
    );
  }

  const displayName = lang === "en" && employee.full_name_en
    ? employee.full_name_en
    : employee.full_name_ar;

  const initials = displayName?.[0] || "?";

  const tabs = [
    { key: "personal" as const, label: d.personalInfo, icon: User },
    { key: "job" as const, label: d.jobInfo, icon: Briefcase },
    { key: "salary" as const, label: d.salaryInfo, icon: DollarSign },
    { key: "contract" as const, label: d.contractInfo, icon: FileText },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push("/hr/employees")}
        className="gap-2 -ml-2"
      >
        <ArrowLeft className="w-4 h-4" />
        {d.backToEmployees}
      </Button>

      {/* Header Card */}
      <Card className="border-0 overflow-hidden">
        <div className="gradient-brand p-6 text-white relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20 border-4 border-white/20">
                <AvatarFallback className="bg-white/10 text-white text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">{displayName}</h1>
                <p className="text-white/80 text-sm">{employee.job_title}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-white/20 text-white border-0">
                    {employee.employee_code}
                  </Badge>
                  <Badge className="bg-emerald-500/30 text-white border-0">
                    {employee.status}
                  </Badge>
                </div>
              </div>
            </div>
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 gap-2">
              <Edit className="w-4 h-4" />
              {d.edit}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border bg-muted/30">
          <div className="flex gap-1 px-4">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition
                  ${activeTab === tab.key
                    ? "border-brand-primary text-brand-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-6">
          {activeTab === "personal" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-6">{d.personalInfo}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field label={d.nameAr} value={employee.full_name_ar} />
                  <Field label={d.nameEn} value={employee.full_name_en} />
                  <Field label={d.nationalId} value={employee.national_id} dir="ltr" />
                  <Field label={d.birthDate} value={employee.birth_date} icon={Calendar} />
                  <Field label={d.gender} value={employee.gender} />
                  <Field label={d.maritalStatus} value={employee.marital_status} />
                  <Field label={d.religion} value={employee.religion} />
                  <Field label={d.nationality} value={employee.nationality} />
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-4 text-brand-primary">{d.contactInfo}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field label={d.phone} value={employee.phone} icon={Phone} dir="ltr" />
                  <Field label={d.phone2} value={employee.phone2} icon={Phone} dir="ltr" />
                  <Field label={d.email} value={employee.email} icon={Mail} dir="ltr" />
                  <Field label={d.city} value={employee.city} icon={MapPin} />
                  <Field label={d.addressField} value={employee.address} icon={MapPin} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "job" && (
            <div>
              <h3 className="text-lg font-semibold mb-6">{d.jobInfo}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label={d.empCode} value={employee.employee_code} />
                <Field label={d.hireDate} value={employee.hire_date} icon={Calendar} />
                <Field label={d.dept} value={employee.department} icon={Building2} />
                <Field label={d.branch} value={employee.branch} icon={Building2} />
                <Field label={d.jobTitle} value={employee.job_title} icon={Briefcase} />
                <Field label={d.directManager} value={employee.direct_manager?.name} icon={User} />
                <Field label={d.attendancePattern} value={employee.attendance_pattern} />
                <Field label={d.workerType} value={employee.worker_type_display} />
                <Field label={d.empStatus} value={employee.status} />
              </div>
            </div>
          )}

          {activeTab === "salary" && (
            <div>
              <h3 className="text-lg font-semibold mb-6">{d.salaryInfo}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field
                  label={d.basicSalary}
                  value={
                    employee.basic_salary
                      ? `${Number(employee.basic_salary).toLocaleString(lang === "ar" ? "ar-EG" : "en-US")} ${lang === "ar" ? "جنيه" : "EGP"}`
                      : null
                  }
                  icon={DollarSign}
                />
                <Field label={d.currency} value={employee.currency} />
                <Field label={d.bankName} value={employee.bank_name} />
                <Field label={d.bankAccount} value={employee.bank_account} dir="ltr" />
                <Field label={d.iban} value={employee.iban} dir="ltr" />
              </div>
            </div>
          )}

          {activeTab === "contract" && (
            <div>
              <h3 className="text-lg font-semibold mb-6">{d.contractInfo}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label={d.contractType} value={employee.contract_type} />
                <Field label={d.contractStart} value={employee.contract_start} icon={Calendar} />
                <Field label={d.contractEnd} value={employee.contract_end} icon={Calendar} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label, value, icon: Icon, dir,
}: {
  label: string;
  value?: string | number | null;
  icon?: React.ComponentType<{ className?: string }>;
  dir?: "ltr" | "rtl";
}) {
  const display = value !== null && value !== undefined && value !== "" ? String(value) : "—";
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2 text-sm">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
        <span dir={dir} className="truncate">{display}</span>
      </div>
    </div>
  );
}
