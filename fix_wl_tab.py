import sys
sys.stdout.reconfigure(encoding="utf-8")
from pathlib import Path

p = Path("src/app/hr/work-locations/page.tsx")
text = p.read_text(encoding="utf-8")

# نصلح Tab الموظفون - نستخدم assigned_employees_names بدل employee_name
old = """  // Group locations by employee
  const employeeMap: Map<number, { name: string; locations: WorkLocation[] }> = new globalThis.Map();
  allLocations.forEach((loc) => {
    if (!loc.employee_id) return;
    if (!employeeMap.has(loc.employee_id)) {
      employeeMap.set(loc.employee_id, { name: loc.employee_name || "—", locations: [] });
    }
    employeeMap.get(loc.employee_id)!.locations.push(loc);
  });"""

new = """  // Group locations by employee (from assigned_employees)
  const employeeMap: Map<number, { name: string; locations: WorkLocation[] }> = new globalThis.Map();
  allLocations.forEach((loc) => {
    // للـ assigned employees (M2M)
    const ids = loc.assigned_employee_ids || [];
    const names = loc.assigned_employees_names || [];
    ids.forEach((empId: number, idx: number) => {
      if (!employeeMap.has(empId)) {
        employeeMap.set(empId, { name: names[idx] || `موظف #${empId}`, locations: [] });
      }
      employeeMap.get(empId)!.locations.push(loc);
    });
    // للـ owner القديم (employee_id) لو موجود
    if (loc.employee_id && !employeeMap.has(loc.employee_id)) {
      employeeMap.set(loc.employee_id, { name: loc.employee_name || "—", locations: [loc] });
    }
  });"""

if old in text:
    text = text.replace(old, new)
    print("[OK] Tab employees fixed")
else:
    print("[WARN] Not found - checking alternative")
    # نجرب بديل بسيط
    if "employeeMap: Map" in text:
        print("Found employeeMap - need manual fix")

p.write_text(text, encoding="utf-8")
print(f"Saved: {p.stat().st_size} bytes")
