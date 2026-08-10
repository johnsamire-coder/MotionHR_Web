"""
Complete fix for departments page
"""
from pathlib import Path

path = Path("src/app/hr/departments/page.tsx")
text = path.read_text(encoding="utf-8")

old_interface = """interface Department {
  id: number;
  name: string;
  name_en?: string;
  description?: string;
  employee_count?: number;
}"""

new_interface = """interface Department {
  id: number;
  name_ar: string;
  name_en?: string;
  code?: string;
  description?: string;
  employees_count?: number;
  employee_count?: number;
}"""

if old_interface in text:
    text = text.replace(old_interface, new_interface)
    print("[OK] Fix 1: Interface")

old_empty = 'const EMPTY = { name: "", name_en: "", description: "" };'
new_empty = 'const EMPTY = { name_ar: "", name_en: "", code: "", description: "" };'

if old_empty in text:
    text = text.replace(old_empty, new_empty)
    print("[OK] Fix 2: EMPTY")

old_val1 = '''    if (!form.name) {
      toast.error(ar ? "الاسم العربي مطلوب" : "Arabic name is required");
      return;
    }'''

new_val1 = '''    if (!form.name_ar) {
      toast.error(ar ? "الاسم العربي مطلوب" : "Arabic name is required");
      return;
    }'''

if old_val1 in text:
    text = text.replace(old_val1, new_val1)
    print("[OK] Fix 3: Create validation")

old_val2 = "    if (!editItem || !form.name) return;"
new_val2 = "    if (!editItem || !form.name_ar) return;"

if old_val2 in text:
    text = text.replace(old_val2, new_val2)
    print("[OK] Fix 4: Edit validation")

old_err = 'toast.error(data.message || (ar ? "فشل" : "Failed"));'
new_err = 'toast.error(data.error || data.message || (ar ? "فشل" : "Failed"));'
count = text.count(old_err)
if count > 0:
    text = text.replace(old_err, new_err)
    print(f"[OK] Fix 5: {count} error handlers")

old_open = '''  const openEdit = (item: Department) => {
    setForm({ name: item.name, name_en: item.name_en || "", description: item.description || "" });
    setEditItem(item);
  };'''

new_open = '''  const openEdit = (item: Department) => {
    setForm({
      name_ar: item.name_ar || "",
      name_en: item.name_en || "",
      code: item.code || "",
      description: item.description || ""
    });
    setEditItem(item);
  };'''

if old_open in text:
    text = text.replace(old_open, new_open)
    print("[OK] Fix 6: openEdit")

old_name = '''  const getName = (item: Department) =>
    ar ? item.name : (item.name_en || item.name);'''

new_name = '''  const getName = (item: Department) =>
    ar ? item.name_ar : (item.name_en || item.name_ar);'''

if old_name in text:
    text = text.replace(old_name, new_name)
    print("[OK] Fix 7: getName")

old_filter = '''  const filtered = departments.filter(dep =>
    !search ||
    dep.name.includes(search) ||
    (dep.name_en || "").toLowerCase().includes(search.toLowerCase())
  );'''

new_filter = '''  const filtered = departments.filter(dep =>
    !search ||
    (dep.name_ar || "").includes(search) ||
    (dep.name_en || "").toLowerCase().includes(search.toLowerCase())
  );'''

if old_filter in text:
    text = text.replace(old_filter, new_filter)
    print("[OK] Fix 8: filter")

old_total = "const totalEmployees = departments.reduce((s, d) => s + (d.employee_count || 0), 0);"
new_total = "const totalEmployees = departments.reduce((s, d) => s + (d.employees_count || d.employee_count || 0), 0);"

if old_total in text:
    text = text.replace(old_total, new_total)
    print("[OK] Fix 9: totalEmployees")

old_form = '''          value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          placeholder="الهندسة المدنية"'''

new_form = '''          value={form.name_ar}
          onChange={e => setForm(p => ({ ...p, name_ar: e.target.value }))}
          placeholder="الهندسة المدنية"'''

if old_form in text:
    text = text.replace(old_form, new_form)
    print("[OK] Fix 10: form input")

path.write_text(text, encoding="utf-8")
print(f"\n[SUCCESS] All fixes applied!")
