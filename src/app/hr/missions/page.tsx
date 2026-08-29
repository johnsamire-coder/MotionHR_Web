// src/app/hr/missions/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  Briefcase, Users, Activity, CheckCircle2, Clock, XCircle,
  Search, Loader2, Plus, MapPin, DollarSign, TrendingUp,
  Calendar, Star, Heart, FileText, Bell, Filter, Download,
  AlertTriangle, User, ChevronDown, Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Mission {
  id: number;
  title?: string;
  description?: string;
  priority?: string;
  priority_display?: string;
  employee_name?: string;
  employee_id?: number;
  location?: string;
  location_name?: string;
  scheduled_date?: string;
  planned_start_time?: string;
  planned_end_time?: string;
  created_at?: string;
  status?: string;
  feedback_status?: string;
  deal_value?: number;
  has_feedback?: boolean;
  assignments?: Array<{
    id: number;
    employee_id: number;
    employee_name: string;
    is_lead: boolean;
    status: string;
  }>;
}

interface Employee {
  id: number;
  name: string;
  first_name_ar?: string;
  last_name_ar?: string;
  job_title?: string;
  department?: string;
}

interface PendingRequest {
  id: number;
  employee_name?: string;
  title?: string;
  scheduled_date?: string;
  planned_start?: string;
  location?: string;
  reason?: string;
  mission_id?: number;
  mission_title?: string;
  requested_by?: string;
}

interface FeedbackDashboard {
  summary: {
    total_feedbacks: number;
    very_interested: number;
    interested: number;
    contracts_signed: number;
    needs_followup: number;
    total_deal_value: string;
  };
  upcoming_followups: unknown[];
  recent_feedbacks: unknown[];
}

interface MissionForm {
  title: string;
  description: string;
  priority: string;
  planned_start_time: string;
  planned_end_time: string;
  location_name: string;
  location_lat: string;
  location_lng: string;
  client_name: string;
  client_phone: string;
  client_company: string;
  client_email: string;
  client_address: string;
  assignees: Array<{ employee_id: number; employee_name: string; is_lead: boolean }>;
}

interface SearchResult {
  lat: string;
  lon: string;
  display_name: string;
}

const EGYPT_CENTER: [number, number] = [26.8206, 30.8025];
const EGYPT_BOUNDS: [[number, number], [number, number]] = [
  [22.0, 24.7],
  [31.6, 36.9],
];

