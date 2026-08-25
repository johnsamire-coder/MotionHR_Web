import os

filePath = r'src/app/hr/shifts/page.tsx'

with open(filePath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. تحديث الـ Interface Shift
old_interface = 'grace_period?: number;'
new_interface = 'grace_period?: number;\n  early_checkin_minutes?: number;\n  late_checkout_minutes?: number;\n  late_checkout_allowed?: boolean;'

if old_interface in content and 'early_checkin_minutes?:' not in content:
    content = content.replace(old_interface, new_interface)

# 2. تحديث openEditDialog لتعبئة الخانتين عند التعديل
old_edit_state = 'grace_period: shift.grace_period || 15,'
new_edit_state = 'grace_period: shift.grace_period || 15,\n      early_checkin_minutes: shift.early_checkin_minutes ?? 30,\n      late_checkout_minutes: shift.late_checkout_minutes ?? 0,\n      late_checkout_allowed: shift.late_checkout_allowed ?? false,'

if old_edit_state in content and 'early_checkin_minutes: shift.early_checkin_minutes' not in content:
    content = content.replace(old_edit_state, new_edit_state)

# 3. زراعة الخانتين في JSX المودال تحت سماح التأخير مباشرة
old_jsx = '''              <div>
                <Label>{ar ? "سماح التأخير (دقائق):" : "Grace Period (min):"}</Label>
                <Input type="number" value={formData.grace_period} onChange={e => setFormData({ ...formData, grace_period: Number(e.target.value) })} />
              </div>
            </div>'''

new_jsx = '''              <div>
                <Label>{ar ? "سماح التأخير (دقائق):" : "Grace Period (min):"}</Label>
                <Input type="number" value={formData.grace_period} onChange={e => setFormData({ ...formData, grace_period: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <Label>{ar ? "سماحية الحضور المبكر (دقائق):" : "Early Check-in Grace (min):"}</Label>
                <Input type="number" value={formData.early_checkin_minutes ?? 30} onChange={e => setFormData({ ...formData, early_checkin_minutes: Number(e.target.value) })} />
              </div>
              <div>
                <Label>{ar ? "سماحية الانصراف المتأخر (دقائق):" : "Late Check-out Grace (min):"}</Label>
                <Input type="number" value={formData.late_checkout_minutes ?? 0} onChange={e => setFormData({ ...formData, late_checkout_minutes: Number(e.target.value), late_checkout_allowed: Number(e.target.value) > 0 })} />
              </div>
            </div>'''

if old_jsx in content:
    content = content.replace(old_jsx, new_jsx)
    print("✅ تم حاقن الخانات المباشرة بنجاح في JSX المودال!")
else:
    print("⚠️ لم يتم العثور على البلوك الدقيق، جاري البحث المرن...")
    # محاولة بديلة لو اختلفت المسافات
    anchor = 'onChange={e => setFormData({ ...formData, grace_period: Number(e.target.value) })} />'
    if anchor in content and 'Early Check-in Grace' not in content:
        extra_code = '''
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <Label>{ar ? "سماحية الحضور المبكر (دقائق):" : "Early Check-in Grace (min):"}</Label>
                <Input type="number" value={formData.early_checkin_minutes ?? 30} onChange={e => setFormData({ ...formData, early_checkin_minutes: Number(e.target.value) })} />
              </div>
              <div>
                <Label>{ar ? "سماحية الانصراف المتأخر (دقائق):" : "Late Check-out Grace (min):"}</Label>
                <Input type="number" value={formData.late_checkout_minutes ?? 0} onChange={e => setFormData({ ...formData, late_checkout_minutes: Number(e.target.value), late_checkout_allowed: Number(e.target.value) > 0 })} />
              </div>'''
        content = content.replace(anchor, anchor + extra_code, 1)
        print("✅ تم الحقن المرن بنجاح!")

with open(filePath, 'w', encoding='utf-8') as f:
    f.write(content)

print("🎉 اكتمل تحديث المودال!")
