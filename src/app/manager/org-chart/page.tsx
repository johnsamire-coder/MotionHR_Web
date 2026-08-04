"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Users, Loader2, ChevronDown, ChevronRight,
  Building2, Briefcase, Crown, User,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

// ── Types ─────────────────────────────────────────
interface Node {
  id: number;
  name_ar: string;
  name_en: string;
  employee_code: string;
  job_title_ar: string;
  job_title_en: string;
  department: string;
  branch: string;
  photo?: string | null;
  role: string;
  team_size: number;
  children: Node[];
}

interface HierarchyData {
  success: boolean;
  company_name: string;
  total_employees: number;
  root: Node[];
}

// ── Node Card Component ──────────────────────────
function NodeCard({
  node,
  level,
  expanded,
  onToggle,
  searchTerm,
  ar,
}: {
  node: Node;
  level: number;
  expanded: Set<number>;
  onToggle: (id: number) => void;
  searchTerm: string;
  ar: boolean;
}) {
  const isExpanded = expanded.has(node.id);
  const hasChildren = node.children.length > 0;
  const name = ar ? node.name_ar : (node.name_en || node.name_ar);
  const job  = ar ? node.job_title_ar : (node.job_title_en || node.job_title_ar);
  const isOwner = node.role === "company_admin" || node.role === "super_admin" || node.role === "owner";
  const isManager = node.role === "manager" || hasChildren;

  const matchesSearch = !searchTerm ||
    name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (job || "").toLowerCase().includes(searchTerm.toLowerCase());

  const childMatches = (n: Node): boolean => {
    if (!searchTerm) return true;
    const nm = ar ? n.name_ar : n.name_en;
    if (nm.toLowerCase().includes(searchTerm.toLowerCase())) return true;
    return n.children.some(childMatches);
  };

  const shouldShow = matchesSearch || node.children.some(childMatches);
  if (!shouldShow) return null;

  const cardColor = isOwner
    ? "bg-gradient-to-br from-amber-500/20 to-amber-500/5 border-amber-500/40"
    : isManager
    ? "bg-gradient-to-br from-brand-primary/10 to-brand-primary/5 border-brand-primary/30"
    : "bg-muted/30 border-border";

  const iconColor = isOwner
    ? "bg-amber-500/20 text-amber-700"
    : isManager
    ? "bg-brand-primary/20 text-brand-primary"
    : "bg-slate-200 text-slate-600";

  return (
    <div className="relative">
      <div className={`p-3 rounded-xl border-2 ${cardColor} hover:shadow-md transition`}>
        <div className="flex items-center gap-3">
          {/* Toggle */}
          {hasChildren ? (
            <button
              onClick={() => onToggle(node.id)}
              className="p-1 hover:bg-white/50 rounded-lg transition"
            >
              {isExpanded
                ? <ChevronDown className="w-4 h-4" />
                : <ChevronRight className={`w-4 h-4 ${ar ? "rotate-180" : ""}`} />
              }
            </button>
          ) : (
            <div className="w-6" />
          )}

          {/* Avatar */}
          <Avatar className="w-10 h-10 shrink-0">
            <AvatarFallback className={`text-sm font-bold ${iconColor}`}>
              {isOwner ? <Crown className="w-5 h-5" />
                : isManager ? <Briefcase className="w-4 h-4" />
                : (name[0] || "U")}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm">{name}</p>
              {isOwner && (
                <Badge className="bg-amber-500/20 text-amber-800 border-0 text-[10px]">
                  {ar ? "صاحب الشركة" : "Owner"}
                </Badge>
              )}
              {!isOwner && isManager && (
                <Badge className="bg-brand-primary/20 text-brand-primary border-0 text-[10px]">
                  {ar ? "مدير" : "Manager"}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap mt-0.5 text-xs text-muted-foreground">
              <span>{node.employee_code}</span>
              {job && (<><span>•</span><span>{job}</span></>)}
              {node.department && (<><span>•</span><Building2 className="w-3 h-3" /><span>{node.department}</span></>)}
            </div>
          </div>

          {/* Team Count */}
          {hasChildren && (
            <div className="flex items-center gap-1 shrink-0">
              <Badge className="bg-white/70 text-slate-700 border-0 gap-1">
                <Users className="w-3 h-3" />
                {node.team_size}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className={`mt-2 space-y-2 ${ar ? "mr-6 border-r-2" : "ml-6 border-l-2"} border-dashed border-muted-foreground/20 ${ar ? "pr-4" : "pl-4"}`}>
          {node.children.map(child => (
            <NodeCard
              key={child.id}
              node={child}
              level={level + 1}
              expanded={expanded}
              onToggle={onToggle}
              searchTerm={searchTerm}
              ar={ar}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────
export default function OrgChartPage() {
  const lang = useLangStore((s) => s.lang);
  const ar = lang === "ar";

  const [data, setData]         = useState<HierarchyData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [search, setSearch]     = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;
  const langH = ar ? "ar" : "en";

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/hierarchy", {
        headers: { Authorization: authH, "Accept-Language": langH },
      });
      const d: HierarchyData = await res.json();
      if (d.success !== false) {
        setData(d);
        // فتح الطبقة الأولى تلقائياً
        if (d.root) {
          const firstLevel = new Set<number>();
          d.root.forEach(r => firstLevel.add(r.id));
          setExpanded(firstLevel);
        }
      }
    } catch {
      toast.error(ar ? "فشل تحميل الهيكل" : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token, ar, authH, langH]);

  useEffect(() => { load(); }, [load]);

  const toggle = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    if (!data?.root) return;
    const all = new Set<number>();
    const collect = (nodes: Node[]) => {
      nodes.forEach(n => {
        all.add(n.id);
        collect(n.children);
      });
    };
    collect(data.root);
    setExpanded(all);
  };

  const collapseAll = () => setExpanded(new Set());

  return (
    <div className="space-y-6 pb-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {ar ? "الهيكل التنظيمي" : "Organization Chart"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {ar ? "الهيكل الهرمي للشركة" : "Company hierarchy"}
        </p>
      </div>

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="bg-brand-primary/5 border-brand-primary/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-brand-primary/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{ar ? "الشركة" : "Company"}</p>
                <p className="font-semibold">{data.company_name}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{ar ? "إجمالي الموظفين" : "Total Employees"}</p>
                <p className="text-xl font-bold">{data.total_employees}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={ar ? "ابحث بالاسم أو الكود..." : "Search by name or code..."}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
          <button
            onClick={expandAll}
            className="text-xs px-3 py-1.5 rounded-lg bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 transition"
          >
            {ar ? "توسيع الكل" : "Expand All"}
          </button>
          <button
            onClick={collapseAll}
            className="text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/70 transition"
          >
            {ar ? "طي الكل" : "Collapse All"}
          </button>
        </CardContent>
      </Card>

      {/* Tree */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : !data?.root?.length ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">{ar ? "لا يوجد بيانات" : "No data"}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              {data.root.map(node => (
                <NodeCard
                  key={node.id}
                  node={node}
                  level={0}
                  expanded={expanded}
                  onToggle={toggle}
                  searchTerm={search}
                  ar={ar}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
