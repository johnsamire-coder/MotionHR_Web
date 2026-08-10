import sys
sys.stdout.reconfigure(encoding="utf-8")
from pathlib import Path

# 1) API Route
route_dir = Path("src/app/api/hr/shifts")
route_dir.mkdir(parents=True, exist_ok=True)

assign_route = route_dir / "assign" / "route.ts"
assign_route.parent.mkdir(parents=True, exist_ok=True)
assign_route.write_text('''import { NextResponse } from "next/server";
const BACKEND = "https://jssolutions-eg.com";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/shifts/assign/`, {
      method: "POST",
      headers: { Authorization: authHeader, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
''', encoding="utf-8")
print(f"[OK] API route created: {assign_route}")

# 2) Update shifts page
shifts_file = Path("src/app/hr/shifts/page.tsx")
content = shifts_file.read_text(encoding="utf-8")

# نضيف states جديدة
old_states = '''  const [isDeleting, setIsDeleting] = useState(false);'''
new_states = '''  const [isDeleting, setIsDeleting] = useState(false);
  // Assign Dialog
  const [assignShift, setAssignShift] = useState<Shift | null>(null);
  const [employees, setEmployees] = useState<Array<{id: number; name: string}>>([]);
  const [assignForm, setAssignForm] = useState({ employee_ids: [] as number[], start_date: "", end_date: "" });
  const [isAssigning, setIsAssigning] = useState(false);'''

content = content.replace(old_states, new_states)

# نضيف loadEmployees function
old_load = '''  const loadShifts = async () => {'''
new_load = '''  const loadEmployees = async () => {
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
  };

  const loadShifts = async () => {'''

content = content.replace(old_load, new_load)

# نضيف handleAssign function
old_handle = '''  const getShiftTypeLabel = (type?: string) => {'''
new_handle = '''  const openAssignDialog = (shift: Shift) => {
    setAssignShift(shift);
    setAssignForm({ employee_ids: [], start_date: new Date().toISOString().split("T")[0], end_date: "" });
    if (employees.length === 0) loadEmployees();
  };

  const handleAssign = async () => {
    if (!assignShift || assignForm.employee_ids.length === 0 || !assignForm.start_date) {
      toast.error(lang === "ar" ? "اختر موظف وتاريخ البداية" : "Select employee and start date");
      return;
    }
    setIsAssigning(true);
    try {
      const res = await fetch("/api/hr/shifts/assign", {
        method: "POST",
        headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          shift_id: assignShift.id,
          employee_ids: assignForm.employee_ids,
          start_date: assignForm.start_date,
          end_date: assignForm.end_date || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(lang === "ar" ? `تم تعيين الشيفت لـ ${assignForm.employee_ids.length} موظف` : `Shift assigned to ${assignForm.employee_ids.length} employee(s)`);
        setAssignShift(null);
      } else {
        toast.error(data.error || data.message || (lang === "ar" ? "فشل التعيين" : "Assignment failed"));
      }
    } catch {
      toast.error(lang === "ar" ? "خطأ في الاتصال" : "Connection error");
    } finally {
      setIsAssigning(false);
    }
  };

  const getShiftTypeLabel = (type?: string) => {'''

content = content.replace(old_handle, new_handle)

# نستبدل زرار "قريباً" بـ openAssignDialog
old_btn = '''                        <DropdownMenuItem onClick={() => toast.info(lang === "ar" ? "قريباً" : "Coming soon")}>
                          <Users className="w-4 h-4 ml-2" />{d.assignEmployees}
                        </DropdownMenuItem>'''
new_btn = '''                        <DropdownMenuItem onClick={() => openAssignDialog(shift)}>
                          <Users className="w-4 h-4 ml-2" />{d.assignEmployees}
                        </DropdownMenuItem>'''

content = content.replace(old_btn, new_btn)

# نضيف Assign Dialog قبل آخر </div>
assign_dialog = '''
      {/* Assign Employees Dialog */}
      <Dialog open={!!assignShift} onOpenChange={(open) => !open && setAssignShift(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {lang === "ar" ? `تعيين موظفين للشيفت: ${assignShift?.name}` : `Assign to Shift: ${assignShift?.name}`}
            </DialogTitle>
            <DialogDescription>
              {lang === "ar" ? "اختر موظف أو أكثر وتاريخ البداية" : "Select employee(s) and start date"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{lang === "ar" ? "الموظفون *" : "Employees *"}</Label>
              <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
                {employees.length === 0 ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : employees.map(emp => (
                  <label key={emp.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={assignForm.employee_ids.includes(emp.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAssignForm(prev => ({ ...prev, employee_ids: [...prev.employee_ids, emp.id] }));
                        } else {
                          setAssignForm(prev => ({ ...prev, employee_ids: prev.employee_ids.filter(id => id !== emp.id) }));
                        }
                      }}
                    />
                    <span className="text-sm">{emp.name}</span>
                  </label>
                ))}
              </div>
              {assignForm.employee_ids.length > 0 && (
                <p className="text-xs text-brand-primary">
                  {lang === "ar" ? `تم اختيار ${assignForm.employee_ids.length} موظف` : `${assignForm.employee_ids.length} selected`}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{lang === "ar" ? "تاريخ البداية *" : "Start Date *"}</Label>
                <input
                  type="date"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={assignForm.start_date}
                  onChange={e => setAssignForm(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{lang === "ar" ? "تاريخ النهاية (اختياري)" : "End Date (optional)"}</Label>
                <input
                  type="date"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={assignForm.end_date}
                  onChange={e => setAssignForm(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignShift(null)} disabled={isAssigning}>
              {d.cancel}
            </Button>
            <Button onClick={handleAssign} disabled={isAssigning || assignForm.employee_ids.length === 0} className="gap-2">
              {isAssigning
                ? <><Loader2 className="w-4 h-4 animate-spin" />{lang === "ar" ? "جاري التعيين..." : "Assigning..."}</>
                : <><Users className="w-4 h-4" />{d.assignEmployees}</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>'''

# نضيف قبل آخر </div>
last_div = content.rfind("    </div>\n  );\n}")
if last_div > 0:
    content = content[:last_div] + assign_dialog + "\n" + content[last_div:]
    print("[OK] Assign dialog added")

shifts_file.write_text(content, encoding="utf-8")
print(f"[OK] shifts/page.tsx updated: {shifts_file.stat().st_size} bytes")
print("[SUCCESS] Assign shift feature ready!")
