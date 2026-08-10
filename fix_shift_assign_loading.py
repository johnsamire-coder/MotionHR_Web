import sys
sys.stdout.reconfigure(encoding="utf-8")
from pathlib import Path

p = Path("src/app/hr/shifts/page.tsx")
text = p.read_text(encoding="utf-8")

# 1) add employeesLoading state
old_state = '''  const [assignShift, setAssignShift] = useState<Shift | null>(null);
  const [employees, setEmployees] = useState<Array<{id: number; name: string}>>([]);
  const [assignForm, setAssignForm] = useState({ employee_ids: [] as number[], start_date: "", end_date: "" });
  const [isAssigning, setIsAssigning] = useState(false);'''

new_state = '''  const [assignShift, setAssignShift] = useState<Shift | null>(null);
  const [employees, setEmployees] = useState<Array<{id: number; name: string}>>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [assignForm, setAssignForm] = useState({ employee_ids: [] as number[], start_date: "", end_date: "" });
  const [isAssigning, setIsAssigning] = useState(false);'''

if old_state in text:
    text = text.replace(old_state, new_state)
    print("[OK] Added employeesLoading state")

# 2) replace loadEmployees
old_func = '''  const loadEmployees = async () => {
    try {
      const res = await fetch("/api/employees/list", {
        headers: { Authorization: `Token ${token}` },
      });
      const data = await res.json();
      setEmployees((data?.employees || data || []).map((e: any) => ({
        id: e.id,
        name: e.full_name_ar || e.name || `${e.first_name_ar || ""} ${e.last_name_ar || ""}`.trim(),
      })));
    } catch {}
  };'''

new_func = '''  const loadEmployees = async () => {
    setEmployeesLoading(true);
    try {
      const res = await fetch("/api/employees/list", {
        headers: { Authorization: `Token ${token}` },
      });
      const data = await res.json();

      const rawList =
        data?.employees ||
        data?.items ||
        data?.results ||
        data?.data ||
        (Array.isArray(data) ? data : []);

      const normalized = Array.isArray(rawList)
        ? rawList.map((e: any) => ({
            id: e.id,
            name:
              e.full_name_ar ||
              e.full_name ||
              e.name ||
              `${e.first_name_ar || e.first_name || ""} ${e.last_name_ar || e.last_name || ""}`.trim() ||
              `#${e.id}`,
          }))
        : [];

      setEmployees(normalized);
    } catch (err) {
      console.error("loadEmployees error:", err);
      setEmployees([]);
      toast.error(lang === "ar" ? "تعذر تحميل الموظفين" : "Failed to load employees");
    } finally {
      setEmployeesLoading(false);
    }
  };'''

if old_func in text:
    text = text.replace(old_func, new_func)
    print("[OK] Replaced loadEmployees with robust version")
else:
    print("[WARN] loadEmployees block not found exactly")

# 3) fix dialog loading area
old_ui = '''                {employees.length === 0 ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : employees.map(emp => ('''

new_ui = '''                {employeesLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : employees.length === 0 ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    {lang === "ar" ? "لا يوجد موظفون متاحون" : "No employees available"}
                  </div>
                ) : employees.map(emp => ('''

if old_ui in text:
    text = text.replace(old_ui, new_ui)
    print("[OK] Fixed employee list UI state")
else:
    print("[WARN] Employee UI block not found exactly")

p.write_text(text, encoding="utf-8")
print(f"[OK] Saved: {p}")
print("[SUCCESS] Shift assign loading fix applied")
