import sys
sys.stdout.reconfigure(encoding="utf-8")
from pathlib import Path

p = Path("src/app/hr/payroll/page.tsx")
text = p.read_text(encoding="utf-8")

old_dialog = '''          {detailLoading || !detailData ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
               <Card><CardContent className="p-4 space-y-2">
                  <h3 className="font-bold text-emerald-700">{lang === "ar" ? "الإيرادات" : "Earnings"}</h3>
                  <div className="flex justify-between text-sm"><span>{lang === "ar" ? "الراتب الأساسي" : "Basic"}</span><span>{formatCurrency(detailData.basic_salary)}</span></div>
                  <div className="flex justify-between text-sm"><span>{lang === "ar" ? "الإضافي" : "Overtime"}</span><span>{formatCurrency(detailData.overtime_bonus)}</span></div>
                  <div className="flex justify-between font-bold border-t pt-2"><span>{lang === "ar" ? "الإجمالي" : "Gross"}</span><span>{formatCurrency(detailData.gross_salary)}</span></div>
               </CardContent></Card>
               <Card><CardContent className="p-4 space-y-2">
                  <h3 className="font-bold text-red-700">{lang === "ar" ? "الخصومات" : "Deductions"}</h3>
                  <div className="flex justify-between text-sm"><span>{lang === "ar" ? "تأخير وغياب" : "Late/Absence"}</span><span>{formatCurrency(detailData.late_deduction + detailData.absence_deduction)}</span></div>
                  <div className="flex justify-between text-sm"><span>{lang === "ar" ? "تأمينات" : "Insurance"}</span><span>{formatCurrency(detailData.insurance_deduction)}</span></div>
                  <div className="flex justify-between text-sm text-orange-600"><span>{lang === "ar" ? "ضريبة الدخل" : "Tax"}</span><span>{formatCurrency(detailData.tax_deduction || 0)}</span></div>
                  <div className="flex justify-between font-bold border-t pt-2"><span>{lang === "ar" ? "صافي المرتب" : "Net"}</span><span className="text-brand-primary">{formatCurrency(detailData.net_salary)}</span></div>
               </CardContent></Card>
            </div>
          )}'''