function StatCard({
  icon: Icon, label, value, subtitle, color, active, onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtitle?: string;
  color: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Card
      className={`border transition-all cursor-pointer hover:shadow-md ${
        active ? "border-brand-primary shadow-md" : "border-border/50"
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-bold">{value}</p>
            {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FeedbackStatCard({
  icon: Icon, label, value, color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-1">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

const PRIORITY_OPTIONS = [
  { value: "low", label: "منخفضة", color: "bg-slate-500/10 text-slate-600" },
  { value: "normal", label: "عادية", color: "bg-blue-500/10 text-blue-600" },
  { value: "high", label: "عالية", color: "bg-orange-500/10 text-orange-600" },
  { value: "urgent", label: "عاجلة", color: "bg-red-500/10 text-red-600" },
];

export default function MissionsPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);

  const [missions, setMissions] = useState<Mission[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [feedback, setFeedback] = useState<FeedbackDashboard | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all");
  const [createDialog, setCreateDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  const emptyForm: MissionForm = {
    title: "",
    description: "",
    priority: "normal",
    planned_start_time: "",
    planned_end_time: "",
    location_name: "",
    location_lat: "",
    location_lng: "",
    client_name: "",
    client_phone: "",
    client_company: "",
    client_email: "",
    client_address: "",
    assignees: [],
  };

  const [missionForm, setMissionForm] = useState<MissionForm>(emptyForm);

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInst = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [gettingLoc, setGettingLoc] = useState(false);

  const loadData = useCallback(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      fetch("/api/missions", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/missions/pending", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/missions/feedback", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/employees/list", { headers: { Authorization: authHeader } }).then(r => r.json()),
    ]).then(([mData, pData, fData, eData]) => {
      // normalize missions — الباك بيرجع assignments بدل employee_name مباشرة
      const rawMissions: Mission[] = mData?.missions || [];
      const normalized = rawMissions.map(m => ({
        ...m,
        employee_name: m.assignments?.[0]?.employee_name || m.employee_name || "—",
        location: m.location_name || m.location || "",
      }));
      setMissions(normalized);

      // pending requests — الباك بيرجع requested_by مش employee_name
      const rawPending = pData?.requests || [];
      const normalizedPending = rawPending.map((r: PendingRequest) => ({
        ...r,
        employee_name: r.requested_by || r.employee_name || "—",
        title: r.mission_title || r.title || "—",
        scheduled_date: r.planned_start || r.scheduled_date,
      }));
      setPendingRequests(normalizedPending);

      setFeedback(fData);

      // employees list
      const empList: Employee[] = (eData?.employees || eData?.results || []).map((e: {
        id: number;
        first_name_ar?: string;
        last_name_ar?: string;
        full_name?: string;
        full_name_ar?: string;
        name?: string;
        name_ar?: string;
        job_title_name?: string;
        job_title_name_ar?: string;
        department_name?: string;
        department_name_ar?: string;
      }) => ({
        id: e.id,
name:
  e.full_name ||
  e.full_name_ar ||
  (e.first_name_ar && e.last_name_ar ? `${e.first_name_ar} ${e.last_name_ar}` : "") ||
  e.name ||
  e.name_ar ||
  `موظف #${e.id}`,
job_title: e.job_title_name || e.job_title_name_ar || "",
department: e.department_name || e.department_name_ar || "",
      }));
      setEmployees(empList);
    })
      .catch(() => toast.error("فشل تحميل البيانات"))
      .finally(() => setLoading(false));
  }, [token, authHeader]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!createDialog) return;
    const t = window.setTimeout(() => {
      void initMap();
    }, 250);
    return () => window.clearTimeout(t);
  }, [createDialog]);

  const initMap = async () => {
    if (!mapRef.current || mapInst.current) return;
    try {
      await import("leaflet/dist/leaflet.css");
      const L = await import("leaflet");
      const map = L.map(mapRef.current, {
        maxBounds: L.latLngBounds(EGYPT_BOUNDS[0], EGYPT_BOUNDS[1]),
        maxBoundsViscosity: 1.0,
        minZoom: 5,
      }).setView(EGYPT_CENTER, 6);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      const marker = L.marker(EGYPT_CENTER, { draggable: true }).addTo(map);

      const update = (lat: number, lng: number) => {
        setMissionForm(p => ({
          ...p,
          location_lat: lat.toFixed(6),
          location_lng: lng.toFixed(6),
        }));
      };

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        update(pos.lat, pos.lng);
      });

      map.on("click", (e: any) => {
        marker.setLatLng([e.latlng.lat, e.latlng.lng]);
        update(e.latlng.lat, e.latlng.lng);
      });

      mapInst.current = map;
      markerRef.current = marker;
    } catch (e) {
      console.error("INIT_MAP_FAILED", e);
    }
  };

  const doSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery)}`);
      const data: SearchResult[] = await res.json();
      setSearchResults(data || []);
      if (!data?.length) toast.error("لم يتم العثور على نتائج");
    } catch {
      toast.error("فشل البحث");
    } finally {
      setIsSearching(false);
    }
  };

  const selectResult = (item: SearchResult) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);

    setMissionForm(p => ({
      ...p,
      location_lat: lat.toFixed(6),
      location_lng: lng.toFixed(6),
      location_name: item.display_name,
    }));

    setSearchQuery("");
    setSearchResults([]);

    if (mapInst.current) mapInst.current.setView([lat, lng], 15);
    if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
  };

  const getGPS = async () => {
    setGettingLoc(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
      );

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      setMissionForm(p => ({
        ...p,
        location_lat: lat.toFixed(6),
        location_lng: lng.toFixed(6),
      }));

      if (mapInst.current) mapInst.current.setView([lat, lng], 15);
      if (markerRef.current) markerRef.current.setLatLng([lat, lng]);

      toast.success("تم تحديد موقعك");
    } catch {
      toast.error("فشل تحديد الموقع");
    } finally {
      setGettingLoc(false);
    }
  };

  // تصدير CSV
  const handleExport = async () => {
    try {
      const res = await fetch("/api/hr/missions-export/excel", {
        headers: { Authorization: authHeader },
      });
      if (!res.ok) { toast.error("فشل تصدير Excel"); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "missions.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("فشل تصدير Excel");
    }
  };
  const handleExportPDF = async () => {
    try {
      const res = await fetch("/api/hr/missions-export/pdf", {
        headers: { Authorization: authHeader },
      });
      if (!res.ok) { toast.error("فشل تصدير PDF"); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "missions.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("فشل تصدير PDF");
    }
  };

  // إضافة موظف للمهمة
  const addAssignee = (emp: Employee) => {
    if (missionForm.assignees.find(a => a.employee_id === emp.id)) {
      toast.error("الموظف مضاف مسبقاً");
      return;
    }
    setMissionForm(prev => ({
      ...prev,
      assignees: [
        ...prev.assignees,
        {
          employee_id: emp.id,
          employee_name: emp.name,
          is_lead: prev.assignees.length === 0, // أول موظف يكون قائد تلقائي
        },
      ],
    }));
    setEmployeeSearch("");
    setShowEmployeeDropdown(false);
  };

  // إزالة موظف
  const removeAssignee = (empId: number) => {
    setMissionForm(prev => {
      const updated = prev.assignees.filter(a => a.employee_id !== empId);
      // لو شلنا القائد، الأول يبقى قائد
      if (updated.length > 0 && !updated.find(a => a.is_lead)) {
        updated[0].is_lead = true;
      }
      return { ...prev, assignees: updated };
    });
  };

  // تعيين قائد
  const setLead = (empId: number) => {
    setMissionForm(prev => ({
      ...prev,
      assignees: prev.assignees.map(a => ({ ...a, is_lead: a.employee_id === empId })),
    }));
  };

  const handleCreateMission = async () => {
    if (!missionForm.title) {
      toast.error("عنوان المهمة مطلوب");
      return;
    }
    if (!missionForm.planned_start_time) {
      toast.error("وقت البدء مطلوب");
      return;
    }
    if (!missionForm.planned_end_time) {
      toast.error("وقت الانتهاء مطلوب");
      return;
    }
    if (missionForm.assignees.length === 0) {
      toast.error("يجب تعيين موظف واحد على الأقل");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: missionForm.title,
        description: missionForm.description,
        priority: missionForm.priority,
        planned_start_time: missionForm.planned_start_time,
        planned_end_time: missionForm.planned_end_time,
        location_name: missionForm.location_name,
        location_lat: missionForm.location_lat,
        location_lng: missionForm.location_lng,
        client_name: missionForm.client_name,
        client_phone: missionForm.client_phone,
        client_company: missionForm.client_company,
        client_email: missionForm.client_email,
        client_address: missionForm.client_address,
        assignees: missionForm.assignees.map(a => ({
          employee_id: a.employee_id,
          is_lead: a.is_lead,
          role: a.is_lead ? "lead" : "member",
        })),
      };

      const res = await fetch("/api/manager/create-mission", {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success || data.mission) {
        toast.success("تم إنشاء المهمة بنجاح");
        setCreateDialog(false);
        setMissionForm(emptyForm);
        loadData();
      } else {
        toast.error(data.error || data.message || "فشل الإنشاء");
      }
    } catch {
      toast.error("خطأ في الاتصال");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMissionAction = async (requestId: number, action: "approve" | "reject") => {
    try {
      const res = await fetch("/api/manager/mission-approve", {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId, action }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(action === "approve" ? "تم القبول" : "تم الرفض");
        loadData();
      } else {
        toast.error(data.message || "فشل");
      }
    } catch {
      toast.error("خطأ في الاتصال");
    }
  };

  const filtered = missions.filter(m => {
    const matchSearch = !search ||
      (m.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.employee_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.assignments || []).some(a => a.employee_name.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "all" || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: missions.length,
    active: missions.filter(m => m.status === "active" || m.status === "in_progress").length,
    completed: missions.filter(m => m.status === "completed").length,
    pending: pendingRequests.length,
  };

  const getStatusInfo = (status?: string) => {
    const map: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
      pending: { label: "انتظار", color: "bg-amber-500/10 text-amber-700 border-amber-500/20", icon: Clock },
      pending_approval: { label: "بانتظار الموافقة", color: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20", icon: Clock },
      assigned: { label: "معيّنة", color: "bg-blue-500/10 text-blue-700 border-blue-500/20", icon: Bell },
      approved: { label: "موافق عليها", color: "bg-blue-500/10 text-blue-700 border-blue-500/20", icon: CheckCircle2 },
      active: { label: "نشطة", color: "bg-purple-500/10 text-purple-700 border-purple-500/20", icon: Activity },
      in_progress: { label: "جارية", color: "bg-purple-500/10 text-purple-700 border-purple-500/20", icon: Activity },
      completed: { label: "مكتملة", color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20", icon: CheckCircle2 },
      cancelled: { label: "ملغاة", color: "bg-red-500/10 text-red-700 border-red-500/20", icon: XCircle },
    };
    return map[status || ""] || map.pending;
  };

  const getPriorityInfo = (priority?: string) => {
    const map: Record<string, { label: string; color: string }> = {
      low: { label: "منخفضة", color: "text-slate-500" },
      normal: { label: "عادية", color: "text-blue-600" },
      high: { label: "عالية", color: "text-orange-600" },
      urgent: { label: "عاجلة", color: "text-red-600" },
    };
    return map[priority || "normal"] || map.normal;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("ar-EG", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("ar-EG", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });
  };

  const formatCurrency = (val: string | number) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(num) || num === 0) return "—";
    return new Intl.NumberFormat("ar-EG").format(num);
  };

  const filteredEmployees = employees.filter(e =>
    !employeeSearch || e.name.includes(employeeSearch) || (e.department || "").includes(employeeSearch)
  ).slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.missionsTitle}</h1>
          <p className="text-muted-foreground mt-1">{d.missionsDesc}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            className="gap-2"
            disabled={loading}
          >
            <Download className="w-4 h-4" />
            تصدير Excel
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPDF}
            className="gap-2"
            disabled={loading}
          >
            <FileText className="w-4 h-4" />
            تصدير PDF
          </Button>
          <Button
            onClick={() => setCreateDialog(true)}
            className="gap-2 bg-brand-primary hover:bg-brand-primary/90"
          >
            <Plus className="w-4 h-4" />
            {d.createMission}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-4"><div className="h-16 bg-muted animate-pulse rounded" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Briefcase} label="إجمالي المهمات" value={stats.total}
            color="bg-blue-500/10 text-blue-600" active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")} />
          <StatCard icon={Activity} label="جارية" value={stats.active}
            color="bg-purple-500/10 text-purple-600" active={statusFilter === "in_progress"}
            onClick={() => setStatusFilter(statusFilter === "in_progress" ? "all" : "in_progress")} />
          <StatCard icon={CheckCircle2} label="مكتملة" value={stats.completed}
            color="bg-emerald-500/10 text-emerald-600" active={statusFilter === "completed"}
            onClick={() => setStatusFilter(statusFilter === "completed" ? "all" : "completed")} />
          <StatCard icon={Clock} label="طلبات انتظار" value={stats.pending}
            color="bg-amber-500/10 text-amber-600" />
        </div>
      )}

      {/* Feedback Dashboard */}
      {!loading && feedback && (
        <Card className="border-0 bg-gradient-to-br from-brand-primary/5 to-brand-accent/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-brand-primary" />
              <h2 className="text-lg font-semibold">داشبورد الفيدباك</h2>
            </div>
            <div className="mb-4 p-4 rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">إجمالي قيمة الصفقات</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {formatCurrency(feedback.summary.total_deal_value)} جنيه
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <FeedbackStatCard icon={FileText} label="إجمالي الفيدباك" value={feedback.summary.total_feedbacks} color="bg-blue-500/10 text-blue-600" />
              <FeedbackStatCard icon={Star} label="مهتم جداً" value={feedback.summary.very_interested} color="bg-yellow-500/10 text-yellow-600" />
              <FeedbackStatCard icon={Heart} label="مهتم" value={feedback.summary.interested} color="bg-pink-500/10 text-pink-600" />
              <FeedbackStatCard icon={CheckCircle2} label="عقود موقّعة" value={feedback.summary.contracts_signed} color="bg-emerald-500/10 text-emerald-600" />
              <FeedbackStatCard icon={Bell} label="تحتاج متابعة" value={feedback.summary.needs_followup} color="bg-orange-500/10 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs + Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-1 mb-4 border-b border-border">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                activeTab === "all"
                  ? "border-brand-primary text-brand-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              كل المهمات
              <Badge variant="outline" className="ml-2 text-[10px]">{missions.length}</Badge>
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
                activeTab === "pending"
                  ? "border-brand-primary text-brand-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              طلبات الموظفين
              {pendingRequests.length > 0 && (
                <Badge className="bg-amber-500/10 text-amber-700 border-0 text-[10px]">
                  {pendingRequests.length}
                </Badge>
              )}
            </button>
          </div>

          {activeTab === "all" && (
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[250px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالعنوان أو اسم الموظف..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={v => setStatusFilter(v ?? "all")}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 ml-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="pending">انتظار</SelectItem>
                  <SelectItem value="approved">موافق عليها</SelectItem>
                  <SelectItem value="in_progress">جارية</SelectItem>
                  <SelectItem value="completed">مكتملة</SelectItem>
                  <SelectItem value="cancelled">ملغاة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/50">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {activeTab === "all" ? (
              <>
                عرض <span className="font-semibold text-foreground">{filtered.length}</span> من{" "}
                <span className="font-semibold text-foreground">{missions.length}</span> مهمة
              </>
            ) : (
              <>
                <span className="font-semibold text-foreground">{pendingRequests.length}</span> طلب في الانتظار
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : activeTab === "all" ? (
          filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Briefcase className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="font-medium">لا توجد مهمات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">العنوان</TableHead>
                    <TableHead className="text-right">الموظفون</TableHead>
                    <TableHead className="text-right">الموقع</TableHead>
                    <TableHead className="text-right">وقت البدء</TableHead>
                    <TableHead className="text-right">وقت الانتهاء</TableHead>
                    <TableHead className="text-right">الأولوية</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">فيدباك</TableHead>
                    <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(m => {
                    const statusInfo = getStatusInfo(m.status);
                    const StatusIcon = statusInfo.icon;
                    const priorityInfo = getPriorityInfo(m.priority);
                    const assignees = m.assignments || [];
                    const leadAssignee = assignees.find(a => a.is_lead) || assignees[0];

                    return (
                      <TableRow key={m.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-start gap-2">
                            <Briefcase className="w-4 h-4 text-brand-primary mt-0.5 shrink-0" />
                            <div>
                              <p className="font-medium text-sm">{m.title || `#${m.id}`}</p>
                              {m.description && (
                                <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-[180px]">
                                  {m.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {assignees.length === 0 ? (
                              <span className="text-muted-foreground text-sm">—</span>
                            ) : (
                              <>
                                {leadAssignee && (
                                  <div className="flex items-center gap-1.5">
                                    <Avatar className="w-6 h-6">
                                      <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-[10px]">
                                        {leadAssignee.employee_name?.[0] || "?"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">{leadAssignee.employee_name}</span>
                                    <Badge className="text-[9px] bg-brand-primary/10 text-brand-primary border-0 h-4 px-1">
                                      قائد
                                    </Badge>
                                  </div>
                                )}
                                {assignees.length > 1 && (
                                  <p className="text-[10px] text-muted-foreground">
                                    +{assignees.length - 1} آخرين
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {(m.location_name || m.location) ? (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span className="max-w-[120px] truncate">
                                {m.location_name || m.location}
                              </span>
                            </div>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-xs" dir="ltr">
                          {formatDateTime(m.planned_start_time)}
                        </TableCell>
                        <TableCell className="text-xs" dir="ltr">
                          {formatDateTime(m.planned_end_time)}
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium ${priorityInfo.color}`}>
                            {priorityInfo.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusInfo.color} border font-medium gap-1 text-xs`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {m.has_feedback ? (
                            <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              مكتوب
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground" dir="ltr">
                          {formatDate(m.created_at)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )
        ) : (
          pendingRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="font-medium">لا توجد طلبات معلقة</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الموظف</TableHead>
                  <TableHead className="text-right">عنوان المهمة</TableHead>
                  <TableHead className="text-right">وقت البدء</TableHead>
                  <TableHead className="text-right">الموقع</TableHead>
                  <TableHead className="text-right">تاريخ الطلب</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map(r => (
                  <TableRow key={r.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-7 h-7">
                          <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-xs">
                            {(r.employee_name || r.requested_by || "?")?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{r.employee_name || r.requested_by || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {r.mission_title || r.title || "—"}
                    </TableCell>
                    <TableCell className="text-xs" dir="ltr">
                      {formatDateTime(r.planned_start || r.scheduled_date)}
                    </TableCell>
                    <TableCell>
                      {r.location ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span>{r.location}</span>
                        </div>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground" dir="ltr">
                      {/* created_at غير موجود في pending — نحط — */}
                      —
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          onClick={() => handleMissionAction(r.id, "approve")}
                          variant="outline" size="sm"
                          className="h-8 text-emerald-600 hover:bg-emerald-50 gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          قبول
                        </Button>
                        <Button
                          onClick={() => handleMissionAction(r.id, "reject")}
                          variant="outline" size="sm"
                          className="h-8 text-red-600 hover:bg-red-50 gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          رفض
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        )}
      </Card>

      {/* Create Mission Dialog */}
      <Dialog open={createDialog} onOpenChange={open => {
        setCreateDialog(open);
        if (!open) {
          setMissionForm(emptyForm);
          setEmployeeSearch("");
          setShowEmployeeDropdown(false);
          setSearchQuery("");
          setSearchResults([]);
          mapInst.current = null;
          markerRef.current = null;
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-brand-primary" />
              إنشاء مهمة جديدة
            </DialogTitle>
            <DialogDescription>
              أدخل تفاصيل المهمة وعيّن الموظفين المسؤولين عنها
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Section: معلومات المهمة */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-1">
                معلومات المهمة
              </h3>

              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1.5">
                  <Label>عنوان المهمة <span className="text-red-500">*</span></Label>
                  <Input
                    value={missionForm.title}
                    onChange={e => setMissionForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="مثال: زيارة عميل شركة النيل"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>الوصف</Label>
                  <Textarea
                    value={missionForm.description}
                    onChange={e => setMissionForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="تفاصيل المهمة والهدف منها..."
                    rows={2}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>الأولوية</Label>
                  <Select
                    value={missionForm.priority}
                    onValueChange={v => setMissionForm(p => ({ ...p, priority: v ?? "normal" }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>وقت البدء <span className="text-red-500">*</span></Label>
                  <Input
                    type="datetime-local"
                    value={missionForm.planned_start_time}
                    onChange={e => setMissionForm(p => ({ ...p, planned_start_time: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>وقت الانتهاء <span className="text-red-500">*</span></Label>
                  <Input
                    type="datetime-local"
                    value={missionForm.planned_end_time}
                    onChange={e => setMissionForm(p => ({ ...p, planned_end_time: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
              <Label>الموقع</Label>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && doSearch()}
                    placeholder="ابحث عن مكان في مصر..."
                    className="pr-10"
                  />
                </div>
                <Button type="button" variant="secondary" onClick={doSearch} disabled={isSearching}>
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "بحث"}
                </Button>
                <Button type="button" variant="outline" onClick={getGPS} disabled={gettingLoc} className="gap-1">
                  {gettingLoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                  GPS
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="border border-border rounded-lg max-h-32 overflow-y-auto bg-background">
                  {searchResults.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => selectResult(item)}
                      className="p-2 text-sm border-b last:border-0 hover:bg-brand-primary/5 cursor-pointer flex items-start gap-2"
                    >
                      <MapPin className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{item.display_name}</span>
                    </div>
                  ))}
                </div>
              )}

              <div
                ref={mapRef}
                className="w-full rounded-xl overflow-hidden border border-border"
                style={{ height: "220px" }}
              />

              <Input
                value={missionForm.location_name}
                onChange={e => setMissionForm(p => ({ ...p, location_name: e.target.value }))}
                placeholder="اسم المكان المختار"
              />

              {missionForm.location_lat && missionForm.location_lng && (
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-mono" dir="ltr">
                    {missionForm.location_lat}, {missionForm.location_lng}
                  </span>
                </div>
              )}
            </div>
            </div>

            {/* Section: بيانات العميل */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-1">
                بيانات العميل (اختياري)
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>اسم العميل</Label>
                  <Input
                    value={missionForm.client_name}
                    onChange={e => setMissionForm(p => ({ ...p, client_name: e.target.value }))}
                    placeholder="الاسم الكامل"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>رقم الهاتف</Label>
                  <Input
                    value={missionForm.client_phone}
                    onChange={e => setMissionForm(p => ({ ...p, client_phone: e.target.value }))}
                    placeholder="01xxxxxxxxx"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>اسم الشركة</Label>
                  <Input
                    value={missionForm.client_company}
                    onChange={e => setMissionForm(p => ({ ...p, client_company: e.target.value }))}
                    placeholder="شركة..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>البريد الإلكتروني</Label>
                  <Input
                    value={missionForm.client_email}
                    onChange={e => setMissionForm(p => ({ ...p, client_email: e.target.value }))}
                    placeholder="example@email.com"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>عنوان العميل</Label>
                <Input
                  value={missionForm.client_address}
                  onChange={e => setMissionForm(p => ({ ...p, client_address: e.target.value }))}
                  placeholder="العنوان التفصيلي"
                />
              </div>
            </div>

            {/* Section: تعيين الموظفين */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-1">
                تعيين الموظفين <span className="text-red-500">*</span>
              </h3>

              {/* موظفون معيّنون */}
              {missionForm.assignees.length > 0 && (
                <div className="space-y-2">
                  {missionForm.assignees.map(a => (
                    <div
                      key={a.employee_id}
                      className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/30"
                    >
                      <Avatar className="w-7 h-7">
                        <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-xs">
                          {a.employee_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm flex-1">{a.employee_name}</span>
                      {a.is_lead ? (
                        <Badge className="bg-brand-primary/10 text-brand-primary border-0 text-[10px]">
                          قائد
                        </Badge>
                      ) : (
                        <button
                          onClick={() => setLead(a.employee_id)}
                          className="text-[10px] text-muted-foreground hover:text-brand-primary transition"
                        >
                          تعيين قائداً
                        </button>
                      )}
                      <button
                        onClick={() => removeAssignee(a.employee_id)}
                        className="text-muted-foreground hover:text-red-500 transition"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* بحث عن موظف */}
              <div className="relative">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={employeeSearch}
                    onChange={e => { setEmployeeSearch(e.target.value); setShowEmployeeDropdown(true); }}
                    onFocus={() => setShowEmployeeDropdown(true)}
                    placeholder="ابحث عن موظف لإضافته..."
                    className="pr-10"
                  />
                </div>
                {showEmployeeDropdown && (employeeSearch || filteredEmployees.length > 0) && (
                  <div className="absolute top-full mt-1 w-full bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                    {filteredEmployees.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground text-center">
                        لا توجد نتائج
                      </div>
                    ) : (
                      filteredEmployees.map(emp => (
                        <button
                          key={emp.id}
                          onClick={() => addAssignee(emp)}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50 transition text-right"
                        >
                          <Avatar className="w-7 h-7">
                            <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-xs">
                              {emp.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{emp.name}</p>
                            {emp.department && (
                              <p className="text-[10px] text-muted-foreground">{emp.department}</p>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {missionForm.assignees.length === 0 && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  يجب إضافة موظف واحد على الأقل
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-2 justify-end pt-2 border-t">
              <Button
                variant="outline"
                onClick={() => { setCreateDialog(false); setMissionForm(emptyForm); }}
                disabled={submitting}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleCreateMission}
                disabled={submitting}
                className="bg-brand-primary hover:bg-brand-primary/90 gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                إنشاء المهمة
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


