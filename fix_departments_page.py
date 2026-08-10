"""
Fix departments page:
1. Move FormFields outside component (fixes focus issue)
2. Use consistent API endpoints
3. Fix employee count display
"""
from pathlib import Path

path = Path("src/app/hr/departments/page.tsx")
text = path.read_text(encoding="utf-8")

# ═══════════════════════════════════════════════
# FIX 1: نقل FormFields برة الـ component
# ═══════════════════════════════════════════════
old_form_fields = '''  const FormFields = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">{ar ? "الاسم بالعربي *" : "Arabic Name *"}</label>
        <Input
          value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          placeholder="الهندسة المدنية"
          dir="rtl"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">{ar ? "الاسم بالإنجليزي" : "English Name"}</label>
        <Input
          value={form.name_en}
          onChange={e => setForm(p => ({ ...p, name_en: e.target.value }))}
          placeholder="Civil Engineering"
          dir="ltr"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">{ar ? "الوصف" : "Description"}</label>
        <textarea
          value={form.description}
          onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          rows={3}
          placeholder={ar ? "وصف القسم..." : "Department description..."}
          className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background resize-none"
        />
      </div>
    </div>
  );'''

# الحل: نحذفه من هنا ونحطه inline في كل مكان
new_form_fields = '''  // FormFields inline JSX (not as separate component to preserve input focus)
  const renderFormFields = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">{ar ? "الاسم بالعربي *" : "Arabic Name *"}</label>
        <Input
          value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          placeholder="الهندسة المدنية"
          dir="rtl"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">{ar ? "الاسم بالإنجليزي" : "English Name"}</label>
        <Input
          value={form.name_en}
          onChange={e => setForm(p => ({ ...p, name_en: e.target.value }))}
          placeholder="Civil Engineering"
          dir="ltr"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">{ar ? "الوصف" : "Description"}</label>
        <textarea
          value={form.description}
          onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          rows={3}
          placeholder={ar ? "وصف القسم..." : "Department description..."}
          className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background resize-none"
        />
      </div>
    </div>
  );'''

if old_form_fields in text:
    text = text.replace(old_form_fields, new_form_fields)
    print("[OK] Fix 1: Renamed FormFields to renderFormFields (function, not component)")
else:
    print("[WARN] FormFields block not found exactly")

# ═══════════════════════════════════════════════
# FIX 2: تحديث كل استخدامات <FormFields /> لـ {renderFormFields()}
# ═══════════════════════════════════════════════
old_usage = "<FormFields />"
new_usage = "{renderFormFields()}"

count = text.count(old_usage)
if count > 0:
    text = text.replace(old_usage, new_usage)
    print(f"[OK] Fix 2: Replaced {count} occurrences of <FormFields /> with {{renderFormFields()}}")

# ═══════════════════════════════════════════════
# FIX 3: توحيد الـ API endpoint في Load
# ═══════════════════════════════════════════════
old_load = 'fetch("/api/departments", { headers: { Authorization: authHeader } })'
new_load = 'fetch("/api/hr/departments", { headers: { Authorization: authHeader } })'

if old_load in text:
    text = text.replace(old_load, new_load)
    print("[OK] Fix 3: Unified load endpoint to /api/hr/departments")

# احفظ
path.write_text(text, encoding="utf-8")
print(f"\n[SUCCESS] File updated!")
print(f"Size: {path.stat().st_size} bytes")
