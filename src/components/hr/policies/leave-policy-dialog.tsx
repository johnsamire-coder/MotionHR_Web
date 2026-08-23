"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Calendar, Save, Loader2, Info, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { STORAGE_KEYS } from "@/lib/constants/config";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  policyId: number | null;
  ar: boolean;
}


interface LeaveTier {
  from_months: number;
  to_months: number | null;
  annual_entitlement_days: number;
  description?: string;
}

interface LeavePolicy {
  id?: number;
  name: string;
  effective_from: string;
  effective_to: string;
  status: string;
  notes: string;
  annual_days: number;
  sick_days: number;
  casual_days: number;
  maternity_days: number;
  paternity_days: number;
  unpaid_allowed: boolean;
  carry_forward_enabled: boolean;
  max_carry_forward_days: number;
  tiers?: LeaveTier[];
}

const EMPTY: LeavePolicy = {
  name: "",
  effective_from: new Date().toISOString().split("T")[0],
  effective_to: "",
  status: "draft",
  notes: "",
  annual_days: 21,
  sick_days: 14,
  casual_days: 7,
  maternity_days: 90,
  paternity_days: 3,
  unpaid_allowed: true,
  carry_forward_enabled: false,
  max_carry_forward_days: 0,
  tiers: [
    { from_months: 0, to_months: 3, annual_entitlement_days: 0, description: "فترة الاختبار (أول 3 شهور)" },
    { from_months: 4, to_months: 6, annual_entitlement_days: 6, description: "من الشهر 4 إلى 6" },
    { from_months: 7, to_months: null, annual_entitlement_days: 21, description: "بعد 6 شهور (الرصيد السنوي الكامل)" },
  ],
};