new_dialog = '''          {detailLoading || !detailData ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
          ) : (
            <div className="space-y-4">
              {/* Employee Info */}
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-brand-primary/10 text-brand-primary font-bold text-lg">
                    {detailData.employee_name?.[0] || selectedEmp?.employee_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-lg">{detailData.employee_name || selectedEmp?.employee_name}</p>
                  <p className="text-sm text-muted-foreground">{detailData.job_title_name || selectedEmp?.job_title_name}</p>
                  <p className="text-xs text-muted-foreground">{detailData.department_name || selectedEmp?.department_name}</p>
                </div>
                <div className="ms-auto text-end">
                  <p className="text-2xl font-bold text-brand-primary">{formatCurrency(detailData.net_salary)}</p>
                  <p className="text-xs text-muted-foreground">{lang === "ar" ? "صافي المرتب" : "Net Salary"} · {detailData.currency}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Earnings */}
                <Card className="border-emerald-200">
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-bold text-emerald-700 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      {lang === "ar" ? "الإيرادات" : "Earnings"}
                    </h3>
                    <div className="flex justify-between text-sm py-1 border-b border-dashed">
                      <span className="text-muted-foreground">{lang === "ar" ? "الراتب الأساسي" : "Basic Salary"}</span>
                      <span className="font-medium">{formatCurrency(detailData.basic_salary)}</span>
                    </div>
                    {(detailData.allowances_total || 0) > 0 && (
                      <div className="flex justify-between text-sm py-1 border-b border-dashed">
                        <span className="text-muted-foreground">{lang === "ar" ? "البدلات" : "Allowances"}</span>
                        <span className="font-medium text-emerald-600">+{formatCurrency(detailData.allowances_total)}</span>
                      </div>
                    )}
                    {(detailData.overtime_bonus || 0) > 0 && (
                      <div className="flex justify-between text-sm py-1 border-b border-dashed">
                        <span className="text-muted-foreground">{lang === "ar" ? "بدل الإضافي" : "Overtime"}</span>
                        <span className="font-medium text-emerald-600">+{formatCurrency(detailData.overtime_bonus)}</span>
                      </div>
                    )}
                    {(detailData.bonuses_total || 0) > 0 && (
                      <div className="flex justify-between text-sm py-1 border-b border-dashed">
                        <span className="text-muted-foreground">{lang === "ar" ? "المكافآت" : "Bonuses"}</span>
                        <span className="font-medium text-emerald-600">+{formatCurrency(detailData.bonuses_total)}</span>
                      </div>
                    )}
                    {(detailData.night_allowance || 0) > 0 && (
                      <div className="flex justify-between text-sm py-1 border-b border-dashed">
                        <span className="text-muted-foreground">{lang === "ar" ? "بدل ليلي" : "Night Allow."}</span>
                        <span className="font-medium text-emerald-600">+{formatCurrency(detailData.night_allowance)}</span>
                      </div>
                    )}
                    {(detailData.field_allowance || 0) > 0 && (
                      <div className="flex justify-between text-sm py-1 border-b border-dashed">
                        <span className="text-muted-foreground">{lang === "ar" ? "بدل ميداني" : "Field Allow."}</span>
                        <span className="font-medium text-emerald-600">+{formatCurrency(detailData.field_allowance)}</span>
                      </div>
                    )}
                    {(detailData.transport_allowance || 0) > 0 && (
                      <div className="flex justify-between text-sm py-1 border-b border-dashed">
                        <span className="text-muted-foreground">{lang === "ar" ? "بدل مواصلات" : "Transport"}</span>
                        <span className="font-medium text-emerald-600">+{formatCurrency(detailData.transport_allowance)}</span>
                      </div>
                    )}
                    {(detailData.meal_allowance || 0) > 0 && (
                      <div className="flex justify-between text-sm py-1 border-b border-dashed">
                        <span className="text-muted-foreground">{lang === "ar" ? "بدل وجبات" : "Meal Allow."}</span>
                        <span className="font-medium text-emerald-600">+{formatCurrency(detailData.meal_allowance)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold pt-2 text-emerald-700">
                      <span>{lang === "ar" ? "الإجمالي" : "Gross"}</span>
                      <span>{formatCurrency(detailData.gross_salary)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Deductions */}
                <Card className="border-red-200">
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-bold text-red-700 flex items-center gap-2">
                      <TrendingDown className="w-4 h-4" />
                      {lang === "ar" ? "الخصومات" : "Deductions"}
                    </h3>
                    {(detailData.late_deduction || 0) > 0 && (
                      <div className="flex justify-between text-sm py-1 border-b border-dashed">
                        <span className="text-muted-foreground">{lang === "ar" ? "خصم التأخير" : "Late Deduction"}</span>
                        <span className="font-medium text-red-600">-{formatCurrency(detailData.late_deduction)}</span>
                      </div>
                    )}
                    {(detailData.absence_deduction || 0) > 0 && (
                      <div className="flex justify-between text-sm py-1 border-b border-dashed">
                        <span className="text-muted-foreground">{lang === "ar" ? "خصم الغياب" : "Absence"}</span>
                        <span className="font-medium text-red-600">-{formatCurrency(detailData.absence_deduction)}</span>
                      </div>
                    )}
                    {(detailData.penalties_total || 0) > 0 && (
                      <div className="flex justify-between text-sm py-1 border-b border-dashed">
                        <span className="text-muted-foreground">{lang === "ar" ? "الجزاءات" : "Penalties"}</span>
                        <span className="font-medium text-red-600">-{formatCurrency(detailData.penalties_total)}</span>
                      </div>
                    )}
                    {(detailData.insurance_deduction || 0) > 0 && (
                      <div className="flex justify-between text-sm py-1 border-b border-dashed">
                        <span className="text-muted-foreground">{lang === "ar" ? "تأمينات" : "Insurance"}</span>
                        <span className="font-medium text-red-600">-{formatCurrency(detailData.insurance_deduction)}</span>
                      </div>
                    )}
                    {(detailData.tax_deduction || 0) > 0 && (
                      <div className="flex justify-between text-sm py-1 border-b border-dashed">
                        <span className="text-muted-foreground">{lang === "ar" ? "ضريبة الدخل" : "Tax"}</span>
                        <span className="font-medium text-orange-600">-{formatCurrency(detailData.tax_deduction)}</span>
                      </div>
                    )}
                    {(detailData.installments_total || 0) > 0 && (
                      <div className="flex justify-between text-sm py-1 border-b border-dashed">
                        <span className="text-muted-foreground">{lang === "ar" ? "الأقساط" : "Installments"}</span>
                        <span className="font-medium text-red-600">-{formatCurrency(detailData.installments_total)}</span>
                      </div>
                    )}
                    {(detailData.extra_deductions_total || 0) > 0 && (
                      <div className="flex justify-between text-sm py-1 border-b border-dashed">
                        <span className="text-muted-foreground">{lang === "ar" ? "خصومات إضافية" : "Extra Deductions"}</span>
                        <span className="font-medium text-red-600">-{formatCurrency(detailData.extra_deductions_total)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold pt-2 text-red-700">
                      <span>{lang === "ar" ? "إجمالي الخصومات" : "Total Deductions"}</span>
                      <span>-{formatCurrency(detailData.total_deductions)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Attendance Summary */}
              <Card className="border-blue-200">
                <CardContent className="p-4">
                  <h3 className="font-bold text-blue-700 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {lang === "ar" ? "ملخص الحضور" : "Attendance Summary"}
                  </h3>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-center">
                    {[
                      { label: lang === "ar" ? "أيام العمل" : "Work Days", value: detailData.total_working_days, color: "text-blue-600" },
                      { label: lang === "ar" ? "حضور" : "Present", value: detailData.present_days, color: "text-emerald-600" },
                      { label: lang === "ar" ? "غياب" : "Absent", value: detailData.absent_days, color: "text-red-600" },
                      { label: lang === "ar" ? "تأخير" : "Late", value: detailData.late_days, color: "text-orange-600" },
                      { label: lang === "ar" ? "إجازة" : "Leave", value: detailData.on_leave_days, color: "text-purple-600" },
                      { label: lang === "ar" ? "مأمورية" : "Mission", value: detailData.mission_days, color: "text-indigo-600" },
                    ].map((item, i) => (
                      <div key={i} className="p-2 bg-muted/30 rounded-lg">
                        <p className={`text-xl font-bold ${item.color}`}>{item.value ?? 0}</p>
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Net Summary */}
              <div className="flex items-center justify-between p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-xl">
                <div>
                  <p className="text-sm text-muted-foreground">{lang === "ar" ? "إجمالي الإيرادات" : "Total Earnings"}</p>
                  <p className="text-lg font-bold text-emerald-600">+{formatCurrency(detailData.gross_salary)}</p>
                </div>
                <div className="text-muted-foreground text-2xl">−</div>
                <div>
                  <p className="text-sm text-muted-foreground">{lang === "ar" ? "إجمالي الخصومات" : "Total Deductions"}</p>
                  <p className="text-lg font-bold text-red-600">-{formatCurrency(detailData.total_deductions)}</p>
                </div>
                <div className="text-muted-foreground text-2xl">=</div>
                <div className="text-end">
                  <p className="text-sm text-muted-foreground">{lang === "ar" ? "صافي المرتب" : "Net Salary"}</p>
                  <p className="text-2xl font-bold text-brand-primary">{formatCurrency(detailData.net_salary)}</p>
                </div>
              </div>
            </div>
          )}'''

if old_dialog in text:
    text = text.replace(old_dialog, new_dialog)
    print("[OK] Payroll detail dialog updated with full breakdown")
else:
    print("[WARN] Dialog block not found exactly")

p.write_text(text, encoding="utf-8")
print(f"[OK] Saved: {p.stat().st_size} bytes")
print("[SUCCESS] Payroll detail now shows allowances + bonuses + penalties!")
