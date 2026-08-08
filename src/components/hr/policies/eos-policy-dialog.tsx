'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Calculator, Award } from 'lucide-react';

interface EosTier {
  from_year: number;
  to_year: number | null;
  months_per_year: number;
}

interface EosReasonRate {
  reason: string;
  rate: number;
  label: string;
}

const REASON_LABELS: Record<string, string> = {
  resignation: 'استقالة',
  termination: 'إنهاء من الشركة',
  death: 'وفاة',
  disability: 'عجز',
  retirement: 'تقاعد',
  mutual_agreement: 'اتفاق مشترك',
};

const DEFAULT_TIERS: EosTier[] = [
  { from_year: 1, to_year: 5, months_per_year: 1.0 },
  { from_year: 5, to_year: 10, months_per_year: 1.5 },
  { from_year: 10, to_year: null, months_per_year: 2.0 },
];

const DEFAULT_REASONS: EosReasonRate[] = [
  { reason: 'resignation',      rate: 50,  label: 'استقالة' },
  { reason: 'termination',      rate: 100, label: 'إنهاء من الشركة' },
  { reason: 'death',            rate: 100, label: 'وفاة' },
  { reason: 'disability',       rate: 100, label: 'عجز' },
  { reason: 'retirement',       rate: 100, label: 'تقاعد' },
  { reason: 'mutual_agreement', rate: 75,  label: 'اتفاق مشترك' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  existing?: any;
}

export default function EosPolicyDialog({ open, onClose, onSaved, existing }: Props) {
  const [name, setName]                       = useState('سياسة مكافأة نهاية الخدمة');
  const [salaryBase, setSalaryBase]           = useState('last_basic');
  const [includeAllowances, setIncludeAllowances] = useState(false);
  const [minYears, setMinYears]               = useState(1);
  const [tiers, setTiers]                     = useState<EosTier[]>(DEFAULT_TIERS);
  const [reasons, setReasons]                 = useState<EosReasonRate[]>(DEFAULT_REASONS);
  const [changeReason, setChangeReason]       = useState('');
  const [saving, setSaving]                   = useState(false);

  // Calculator
  const [calcYears, setCalcYears]   = useState('');
  const [calcSalary, setCalcSalary] = useState('');
  const [calcReason, setCalcReason] = useState('termination');
  const [calcResult, setCalcResult] = useState<any>(null);
  const [showCalc, setShowCalc]     = useState(false);

  useEffect(() => {
    if (existing) {
      setName(existing.name || '');
      setSalaryBase(existing.salary_base_type || 'last_basic');
      setIncludeAllowances(existing.include_allowances || false);
      setMinYears(existing.min_service_months ? Math.round(existing.min_service_months / 12) : 1);
      setTiers(existing.service_tiers || DEFAULT_TIERS);
      setReasons(
        Object.entries(existing.termination_adjustments || {}).map(([reason, rate]) => ({
          reason,
          rate: rate as number,
          label: REASON_LABELS[reason] || reason,
        }))
      );
    } else {
      setName('سياسة مكافأة نهاية الخدمة');
      setSalaryBase('last_basic');
      setIncludeAllowances(false);
      setMinYears(1);
      setTiers(DEFAULT_TIERS);
      setReasons(DEFAULT_REASONS);
    }
    setCalcResult(null);
    setShowCalc(false);
  }, [existing, open]);

  const addTier = () => {
    const last = tiers[tiers.length - 1];
    const fromYear = last ? (last.to_year ?? 20) : 1;
    setTiers([...tiers, { from_year: fromYear, to_year: null, months_per_year: 1.0 }]);
  };

  const removeTier = (i: number) => setTiers(tiers.filter((_, idx) => idx !== i));

  const updateTier = (i: number, field: keyof EosTier, value: any) => {
    setTiers(tiers.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)));
  };

  const updateReason = (reason: string, rate: number) => {
    setReasons(reasons.map((r) => (r.reason === reason ? { ...r, rate } : r)));
  };

  const runCalc = async () => {
    if (!calcYears || !calcSalary) return;
    try {
      const res = await fetch('/api/hr/policies/eos/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          years_of_service:    parseFloat(calcYears),
          monthly_salary:      parseFloat(calcSalary),
          termination_reason:  calcReason,
          service_tiers:       tiers,
          termination_adjustments: Object.fromEntries(reasons.map((r) => [r.reason, r.rate])),
          min_service_months:  minYears * 12,
        }),
      });
      const data = await res.json();
      setCalcResult(data);
    } catch {
      setCalcResult({ error: 'خطأ في الحساب' });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const reasonRates = Object.fromEntries(reasons.map((r) => [r.reason, r.rate]));
      const payload = {
        name,
        salary_base_type:        salaryBase,
        include_allowances:      includeAllowances,
        min_service_months:      minYears * 12,
        service_tiers:           tiers.map(t => ({ from_year: t.from_year, to_year: t.to_year, months_per_year: t.months_per_year })),
        termination_adjustments: reasonRates,
        change_reason:           changeReason || 'تحديث السياسة',
      };

      const url    = existing ? `/api/hr/policies/eos/${existing.id}` : '/api/hr/policies/eos';
      const method = existing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (res.ok) { onSaved(); onClose(); }
      else { const err = await res.json(); alert(JSON.stringify(err)); }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Award className="w-5 h-5 text-amber-600" />
            {existing ? 'تعديل سياسة مكافأة نهاية الخدمة' : 'إنشاء سياسة مكافأة نهاية الخدمة'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">

          {/* اسم السياسة */}
          <div className="space-y-1">
            <Label>اسم السياسة</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {/* إعدادات أساسية */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>أساس حساب المرتب</Label>
              <Select value={salaryBase} onValueChange={(v: any) => setSalaryBase(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_basic">آخر راتب أساسي</SelectItem>
                  <SelectItem value="last_gross">آخر راتب إجمالي</SelectItem>
                  <SelectItem value="avg_3_months">متوسط آخر 3 شهور</SelectItem>
                  <SelectItem value="avg_12_months">متوسط آخر 12 شهر</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>الحد الأدنى لسنوات الخدمة</Label>
              <Input
                type="number" min={0} value={minYears}
                onChange={(e) => setMinYears(Number(e.target.value))}
              />
              <p className="text-xs text-gray-400">أقل من هذا لا يستحق مكافأة</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Switch checked={includeAllowances} onCheckedChange={setIncludeAllowances} />
            <div>
              <p className="text-sm font-medium">تشمل البدلات في أساس الحساب</p>
              <p className="text-xs text-gray-400">إذا مفعّل، تُضاف البدلات للمرتب الأساسي في الحساب</p>
            </div>
          </div>

          {/* شرائح الخدمة */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold">شرائح المكافأة (بالسنوات)</Label>
              <Button variant="outline" size="sm" onClick={addTier}>
                <Plus className="w-4 h-4 ml-1" />
                إضافة شريحة
              </Button>
            </div>
            <div className="space-y-2">
              {tiers.map((tier, i) => (
                <div key={i} className="grid grid-cols-4 gap-2 items-center p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">من سنة</Label>
                    <Input type="number" min={0} value={tier.from_year}
                      onChange={(e) => updateTier(i, 'from_year', Number(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">إلى سنة</Label>
                    <Input type="number" min={0} placeholder="لا نهاية"
                      value={tier.to_year ?? ''}
                      onChange={(e) => updateTier(i, 'to_year', e.target.value ? Number(e.target.value) : null)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">شهر / سنة خدمة</Label>
                    <Input type="number" min={0} step={0.5} value={tier.months_per_year}
                      onChange={(e) => updateTier(i, 'months_per_year', Number(e.target.value))} />
                  </div>
                  <div className="flex justify-end pt-5">
                    <Button variant="ghost" size="icon" onClick={() => removeTier(i)}
                      disabled={tiers.length <= 1} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* نسب أسباب الإنهاء */}
          <div>
            <Label className="text-base font-semibold mb-3 block">نسبة المكافأة حسب سبب الإنهاء</Label>
            <div className="grid grid-cols-2 gap-3">
              {reasons.map((r) => (
                <div key={r.reason} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{r.label}</p>
                  </div>
                  <div className="flex items-center gap-1 w-28">
                    <Input type="number" min={0} max={100} value={r.rate}
                      onChange={(e) => updateReason(r.reason, Number(e.target.value))}
                      className="text-center" />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* حاسبة تجريبية */}
          <div className="border rounded-lg overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-3 bg-amber-50 hover:bg-amber-100 transition-colors"
              onClick={() => setShowCalc(!showCalc)}
            >
              <span className="flex items-center gap-2 font-medium text-amber-700">
                <Calculator className="w-4 h-4" />
                حاسبة تجريبية
              </span>
              <span className="text-amber-500 text-sm">{showCalc ? 'إخفاء' : 'إظهار'}</span>
            </button>

            {showCalc && (
              <div className="p-4 space-y-3 bg-white">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">سنوات الخدمة</Label>
                    <Input type="number" placeholder="7" value={calcYears}
                      onChange={(e) => setCalcYears(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">المرتب الشهري (EGP)</Label>
                    <Input type="number" placeholder="10000" value={calcSalary}
                      onChange={(e) => setCalcSalary(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">سبب الإنهاء</Label>
                    <Select value={calcReason} onValueChange={setCalcReason}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {reasons.map((r) => (
                          <SelectItem key={r.reason} value={r.reason}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={runCalc} size="sm" className="bg-amber-600 hover:bg-amber-700">
                  <Calculator className="w-4 h-4 ml-1" />
                  احسب
                </Button>

                {calcResult && !calcResult.error && (
                  <div className="mt-3 p-3 bg-amber-50 rounded-lg grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xs text-gray-500">إجمالي الأشهر المستحقة</p>
                      <p className="text-lg font-bold text-amber-700">
                        {calcResult.total_months_earned?.toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">المكافأة الإجمالية</p>
                      <p className="text-lg font-bold text-amber-700">
                        {calcResult.gross_benefit?.toLocaleString()} EGP
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">بعد تطبيق نسبة السبب</p>
                      <p className="text-xl font-bold text-green-600">
                        {calcResult.final_benefit?.toLocaleString()} EGP
                      </p>
                    </div>
                  </div>
                )}

                {calcResult?.error && (
                  <p className="text-red-500 text-sm">{calcResult.error}</p>
                )}
              </div>
            )}
          </div>

          {/* سبب التغيير */}
          {existing && (
            <div className="space-y-1">
              <Label>سبب التعديل (للسجل)</Label>
              <Input placeholder="مثال: تحديث نسب 2025" value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)} />
            </div>
          )}

        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave} disabled={saving}
            className="bg-amber-600 hover:bg-amber-700">
            {saving ? 'جارٍ الحفظ...' : existing ? 'حفظ التعديلات' : 'إنشاء السياسة'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
