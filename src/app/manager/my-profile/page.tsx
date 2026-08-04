"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  User, Mail, Phone, MapPin, Briefcase, Calendar,
  Building2, Loader2, CheckCircle2, DollarSign,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Profile {
  id: number;
  employee_code: string;
  full_name_ar: string;
  full_name_en: string;
  national_id?: string;
  birth_date?: string;
  gender?: string;
  marital_status?: string;
  nationality?: string;
  email?: string;
  phone?: string;
  phone2?: string;
  address?: string;
  city?: string;
  hire_date?: string;
  contract_type?: string;
  branch?: string;
  department?: string;
  job_title?: string;
  direct_manager?: { name?: string };
  basic_salary?: number;
  status?: string;
}

function InfoField({
  icon: Icon, label, value, dir,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | number | null;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="p-4 rounded-lg bg-muted/30">
      <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div className="text-sm font-medium" dir={dir}>
        {value || "—"}
      </div>
    </div>
  );
}

export default function MyProfilePage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEYS.token) : null;
    if (!token) return;
    const authHeader = token.startsWith("Token") ? token : `Token ${token}`;

    fetch("/api/profile", { headers: { Authorization: authHeader } })
      .then(r => r.json())
      .then(setProfile)
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) return null;

  const displayName = lang === "en" && profile.full_name_en
    ? profile.full_name_en : profile.full_name_ar;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{d.myProfile}</h1>
        <p className="text-muted-foreground mt-1">
          {lang === "ar" ? "بياناتك الشخصية والوظيفية" : "Your personal and job information"}
        </p>
      </div>

      {/* Header Card */}
      <Card className="border-0 bg-gradient-to-br from-brand-primary/10 to-brand-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
              <AvatarFallback className="bg-brand-primary text-white text-3xl font-bold">
                {displayName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">{displayName}</h2>
              <p className="text-brand-primary font-medium mb-2">{profile.job_title}</p>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-white/80 text-brand-primary border-0">
                  {profile.employee_code}
                </Badge>
                <Badge className="bg-emerald-500/10 text-emerald-700 border-0 gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {profile.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-brand-primary" />
            {d.personalInfo}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InfoField icon={User} label={d.nationalId} value={profile.national_id} dir="ltr" />
            <InfoField icon={Calendar} label={d.birthDate} value={profile.birth_date} />
            <InfoField icon={User} label={d.gender} value={profile.gender} />
            <InfoField icon={User} label={d.maritalStatus} value={profile.marital_status} />
            <InfoField icon={Mail} label={d.email} value={profile.email} dir="ltr" />
            <InfoField icon={Phone} label={d.phone} value={profile.phone} dir="ltr" />
            <InfoField icon={MapPin} label={d.city} value={profile.city} />
            <InfoField icon={MapPin} label={d.addressField} value={profile.address} />
          </div>
        </CardContent>
      </Card>

      {/* Job Info */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-brand-primary" />
            {d.jobInfo}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InfoField icon={Briefcase} label={d.jobTitle} value={profile.job_title} />
            <InfoField icon={Building2} label={d.dept} value={profile.department} />
            <InfoField icon={MapPin} label={d.branch} value={profile.branch} />
            <InfoField icon={User} label={d.directManager} value={profile.direct_manager?.name} />
            <InfoField icon={Calendar} label={d.hireDate} value={profile.hire_date} />
            <InfoField icon={Briefcase} label={d.contractType} value={profile.contract_type} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
