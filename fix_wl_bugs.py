import sys
sys.stdout.reconfigure(encoding="utf-8")
from pathlib import Path

p = Path("src/app/hr/work-locations/page.tsx")
text = p.read_text(encoding="utf-8")

# Fix 1: زرار التعيين - نصلح disabled logic
old_btn = """              <Button
                onClick={handleAssignEmployees}
                disabled={assigning || selectedEmpIds.length === 0}
                className="bg-brand-primary hover:bg-brand-primary/90 gap-2"
              >"""

new_btn = """              <Button
                onClick={handleAssignEmployees}
                disabled={
                  assigning ||
                  (assignScope === "employees" && selectedEmpIds.length === 0) ||
                  (assignScope === "department" && !selectedDeptId) ||
                  (assignScope === "branch" && !selectedBranchId)
                }
                className="bg-brand-primary hover:bg-brand-primary/90 gap-2"
              >"""

if old_btn in text:
    text = text.replace(old_btn, new_btn)
    print("[OK] Fix 1: Assign button disabled logic")

# Fix 2: نجيب المخصصين لما نفتح الـ Dialog
old_open = """    setSelectedEmpIds([]);
    setAssignScope("employees");
    setSelectedBranchId("");
    setSelectedDeptId("");"""

new_open = """    setAssignScope("employees");
    setSelectedBranchId("");
    setSelectedDeptId("");
    // نجيب المخصصين حالياً من الـ location
    const currentAssigned = (loc as any).assigned_employee_ids || [];
    setSelectedEmpIds(currentAssigned);"""

if old_open in text:
    text = text.replace(old_open, new_open)
    print("[OK] Fix 2: Load current assigned employees")

# Fix 3: نضيف field جديد في WorkLocation interface
old_interface = """interface WorkLocation {
  id: number;
  name?: string;
  location_type?: string;
  location_type_display?: string;
  address?: string;
  radius?: number;
  status?: string;
  status_display?: string;
  employee_name?: string;
  employee_id?: number;
  latitude?: number;
  longitude?: number;
}"""

new_interface = """interface WorkLocation {
  id: number;
  name?: string;
  location_type?: string;
  location_type_display?: string;
  address?: string;
  radius?: number;
  status?: string;
  status_display?: string;
  employee_name?: string;
  employee_id?: number;
  latitude?: number;
  longitude?: number;
  assigned_employee_ids?: number[];
  assigned_employees_names?: string[];
  assigned_count?: number;
}"""

if old_interface in text:
    text = text.replace(old_interface, new_interface)
    print("[OK] Fix 3: Added assigned fields to interface")

p.write_text(text, encoding="utf-8")
print(f"Saved: {p.stat().st_size} bytes")
