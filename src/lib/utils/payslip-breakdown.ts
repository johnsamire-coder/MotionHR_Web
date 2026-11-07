// بنود كشف المرتب: نفس الترتيب ونفس الحساب اللي في تطبيق الموبايل
// (lib/services/payslip_breakdown.dart في MotionHR_Employee). لو اتعدل هنا يتعدل هناك.
// الأرقام كلها جاية من السيرفر (employee/payslip)، والملف ده بيرتبها بس.
// لو مجموع البنود مختلف عن الإجمالي اللي راجع من السيرفر، الفرق بيظهر في
// "استحقاقات أخرى" أو "خصومات أخرى"، عشان البنود تجمع دايمًا على الإجمالي.

export interface PayslipItem { name: string; amount: number }
export interface PayslipLine { key: string; label: string; amount: number; items: PayslipItem[] }
export interface PayslipBreakdown {
  earnings: PayslipLine[];
  gross: number;
  deductions: PayslipLine[];
  totalDeductions: number;
  net: number;
  companyInsurance: PayslipLine[];
  isFinal: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PayslipData = Record<string, any>;

export function payslipNum(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
}

const round2 = (v: number) => Math.round(v * 100) / 100;

function items(list: unknown, ar: boolean): PayslipItem[] {
  if (!Array.isArray(list)) return [];
  const out: PayslipItem[] = [];
  for (const it of list) {
    if (!it || typeof it !== "object") continue;
    const amount = payslipNum(it.amount);
    if (amount === 0) continue;
    const name = (ar ? it.name_ar : it.name_en) ?? it.name ?? "";
    out.push({ name: String(name), amount });
  }
  return out;
}

export function buildPayslipBreakdown(d: PayslipData, ar: boolean): PayslipBreakdown {
  const n = (k: string) => payslipNum(d[k]);
  const isFinal = d.is_final === true;
  const t = (a: string, e: string) => (ar ? a : e);

  // ─── الإيرادات ───
  const earnings: PayslipLine[] = [
    { key: "basic_salary", label: t("الراتب الأساسي", "Basic Salary"), amount: n("basic_salary"), items: [] },
  ];
  const addEarn = (key: string, label: string, its: PayslipItem[] = []) => {
    const v = n(key);
    if (v !== 0) earnings.push({ key, label, amount: v, items: its });
  };
  addEarn("allowances_total", t("البدلات", "Allowances"), items(d.allowance_items, ar));
  addEarn("overtime_bonus", t("الأوفر تايم", "Overtime"));
  addEarn("bonuses_total", t("المكافآت", "Bonuses"), items(d.bonus_items, ar));
  // لو المسير معتمد، الإجماليات من المسير، والبنود التفصيلية دي بتدخل في "استحقاقات أخرى"
  if (!isFinal) {
    addEarn("night_allowance", t("بدل الوردية الليلية", "Night Allowance"));
    addEarn("weekend_allowance", t("بدل العمل في يوم الراحة", "Weekend Allowance"));
    addEarn("rule_allowances_total", t("بدلات السياسات", "Policy Allowances"), items(d.rule_allowance_items, ar));
    addEarn("kpi_bonus", t("مكافأة الأداء", "KPI Bonus"));
  }
  const gross = n("gross_salary");
  const otherEarn = round2(gross - earnings.reduce((s, l) => s + l.amount, 0));
  if (otherEarn > 0.01) {
    earnings.push({ key: "other_earnings", label: t("استحقاقات أخرى", "Other Earnings"), amount: otherEarn, items: [] });
  }

  // ─── الخصومات ───
  const deductions: PayslipLine[] = [];
  const addDed = (key: string, label: string, its: PayslipItem[] = []) => {
    const v = n(key);
    if (v !== 0) deductions.push({ key, label, amount: v, items: its });
  };
  addDed("late_deduction", t("خصم التأخير", "Late Deduction"));
  addDed("absence_deduction", t("خصم الغياب", "Absence Deduction"));
  if (!isFinal) {
    addDed("early_leave_deduction", t("خصم الانصراف المبكر", "Early Leave Deduction"));
    addDed("unpaid_leave_deduction", t("إجازة بدون أجر", "Unpaid Leave"));
    addDed("missing_checkout_deduction", t("عدم تسجيل الانصراف", "Missing Check-out"));
    addDed("flex_shortage_deduction", t("نقص ساعات الشيفت المرن", "Flex Hours Shortage"));
    addDed("not_employed_deduction", t("أيام قبل التعيين أو بعد انتهاء الخدمة", "Days Outside Employment"));
  }
  const social = n("social_insurance_employee");
  const medical = n("medical_insurance_employee");
  const insurance = n("insurance_deduction");
  if (!isFinal && (social !== 0 || medical !== 0) && Math.abs(social + medical - insurance) < 0.02) {
    addDed("social_insurance_employee", t("تأمين اجتماعي (حصة الموظف)", "Social Insurance (Employee Share)"));
    addDed("medical_insurance_employee", t("تأمين طبي (حصة الموظف)", "Medical Insurance (Employee Share)"));
  } else {
    addDed("insurance_deduction", t("التأمينات", "Insurance"), items(d.insurance_items, ar));
  }
  addDed("tax_deduction", t("ضريبة الدخل", "Income Tax"));
  addDed("installments_total", t("الأقساط والسلف", "Installments & Loans"), items(d.installment_items, ar));
  addDed("penalties_total", t("الجزاءات", "Penalties"), items(d.penalty_items, ar));
  addDed("extra_deductions_total", t("خصومات إضافية", "Extra Deductions"), items(d.extra_deduction_items, ar));
  const totalDeductions = n("total_deductions");
  const otherDed = round2(totalDeductions - deductions.reduce((s, l) => s + l.amount, 0));
  if (otherDed > 0.01) {
    deductions.push({ key: "other_deductions", label: t("خصومات أخرى", "Other Deductions"), amount: otherDed, items: [] });
  }

  // ─── مساهمة الشركة في التأمينات (للعلم بس) ───
  const companyInsurance: PayslipLine[] = [];
  const addCo = (key: string, label: string) => {
    const v = n(key);
    if (v !== 0) companyInsurance.push({ key, label, amount: v, items: [] });
  };
  addCo("social_insurance_company", t("تأمين اجتماعي", "Social Insurance"));
  addCo("medical_insurance_company", t("تأمين طبي", "Medical Insurance"));
  addCo("total_company_insurance_contribution", t("الإجمالي", "Total"));

  return { earnings, gross, deductions, totalDeductions, net: n("net_salary"), companyInsurance, isFinal };
}

/** 2.5 -> "2 س 30 د" */
export function hoursText(v: unknown, ar: boolean): string {
  const x = payslipNum(v);
  const h = Math.floor(x);
  const m = Math.round((x - h) * 60);
  if (m === 0) return ar ? `${h} س` : `${h}h`;
  return ar ? `${h} س ${m} د` : `${h}h ${m}m`;
}
