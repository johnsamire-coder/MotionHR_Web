import sys
sys.stdout.reconfigure(encoding="utf-8")
from pathlib import Path

p = Path("src/app/hr/work-locations/page.tsx")
text = p.read_text(encoding="utf-8")

# نضيف زرار حذف وتعيين موظفين على كل موقع
# نلاقي كارت الموقع ونضيف زرارات

old_card_content = '''                        {loc.radius && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {d.workLocationRadius}: {loc.radius}m
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}'''

new_card_content = '''                        {loc.radius && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {d.workLocationRadius}: {loc.radius}m
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1"
                        onClick={() => openAssignEmployees(loc)}
                      >
                        <Users className="w-3 h-3" />
                        {ar ? "تعيين موظفين" : "Assign"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 gap-1"
                        onClick={() => handleDeleteLocation(loc)}
                      >
                        🗑️
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}'''

if old_card_content in text:
    text = text.replace(old_card_content, new_card_content)
    print("[OK] Added assign + delete buttons to location card")
else:
    print("[WARN] Card block not found - trying alternative...")

# نضيف الدوال والـ state
old_states = "  const [searchEmployee, setSearchEmployee] = useState(\"\");"
new_states = """  const [searchEmployee, setSearchEmployee] = useState("");
  const [assignLoc, setAssignLoc] = useState<WorkLocation | null>(null);
  const [allEmployees, setAllEmployees] = useState<Array<{id: number; name: string}>>([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState<number[]>([]);
  const [assigning, setAssigning] = useState(false);"""

if old_states in text and "assignLoc" not in text:
    text = text.replace(old_states, new_states)
    print("[OK] Added states")

# نضيف الدوال قبل return
old_hook = "  const hasLocation = form.latitude && form.longitude;"
new_hook = """  const openAssignEmployees = async (loc: WorkLocation) => {
    setAssignLoc(loc);
    setSelectedEmpIds([]);
    // Load employees
    try {
      const res = await fetch("/api/employees/list", { headers: { Authorization: authHeader } });
      const data = await res.json();
      const list = (data?.employees || data || []).map((e: any) => ({
        id: e.id,
        name: e.full_name_ar || e.name || `${e.first_name_ar || ""} ${e.last_name_ar || ""}`.trim(),
      }));
      setAllEmployees(list);
    } catch {
      toast.error(ar ? "فشل تحميل الموظفين" : "Failed to load employees");
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
        toast.success(ar ? `تم تعيين ${selectedEmpIds.length} موظف` : `Assigned ${selectedEmpIds.length} employees`);
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
    if (!confirm(ar ? `هل تريد حذف "${loc.name}"؟` : `Delete "${loc.name}"?`)) return;
    try {
      const res = await fetch(`/api/hr/work-locations/${loc.id}`, {
        method: "DELETE",
        headers: { Authorization: authHeader },
      });
      if (res.ok) {
        toast.success(ar ? "تم الحذف" : "Deleted");
        loadData();
      } else {
        toast.error(ar ? "فشل الحذف" : "Delete failed");
      }
    } catch {
      toast.error(ar ? "خطأ" : "Error");
    }
  };

  const hasLocation = form.latitude && form.longitude;"""

if old_hook in text and "openAssignEmployees" not in text:
    text = text.replace(old_hook, new_hook)
    print("[OK] Added functions")

# نضيف Assign Dialog قبل نهاية الـ component
old_end = """      </Dialog>
    </div>
  );
}"""

new_end = """      </Dialog>

      {/* Assign Employees Dialog */}
      <Dialog open={!!assignLoc} onOpenChange={(o) => !o && setAssignLoc(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {ar ? `تعيين موظفين للموقع: ${assignLoc?.name}` : `Assign to: ${assignLoc?.name}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-72 overflow-y-auto border rounded-lg p-2">
              {allEmployees.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {ar ? "لا يوجد موظفون" : "No employees"}
                </div>
              ) : (
                allEmployees.map((emp) => (
                  <label key={emp.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={selectedEmpIds.includes(emp.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedEmpIds([...selectedEmpIds, emp.id]);
                        else setSelectedEmpIds(selectedEmpIds.filter((id) => id !== emp.id));
                      }}
                    />
                    <span className="text-sm">{emp.name}</span>
                  </label>
                ))
              )}
            </div>
            {selectedEmpIds.length > 0 && (
              <p className="text-xs text-brand-primary">
                {ar ? `تم اختيار ${selectedEmpIds.length} موظف` : `${selectedEmpIds.length} selected`}
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAssignLoc(null)}>{d.cancel}</Button>
              <Button
                onClick={handleAssignEmployees}
                disabled={assigning || selectedEmpIds.length === 0}
                className="bg-brand-primary hover:bg-brand-primary/90 gap-2"
              >
                {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                {ar ? "تعيين" : "Assign"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}"""

if old_end in text and "Assign Employees Dialog" not in text:
    text = text.replace(old_end, new_end)
    print("[OK] Added Assign Dialog")

p.write_text(text, encoding="utf-8")
print(f"Saved: {p.stat().st_size} bytes")
