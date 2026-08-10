import sys
sys.stdout.reconfigure(encoding="utf-8")
from pathlib import Path

p = Path("src/app/hr/policies/page.tsx")
text = p.read_text(encoding="utf-8")

# 1) نضيف الحقول الجديدة في WorkPolicy interface
old_interface = """interface WorkPolicy {
  work_sunday: boolean;
  work_monday: boolean;
  work_tuesday: boolean;
  work_wednesday: boolean;
  work_thursday: boolean;
  work_friday: boolean;
  work_saturday: boolean;
  is_24_7: boolean;
}"""

new_interface = """interface WorkPolicy {
  work_sunday: boolean;
  work_monday: boolean;
  work_tuesday: boolean;
  work_wednesday: boolean;
  work_thursday: boolean;
  work_friday: boolean;
  work_saturday: boolean;
  is_24_7: boolean;
  attendance_trigger_mode?: string;
  pre_shift_checkin_window?: number;
  require_live_location?: boolean;
  location_loss_action?: string;
  location_loss_grace_minutes?: number;
}"""

if old_interface in text:
    text = text.replace(old_interface, new_interface)
    print("[OK] WorkPolicy interface updated")

# 2) نضيف Smart Attendance Section قبل زرار الحفظ
old_save_btn = """                <div className="pt-4 border-t flex justify-end">
                  <Button onClick={saveWorkPolicy} disabled={saving}
                    className="gap-2 bg-brand-primary hover:bg-brand-secondary">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {ar ? "حفظ السياسة" : "Save Policy"}
                  </Button>
                </div>"""

new_save_btn = """                {/* Smart Attendance Section */}
                <div className="border-t pt-4 space-y-4">
                  <p className="font-semibold flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">⚡</span>
                    {ar ? "إعدادات الحضور الذكي" : "Smart Attendance Settings"}
                  </p>

                  {/* Trigger Mode */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{ar ? "طريقة تسجيل الحضور" : "Check-in Trigger Mode"}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        { value: "manual", label_ar: "يدوي فقط", label_en: "Manual Only", desc_ar: "الموظف يفتح التطبيق ويضغط تسجيل حضور", desc_en: "Employee opens app and taps check-in", icon: "👆", color: "border-blue-400 bg-blue-50" },
                        { value: "notification", label_ar: "إشعار ذكي", label_en: "Smart Notification", desc_ar: "يوصله إشعار لما يدخل النطاق ويضغط للتأكيد", desc_en: "Gets notified when in range, taps to confirm", icon: "🔔", color: "border-green-400 bg-green-50" },
                        { value: "auto", label_ar: "تسجيل تلقائي", label_en: "Fully Automatic", desc_ar: "يتسجل لوحده بدون ما يفتح التطبيق", desc_en: "Registers automatically without opening app", icon: "🤖", color: "border-purple-400 bg-purple-50" },
                      ].map(mode => {
                        const isActive = (workPolicy.attendance_trigger_mode || "notification") === mode.value;
                        return (
                          <button
                            key={mode.value}
                            onClick={() => setWorkPolicy({ ...workPolicy, attendance_trigger_mode: mode.value })}
                            className={`p-4 rounded-xl border-2 text-start transition ${isActive ? mode.color + " border-2" : "border-border hover:border-brand-primary/30"}`}
                          >
                            <div className="text-2xl mb-2">{mode.icon}</div>
                            <p className="font-semibold text-sm">{ar ? mode.label_ar : mode.label_en}</p>
                            <p className="text-xs text-muted-foreground mt-1">{ar ? mode.desc_ar : mode.desc_en}</p>
                            {mode.value === "auto" && isActive && (
                              <div className="mt-2 text-xs text-orange-600 bg-orange-50 rounded p-2 border border-orange-200">
                                ⚠️ {ar ? "قد يتم التسجيل عند المرور بالقرب من موقع العمل فقط" : "May register when passing near work location"}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pre-shift window */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">{ar ? "السماح بالحضور قبل الشيفت بـ (دقيقة)" : "Allow check-in before shift (minutes)"}</p>
                      <div className="flex items-center gap-3">
                        <input
                          type="range" min={0} max={60} step={5}
                          value={workPolicy.pre_shift_checkin_window ?? 15}
                          onChange={e => setWorkPolicy({ ...workPolicy, pre_shift_checkin_window: Number(e.target.value) })}
                          className="flex-1"
                        />
                        <span className="text-brand-primary font-bold w-10 text-center">
                          {workPolicy.pre_shift_checkin_window ?? 15}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {ar ? `الموظف يقدر يسجل حضوره قبل الشيفت بـ ${workPolicy.pre_shift_checkin_window ?? 15} دقيقة فقط` : `Employee can check-in ${workPolicy.pre_shift_checkin_window ?? 15} min before shift`}
                      </p>
                    </div>

                    {/* Location loss grace */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">{ar ? "دقائق سماح قبل اعتبار الموقع مفقوداً" : "Grace minutes before location considered lost"}</p>
                      <div className="flex items-center gap-3">
                        <input
                          type="range" min={1} max={30} step={1}
                          value={workPolicy.location_loss_grace_minutes ?? 5}
                          onChange={e => setWorkPolicy({ ...workPolicy, location_loss_grace_minutes: Number(e.target.value) })}
                          className="flex-1"
                        />
                        <span className="text-brand-primary font-bold w-10 text-center">
                          {workPolicy.location_loss_grace_minutes ?? 5}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Require live location + Loss action */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 rounded-xl border-2 border-border">
                      <div>
                        <p className="font-medium text-sm">{ar ? "الموقع مطلوب بعد الحضور" : "Require location after check-in"}</p>
                        <p className="text-xs text-muted-foreground mt-1">{ar ? "للموظفين الميدانيين خصوصاً" : "Especially for field workers"}</p>
                      </div>
                      <button
                        onClick={() => setWorkPolicy({ ...workPolicy, require_live_location: !(workPolicy.require_live_location ?? true) })}
                        className={`relative w-12 h-6 rounded-full transition ${(workPolicy.require_live_location ?? true) ? "bg-brand-primary" : "bg-slate-300"}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${(workPolicy.require_live_location ?? true) ? (ar ? "right-1" : "left-6") : (ar ? "right-6" : "left-1")}`} />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">{ar ? "إجراء عند فقد الموقع بعد الحضور" : "Action when location lost after check-in"}</p>
                      <select
                        value={workPolicy.location_loss_action ?? "alert_only"}
                        onChange={e => setWorkPolicy({ ...workPolicy, location_loss_action: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                      >
                        <option value="ignore">{ar ? "تجاهل" : "Ignore"}</option>
                        <option value="alert_only">{ar ? "تنبيه الإدارة فقط" : "Alert management only"}</option>
                        <option value="record_violation">{ar ? "تسجيل مخالفة تتبع" : "Record tracking violation"}</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-end">
                  <Button onClick={saveWorkPolicy} disabled={saving}
                    className="gap-2 bg-brand-primary hover:bg-brand-secondary">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {ar ? "حفظ السياسة" : "Save Policy"}
                  </Button>
                </div>"""

if old_save_btn in text:
    text = text.replace(old_save_btn, new_save_btn)
    print("[OK] Smart Attendance section added to work policy tab")
else:
    print("[WARN] Save button block not found")

p.write_text(text, encoding="utf-8")
print(f"[OK] Saved: {p.stat().st_size} bytes")
print("[SUCCESS] Smart Attendance Policy UI ready!")
