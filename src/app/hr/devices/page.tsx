"use client";

import { useEffect, useState } from "react";
import { Loader2, Smartphone, CheckCircle2, XCircle, Ban } from "lucide-react";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";
import { Card, CardContent } from "@/components/ui/card";

type DeviceRow = {
  id: number;
  employee_name: string;
  username: string;
  device_name: string;
  device_id: string;
  platform: string;
  status: string;
  is_first_device: boolean;
  auto_attendance_enabled: boolean;
  created_at: string;
  last_login_at: string;
};

export default function TrustedDevicesPage() {
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";

  const [rows, setRows] = useState<DeviceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [actingId, setActingId] = useState<number | null>(null);

  const getAuth = () => {
    const t = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
    if (!t) return null;
    return t.startsWith("Token") ? t : `Token ${t}`;
  };

  const load = async (status = statusFilter) => {
    const auth = getAuth();
    if (!auth) return;
    setLoading(true);
    setError("");
    try {
      const qs = status === "all" ? "" : `?status=${status}`;
      const res = await fetch(`/api/hr/devices${qs}`, {
        headers: { Authorization: auth },
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRows(data.results || []);
      } else {
        setError(data.message || data.error || (ar ? "فشل تحميل الأجهزة" : "Failed to load devices"));
      }
    } catch {
      setError(ar ? "فشل تحميل الأجهزة" : "Failed to load devices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  const doAction = async (id: number, action: "approve" | "reject" | "revoke") => {
    const auth = getAuth();
    if (!auth) return;
    setActingId(id);
    try {
      const res = await fetch(`/api/hr/devices/${id}/action`, {
        method: "POST",
        headers: {
          Authorization: auth,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || data.error || (ar ? "فشل التنفيذ" : "Action failed"));
      } else {
        await load();
      }
    } catch {
      alert(ar ? "فشل التنفيذ" : "Action failed");
    } finally {
      setActingId(null);
    }
  };

  const statusLabel = (status: string) => {
    if (status === "approved") return ar ? "معتمد" : "Approved";
    if (status === "pending") return ar ? "معلق" : "Pending";
    if (status === "rejected") return ar ? "مرفوض" : "Rejected";
    if (status === "revoked") return ar ? "ملغي" : "Revoked";
    return status;
  };

  const statusClass = (status: string) => {
    if (status === "approved") return "bg-emerald-100 text-emerald-700";
    if (status === "pending") return "bg-amber-100 text-amber-700";
    if (status === "rejected") return "bg-red-100 text-red-700";
    if (status === "revoked") return "bg-slate-200 text-slate-700";
    return "bg-slate-100 text-slate-700";
  };

  const filters = [
    { key: "pending", label: ar ? "معلقة" : "Pending" },
    { key: "approved", label: ar ? "معتمدة" : "Approved" },
    { key: "rejected", label: ar ? "مرفوضة" : "Rejected" },
    { key: "revoked", label: ar ? "ملغية" : "Revoked" },
    { key: "all", label: ar ? "الكل" : "All" },
  ];

  return (
    <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{ar ? "الأجهزة المعتمدة" : "Trusted Devices"}</h1>
        <p className="text-muted-foreground mt-1">
          {ar ? "إدارة أجهزة الموظفين والموافقة عليها" : "Manage employee devices and approve them"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`px-3 py-2 rounded-lg border text-sm ${statusFilter === f.key ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-10 text-red-500">{error}</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          {ar ? "لا توجد أجهزة" : "No devices found"}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {rows.map((row) => (
            <Card key={row.id}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold">{row.employee_name}</div>
                      <div className="text-sm text-muted-foreground">{row.username}</div>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusClass(row.status)}`}>
                    {statusLabel(row.status)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">{ar ? "الجهاز:" : "Device:"}</span> {row.device_name || "—"}</div>
                  <div><span className="text-muted-foreground">{ar ? "المنصة:" : "Platform:"}</span> {row.platform || "—"}</div>
                  <div><span className="text-muted-foreground">{ar ? "معرف الجهاز:" : "Device ID:"}</span> {row.device_id || "—"}</div>
                  <div><span className="text-muted-foreground">{ar ? "آخر دخول:" : "Last login:"}</span> {row.last_login_at || "—"}</div>
                  <div><span className="text-muted-foreground">{ar ? "أول جهاز:" : "First device:"}</span> {row.is_first_device ? (ar ? "نعم" : "Yes") : (ar ? "لا" : "No")}</div>
                  <div><span className="text-muted-foreground">{ar ? "الحضور التلقائي:" : "Auto attendance:"}</span> {row.auto_attendance_enabled ? (ar ? "مفعل" : "Enabled") : (ar ? "موقوف" : "Disabled")}</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {row.status === "pending" && (
                    <>
                      <button
                        onClick={() => doAction(row.id, "approve")}
                        disabled={actingId === row.id}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {actingId === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        {ar ? "موافقة" : "Approve"}
                      </button>
                      <button
                        onClick={() => doAction(row.id, "reject")}
                        disabled={actingId === row.id}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        {actingId === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        {ar ? "رفض" : "Reject"}
                      </button>
                    </>
                  )}

                  {row.status === "approved" && (
                    <button
                      onClick={() => doAction(row.id, "revoke")}
                      disabled={actingId === row.id}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-60"
                    >
                      {actingId === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                      {ar ? "إلغاء الجهاز" : "Revoke Device"}
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