export default function LeavePolicyDialog({ open, onClose, onSaved, policyId, ar }: Props) {
  const [form, setForm] = useState<LeavePolicy>({ ...EMPTY });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const addTier = () => {
    setForm(p => {
      const currentTiers = p.tiers || [];
      const lastTier = currentTiers[currentTiers.length - 1];
      const nextFrom = lastTier ? (lastTier.to_months ? lastTier.to_months + 1 : 12) : 0;
      return {
        ...p,
        tiers: [
          ...currentTiers,
          { from_months: nextFrom, to_months: null, annual_entitlement_days: 21, description: "" }
        ]
      };
    });
  };

  const removeTier = (index: number) => {
    setForm(p => ({
      ...p,
      tiers: (p.tiers || []).filter((_, i) => i !== index)
    }));
  };

  const updateTier = (index: number, key: keyof LeaveTier, val: any) => {
    setForm(p => ({
      ...p,
      tiers: (p.tiers || []).map((t, i) => i === index ? { ...t, [key]: val } : t)
    }));
  };


  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) : null;
  const authH = token?.startsWith("Token") ? token : `Token ${token}`;

  useEffect(() => {
    if (!open) return;
    if (policyId) {
      loadPolicy(policyId);
    } else {
      setForm({ ...EMPTY });
    }
  }, [open, policyId]);

  const loadPolicy = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hr/policies/leave-policy/${id}`, {
        headers: { Authorization: authH },
      });
      const data = await res.json();
      if (data.policy) {
        setForm({
          ...EMPTY,
          ...data.policy,
          effective_to: data.policy.effective_to || "",
        });
      }
    } catch {
      toast.error(ar ? "فشل التحميل" : "Load failed");
    } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error(ar ? "الاسم مطلوب" : "Name required");
      return;
    }
    setSaving(true);
    try {
      const url = policyId ? `/api/hr/policies/leave-policy/${policyId}` : "/api/hr/policies/leave-policy";
      const method = policyId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { Authorization: authH, "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          effective_to: form.effective_to || null,
          annual_days: Number(form.annual_days),
          sick_days: Number(form.sick_days),
          casual_days: Number(form.casual_days),
          maternity_days: Number(form.maternity_days),
          paternity_days: Number(form.paternity_days),
          max_carry_forward_days: Number(form.max_carry_forward_days),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        toast.success(policyId ? (ar ? "تم التحديث ✅" : "Updated ✅") : (ar ? "تم الإنشاء ✅" : "Created ✅"));
        onSaved(); onClose();
      } else {
        toast.error(data.error || data.message || (ar ? "فشل" : "Failed"));
      }
    } catch { toast.error(ar ? "خطأ" : "Error"); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-primary" />
            {policyId ? (ar ? "تعديل سياسة الإجازات" : "Edit Leave Policy") : (ar ? "سياسة إجازات جديدة" : "New Leave Policy")}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {/* Basic Info */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">{ar ? "اسم السياسة *" : "Policy Name *"}</label>
                  <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">{ar ? "من" : "From"}</label>
                    <Input type="date" value={form.effective_from} onChange={e => setForm(p => ({ ...p, effective_from: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">{ar ? "إلى" : "To"}</label>
                    <Input type="date" value={form.effective_to} onChange={e => setForm(p => ({ ...p, effective_to: e.target.value }))} />
                  </div>
                </div>
              </div>

              {/* Days Balances */}
              <div className="p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-xl space-y-3">
                <p className="text-sm font-semibold text-brand-primary flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {ar ? "الأرصدة السنوية" : "Annual Balances"}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm mb-1 block">{ar ? "إجازة سنوية" : "Annual"}</label>
                    <Input type="number" value={form.annual_days} onChange={e => setForm(p => ({ ...p, annual_days: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="text-sm mb-1 block">{ar ? "إجازة مرضية" : "Sick"}</label>
                    <Input type="number" value={form.sick_days} onChange={e => setForm(p => ({ ...p, sick_days: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="text-sm mb-1 block">{ar ? "إجازة عارضة" : "Casual"}</label>
                    <Input type="number" value={form.casual_days} onChange={e => setForm(p => ({ ...p, casual_days: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="text-sm mb-1 block">{ar ? "إجازة أمومة" : "Maternity"}</label>
                    <Input type="number" value={form.maternity_days} onChange={e => setForm(p => ({ ...p, maternity_days: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="text-sm mb-1 block">{ar ? "إجازة أبوة" : "Paternity"}</label>
                    <Input type="number" value={form.paternity_days} onChange={e => setForm(p => ({ ...p, paternity_days: Number(e.target.value) }))} />
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg cursor-pointer">
                  <input type="checkbox" checked={form.unpaid_allowed} onChange={e => setForm(p => ({ ...p, unpaid_allowed: e.target.checked }))} className="w-4 h-4" />
                  <span className="text-sm">{ar ? "السماح بإجازات بدون مرتب" : "Allow unpaid leaves"}</span>
                </label>
                <label className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg cursor-pointer">
                  <input type="checkbox" checked={form.carry_forward_enabled} onChange={e => setForm(p => ({ ...p, carry_forward_enabled: e.target.checked }))} className="w-4 h-4" />
                  <span className="text-sm">{ar ? "ترحيل الرصيد المتبقي للسنة التالية" : "Carry forward to next year"}</span>
                </label>
                {form.carry_forward_enabled && (
                  <div>
                    <label className="text-sm mb-1 block">{ar ? "أقصى أيام للترحيل" : "Max carry forward days"}</label>
                    <Input type="number" value={form.max_carry_forward_days} onChange={e => setForm(p => ({ ...p, max_carry_forward_days: Number(e.target.value) }))} />
                  </div>
                )}
              </div>

              
              {/* Service Tenure Tiers */}
              <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Info className="w-4 h-4 text-brand-primary" />
                    <span>{ar ? "تدرج رصيد الإجازات حسب مدة الخدمة (بالأشهر)" : "Pro-rated Leave Accrual Tiers (by Months)"}</span>
                  </p>
                  <Button type="button" size="sm" variant="outline" onClick={addTier} className="h-7 text-xs">
                    {ar ? "+ إضافة شريحة" : "+ Add Tier"}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  {ar
                    ? "حدد الرصيد المستحق بناءً على تاريخ تعيين الموظف (مثال: أول 3 شهور = 0، من 4-6 شهور = 6، بعد 6 شهور = 21 يوم)."
                    : "Configure entitlement days based on tenure months from hire date."}
                </p>

                <div className="space-y-2 pt-1">
                  {(form.tiers || []).map((tier, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-background p-2.5 rounded-lg border border-border/60 text-xs">
                      <div className="flex items-center gap-1.5 flex-1">
                        <span className="text-muted-foreground whitespace-nowrap">{ar ? "من شهر:" : "From m:"}</span>
                        <Input
                          type="number"
                          className="h-8 text-xs w-16"
                          value={tier.from_months}
                          onChange={e => updateTier(idx, "from_months", Number(e.target.value))}
                        />
                      </div>

                      <div className="flex items-center gap-1.5 flex-1">
                        <span className="text-muted-foreground whitespace-nowrap">{ar ? "إلى شهر:" : "To m:"}</span>
                        <Input
                          type="number"
                          placeholder={ar ? "فأكثر" : "Infinity"}
                          className="h-8 text-xs w-16"
                          value={tier.to_months !== null && tier.to_months !== undefined ? tier.to_months : ""}
                          onChange={e => updateTier(idx, "to_months", e.target.value ? Number(e.target.value) : null)}
                        />
                      </div>

                      <div className="flex items-center gap-1.5 flex-1">
                        <span className="text-muted-foreground whitespace-nowrap">{ar ? "الرصيد:" : "Days:"}</span>
                        <Input
                          type="number"
                          step="0.5"
                          className="h-8 text-xs w-16 font-bold text-brand-primary"
                          value={tier.annual_entitlement_days}
                          onChange={e => updateTier(idx, "annual_entitlement_days", Number(e.target.value))}
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        onClick={() => removeTier(idx)}
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              </div>


              {/* Notes */}
              <div>
                <label className="text-sm font-medium mb-1 block">{ar ? "ملاحظات" : "Notes"}</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="w-full border rounded-md px-3 py-2 text-sm bg-background resize-none" />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t shrink-0">
              <Button onClick={handleSave} disabled={saving} className="flex-1 bg-brand-primary hover:bg-brand-secondary gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {ar ? "حفظ" : "Save"}
              </Button>
              <Button variant="outline" onClick={onClose} className="flex-1">{ar ? "إلغاء" : "Cancel"}</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
