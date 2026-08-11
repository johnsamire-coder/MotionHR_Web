import sys
sys.stdout.reconfigure(encoding="utf-8")
from pathlib import Path

p = Path("src/app/hr/work-locations/page.tsx")
text = p.read_text(encoding="utf-8")

# نتحقق لو الوظائف موجودة
if "const handleAssignEmployees" in text:
    print("Functions already exist!")
else:
    # نضيف الـ states والوظائف قبل return
    # نلاقي أي مكان ثابت للإضافة

    # 1) نضيف states بعد آخر useState
    marker_state = '  const [submitting, setSubmitting] = useState(false);'
    if marker_state in text:
        new_states = '''  const [submitting, setSubmitting] = useState(false);
  const [assignLoc, setAssignLoc] = useState<WorkLocation | null>(null);
  const [allEmployees, setAllEmployees] = useState<Array<{id: number; name: string}>>([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState<number[]>([]);
  const [assigning, setAssigning] = useState(false);'''
        text = text.replace(marker_state, new_states)
        print("[OK] States added")

    # 2) نضيف الوظائف قبل return
    marker_return = '  return ('
    if marker_return in text:
        functions = '''  const openAssignEmployees = async (loc: WorkLocation) => {
    setAssignLoc(loc);
    setSelectedEmpIds([]);
    try {
      const res = await fetch("/api/employees/list", { headers: { Authorization: authHeader } });
      const data = await res.json();
      const list = (data?.employees || data || []).map((e: any) => ({
        id: e.id,
        name: e.full_name_ar || e.name || `${e.first_name_ar || ""} ${e.last_name_ar || ""}`.trim() || `#${e.id}`,
      }));
      setAllEmployees(list);
    } catch {
      toast.error(ar ? "فشل تحميل الموظفين" : "Failed");
    }
  };

  const handleAssignEmployees = async () => {
    if (!assignLoc || selectedEmpIds.length === 0) {
      toast.error(ar ? "اختر موظفين" : "Select employees");
      return;
    }
    setAssigning(true);
    try {
      const res = await fetch(`/api/hr/work-locations/${assignLoc.id}/assign-employees`, {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ employee_ids: selectedEmpIds }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(ar ? `تم تعيين ${selectedEmpIds.length} موظف` : `Assigned ${selectedEmpIds.length}`);
        setAssignLoc(null);
        loadData();
      } else {
        toast.error(data.message || (ar ? "فشل" : "Failed"));
      }
    } catch {
      toast.error(ar ? "خطأ" : "Error");
    } finally {
      setAssigning(false);
    }
  };

  const handleDeleteLocation = async (loc: WorkLocation) => {
    if (!confirm(ar ? `حذف "${loc.name}"؟` : `Delete "${loc.name}"?`)) return;
    try {
      const res = await fetch(`/api/hr/work-locations/${loc.id}`, {
        method: "DELETE",
        headers: { Authorization: authHeader },
      });
      if (res.ok) {
        toast.success(ar ? "تم الحذف" : "Deleted");
        loadData();
      } else {
        toast.error(ar ? "فشل الحذف" : "Failed");
      }
    } catch {
      toast.error(ar ? "خطأ" : "Error");
    }
  };

  return ('''
        # نضيف مرة واحدة فقط قبل أول return
        text = text.replace(marker_return, functions, 1)
        print("[OK] Functions added")

p.write_text(text, encoding="utf-8")
print(f"Saved: {p.stat().st_size} bytes")
