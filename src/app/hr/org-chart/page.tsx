"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  GitBranch, Users, Loader2, Crown, ChevronDown, ChevronRight,
  User, Building2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useDict, useLangStore } from "@/lib/stores/language";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Employee {
  id: number;
  employee_code: string;
  full_name: string;
  job_title: string;
  department: string;
  direct_manager_id?: number;
  photo?: string;
}

interface TreeNode extends Employee {
  children: TreeNode[];
}

export default function OrgChartPage() {
  const d = useDict();
  const lang = useLangStore((s) => s.lang);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    const token = typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEYS.token) : null;
    if (!token) return;
    const authHeader = token.startsWith("Token") ? token : `Token ${token}`;

    fetch("/api/employees/list", { headers: { Authorization: authHeader } })
      .then(r => r.json())
      .then(data => {
        const employees: Employee[] = data?.employees || [];

        // نبني الشجرة
        const map = new Map<number, TreeNode>();
        employees.forEach(emp => {
          map.set(emp.id, { ...emp, children: [] });
        });

        const roots: TreeNode[] = [];
        employees.forEach(emp => {
          const node = map.get(emp.id)!;
          if (emp.direct_manager_id && map.has(emp.direct_manager_id)) {
            map.get(emp.direct_manager_id)!.children.push(node);
          } else {
            roots.push(node);
          }
        });

        setTree(roots);
        // Expand root nodes by default
        setExpanded(new Set(roots.map(r => r.id)));
      })
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id: number) => {
    const newSet = new Set(expanded);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpanded(newSet);
  };

  const renderNode = (node: TreeNode, level: number = 0) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expanded.has(node.id);
    const isRoot = level === 0;

    return (
      <div key={node.id} className="mb-2">
        <Card className={`${isRoot ? "border-brand-primary/30 bg-brand-primary/5" : "border-border/50"} hover:shadow-md transition`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(node.id)}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              ) : (
                <div className="w-6" />
              )}

              <Avatar className={`${isRoot ? "w-12 h-12 border-2 border-brand-primary" : "w-10 h-10"}`}>
                <AvatarFallback className={`${isRoot ? "bg-brand-primary text-white" : "bg-brand-primary/10 text-brand-primary"} font-semibold`}>
                  {node.full_name?.[0] || "?"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`font-semibold ${isRoot ? "text-brand-primary" : ""}`}>{node.full_name}</p>
                  {isRoot && <Crown className="w-4 h-4 text-amber-500" />}
                  {hasChildren && (
                    <Badge className="bg-brand-primary/10 text-brand-primary border-0 text-[10px]">
                      {node.children.length}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {node.job_title} — {node.department}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono">{node.employee_code}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {isExpanded && hasChildren && (
          <div className={lang === "ar" ? "mr-8 mt-2 border-r-2 border-brand-primary/20 pr-4" : "ml-8 mt-2 border-l-2 border-brand-primary/20 pl-4"}>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const totalEmployees = (nodes: TreeNode[]): number => {
    let count = nodes.length;
    nodes.forEach(n => count += totalEmployees(n.children));
    return count;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{d.orgChartTitle}</h1>
          <p className="text-muted-foreground mt-1">{d.orgChartDesc}</p>
        </div>

        <div className="flex items-center gap-2 bg-brand-primary/10 rounded-lg px-4 py-2">
          <Users className="w-5 h-5 text-brand-primary" />
          <div>
            <div className="text-xs text-muted-foreground">{d.totalEmployees}</div>
            <div className="text-lg font-bold text-brand-primary">
              {loading ? "..." : totalEmployees(tree)}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : tree.length === 0 ? (
        <Card>
          <CardContent className="py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 mx-auto">
              <GitBranch className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="font-medium">{lang === "ar" ? "لا يوجد بيانات" : "No data"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tree.map(root => renderNode(root))}
        </div>
      )}
    </div>
  );
}
