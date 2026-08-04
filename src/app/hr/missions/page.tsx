"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Briefcase, Users, Activity, CheckCircle2, Clock, XCircle,
  Search, Loader2, Plus, MapPin, DollarSign, TrendingUp,
  Calendar, Star, Heart, FileText, Bell, Filter,
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
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Mission {
  id: number;
  title?: string;
  employee_name?: string;
  employee_id?: number;
  location?: string;
  scheduled_date?: string;
  status?: string;
  feedback_status?: string;
  deal_value?: number;
}

interface PendingRequest {
  id: number;
  employee_name?: string;
  title?: string;
  scheduled_date?: string;
  location?: string;
  reason?: string;
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

export default function MissionsPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);

  const [missions, setMissions] = useState<Mission[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [feedback, setFeedback] = useState<FeedbackDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all");

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authHeader = token?.startsWith("Token") ? token : `Token ${token}`;

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      fetch("/api/missions", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/missions/pending", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/missions/feedback", { headers: { Authorization: authHeader } }).then(r => r.json()),
    ]).then(([mData, pData, fData]) => {
      setMissions(mData?.missions || []);
      setPendingRequests(pData?.requests || []);
      setFeedback(fData);
    })
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, []);

  const filtered = missions.filter(m => {
    const matchSearch = !search ||
      (m.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.employee_name || "").toLowerCase().includes(search.toLowerCase());
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
      pending: { label: d.missionStatusPending, color: "bg-amber-500/10 text-amber-700 border-amber-500/20", icon: Clock },
      assigned: { label: d.missionStatusAssigned, color: "bg-blue-500/10 text-blue-700 border-blue-500/20", icon: Bell },
      active: { label: d.missionStatusActive, color: "bg-purple-500/10 text-purple-700 border-purple-500/20", icon: Activity },
      in_progress: { label: d.missionStatusActive, color: "bg-purple-500/10 text-purple-700 border-purple-500/20", icon: Activity },
      completed: { label: d.missionStatusCompleted, color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20", icon: CheckCircle2 },
      cancelled: { label: d.missionStatusCancelled, color: "bg-red-500/10 text-red-700 border-red-500/20", icon: XCircle },
    };
    return map[status || ""] || map.pending;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  const formatCurrency = (val: string | number) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(num) || num === 0) return "—";
    return new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-US").format(num);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.missionsTitle}</h1>
          <p className="text-muted-foreground mt-1">{d.missionsDesc}</p>
        </div>

        <Button className="gap-2 bg-brand-primary hover:bg-brand-primary/90">
          <Plus className="w-4 h-4" />
          {d.createMission}
        </Button>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Card key={i}><CardContent className="p-4"><div className="h-16 bg-muted animate-pulse rounded" /></CardContent></Card>)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={Briefcase}
            label={d.totalMissions}
            value={stats.total}
            color="bg-blue-500/10 text-blue-600"
            active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
          />
          <StatCard
            icon={Activity}
            label={d.activeMissions}
            value={stats.active}
            color="bg-purple-500/10 text-purple-600"
            active={statusFilter === "active"}
            onClick={() => setStatusFilter(statusFilter === "active" ? "all" : "active")}
          />
          <StatCard
            icon={CheckCircle2}
            label={d.completedMissions}
            value={stats.completed}
            color="bg-emerald-500/10 text-emerald-600"
            active={statusFilter === "completed"}
            onClick={() => setStatusFilter(statusFilter === "completed" ? "all" : "completed")}
          />
          <StatCard
            icon={Clock}
            label={d.pendingMissionRequests}
            value={stats.pending}
            color="bg-amber-500/10 text-amber-600"
          />
        </div>
      )}

      {/* Feedback Dashboard */}
      {!loading && feedback && (
        <Card className="border-0 bg-gradient-to-br from-brand-primary/5 to-brand-accent/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-brand-primary" />
              <h2 className="text-lg font-semibold">{d.feedbackDashboard}</h2>
            </div>

            {/* Deal Value Highlight */}
            <div className="mb-4 p-4 rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{d.totalDealValue}</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {formatCurrency(feedback.summary.total_deal_value)}
                  </p>
                </div>
              </div>
            </div>

            {/* Feedback Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <FeedbackStatCard
                icon={FileText}
                label={d.totalFeedbacks}
                value={feedback.summary.total_feedbacks}
                color="bg-blue-500/10 text-blue-600"
              />
              <FeedbackStatCard
                icon={Star}
                label={d.veryInterested}
                value={feedback.summary.very_interested}
                color="bg-yellow-500/10 text-yellow-600"
              />
              <FeedbackStatCard
                icon={Heart}
                label={d.interested}
                value={feedback.summary.interested}
                color="bg-pink-500/10 text-pink-600"
              />
              <FeedbackStatCard
                icon={CheckCircle2}
                label={d.contractsSigned}
                value={feedback.summary.contracts_signed}
                color="bg-emerald-500/10 text-emerald-600"
              />
              <FeedbackStatCard
                icon={Bell}
                label={d.needsFollowup}
                value={feedback.summary.needs_followup}
                color="bg-orange-500/10 text-orange-600"
              />
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
              {d.tabAllMissions}
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
              {d.tabPendingRequests}
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
                <Input placeholder={d.searchEmployees} value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 ml-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{d.allStatusesAtt}</SelectItem>
                  <SelectItem value="pending">{d.missionStatusPending}</SelectItem>
                  <SelectItem value="active">{d.missionStatusActive}</SelectItem>
                  <SelectItem value="completed">{d.missionStatusCompleted}</SelectItem>
                  <SelectItem value="cancelled">{d.missionStatusCancelled}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/50">
        <div className="p-4 border-b border-border">
          <div className="text-sm text-muted-foreground">
            {activeTab === "all" ? (
              <>
                {d.showingOf} <span className="font-semibold text-foreground">{filtered.length}</span> {d.of}{" "}
                <span className="font-semibold text-foreground">{missions.length}</span>
              </>
            ) : (
              <>
                <span className="font-semibold text-foreground">{pendingRequests.length}</span>{" "}
                {d.pendingMissionRequests.toLowerCase()}
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
              <p className="font-medium">{d.noMissionsData}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.missionTitle}</TableHead>
                  <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.missionEmployee}</TableHead>
                  <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.missionLocation}</TableHead>
                  <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.missionDate}</TableHead>
                  <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.missionStatusCol}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(m => {
                  const statusInfo = getStatusInfo(m.status);
                  const StatusIcon = statusInfo.icon;
                  return (
                    <TableRow key={m.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-brand-primary" />
                          <span className="font-medium">{m.title || `#${m.id}`}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-7 h-7">
                            <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-xs">
                              {m.employee_name?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{m.employee_name || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {m.location ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            <span>{m.location}</span>
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs" dir="ltr">
                        {formatDate(m.scheduled_date)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusInfo.color} border font-medium gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )
        ) : (
          pendingRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="font-medium">{d.noPendingRequests}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.missionEmployee}</TableHead>
                  <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.missionTitle}</TableHead>
                  <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.missionDate}</TableHead>
                  <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.missionLocation}</TableHead>
                  <TableHead className={lang === "ar" ? "text-right" : "text-left"}>{d.requestActions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map(r => (
                  <TableRow key={r.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-7 h-7">
                          <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-xs">
                            {r.employee_name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{r.employee_name || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{r.title || "—"}</TableCell>
                    <TableCell className="font-mono text-xs" dir="ltr">
                      {formatDate(r.scheduled_date)}
                    </TableCell>
                    <TableCell>
                      {r.location ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span>{r.location}</span>
                        </div>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="h-8 text-emerald-600 hover:bg-emerald-50">
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-red-600 hover:bg-red-50">
                          <XCircle className="w-4 h-4" />
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
    </div>
  );
}
