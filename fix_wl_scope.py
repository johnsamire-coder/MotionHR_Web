import sys
sys.stdout.reconfigure(encoding="utf-8")
from pathlib import Path

p = Path("src/app/hr/work-locations/page.tsx")
text = p.read_text(encoding="utf-8")

# نضيف states جديدة للـ scope
old_states = "  const [selectedEmpIds, setSelectedEmpIds] = useState<number[]>([]);"
new_states = """  const [selectedEmpIds, setSelectedEmpIds] = useState<number[]>([]);
  const [assignScope, setAssignScope] = useState<"employees" | "department" | "branch" | "company">("employees");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [assignBranches, setAssignBranches] = useState<Array<{id: number; name_ar: string}>>([]);
  const [assignDepts, setAssignDepts] = useState<Array<{id: number; name_ar: string; branch_id?: number}>>([]);"""

if old_states in text and "assignScope" not in text:
    text = text.replace(old_states, new_states)
    print("[OK] States added")

# نحدث openAssignEmployees لجلب الفروع والأقسام
old_open = """  const openAssignEmployees = async (loc: WorkLocation) => {
    setAssignLoc(loc);
    setSelectedEmpIds([]);
    try {
      const res = await fetch("/api/employees/list", { headers: { Authorization: authHeader } });
      const data = await res.json();"""

new_open = """  const openAssignEmployees = async (loc: WorkLocation) => {
    setAssignLoc(loc);
    setSelectedEmpIds([]);
    setAssignScope("employees");
    setSelectedBranchId("");
    setSelectedDeptId("");
    try {
      const [empRes, brRes, depRes] = await Promise.all([
        fetch("/api/employees/list", { headers: { Authorization: authHeader } }),
        fetch("/api/branches", { headers: { Authorization: authHeader } }),
        fetch("/api/departments", { headers: { Authorization: authHeader } }),
      ]);
      const data = await empRes.json();
      const brData = await brRes.json();
      const depData = await depRes.json();
      setAssignBranches(Array.isArray(brData) ? brData : brData?.branches || []);
      setAssignDepts(Array.isArray(depData) ? depData : depData?.departments || []);"""

if old_open in text:
    text = text.replace(old_open, new_open)
    print("[OK] openAssignEmployees updated")

# نحدث handleAssignEmployees
old_handle = """  const handleAssignEmployees = async () => {
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
      });"""

new_handle = """  const handleAssignEmployees = async () => {
    if (!assignLoc) return;

    let body: any = { scope: assignScope };

    if (assignScope === "employees") {
      if (selectedEmpIds.length === 0) {
        toast.error(ar ? "اختر موظفين" : "Select employees");
        return;
      }
      body.employee_ids = selectedEmpIds;
    } else if (assignScope === "department") {
      if (!selectedDeptId) {
        toast.error(ar ? "اختر قسم" : "Select department");
        return;
      }
      body.department_id = Number(selectedDeptId);
    } else if (assignScope === "branch") {
      if (!selectedBranchId) {
        toast.error(ar ? "اختر فرع" : "Select branch");
        return;
      }
      body.branch_id = Number(selectedBranchId);
    }

    setAssigning(true);
    try {
      const res = await fetch(`/api/hr/work-locations/${assignLoc.id}/assign-employees`, {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });"""

if old_handle in text:
    text = text.replace(old_handle, new_handle)
    print("[OK] handleAssignEmployees updated")

# نحدث الـ Dialog UI
old_dialog = """          <div className="space-y-4">
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
            )}"""

new_dialog = """          <div className="space-y-4">
            {/* Scope Selector */}
            <div>
              <p className="text-sm font-medium mb-2">{ar ? "نطاق التعيين" : "Assign to"}</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: "employees", ar_lbl: "👥 موظفين محددين", en_lbl: "👥 Specific Employees" },
                  { val: "department", ar_lbl: "🏛️ قسم كامل", en_lbl: "🏛️ Whole Department" },
                  { val: "branch", ar_lbl: "🏢 فرع كامل", en_lbl: "🏢 Whole Branch" },
                  { val: "company", ar_lbl: "🌐 الشركة كلها", en_lbl: "🌐 Entire Company" },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => setAssignScope(opt.val as any)}
                    className={`p-3 rounded-lg border-2 text-sm text-start transition ${
                      assignScope === opt.val
                        ? "border-brand-primary bg-brand-primary/5"
                        : "border-border hover:border-brand-primary/30"
                    }`}
                  >
                    {ar ? opt.ar_lbl : opt.en_lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Scope Content */}
            {assignScope === "employees" && (
              <div>
                <p className="text-sm font-medium mb-2">{ar ? "اختر الموظفين" : "Select Employees"}</p>
                <div className="max-h-60 overflow-y-auto border rounded-lg p-2">
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
                  <p className="text-xs text-brand-primary mt-2">
                    {ar ? `تم اختيار ${selectedEmpIds.length} موظف` : `${selectedEmpIds.length} selected`}
                  </p>
                )}
              </div>
            )}

            {assignScope === "department" && (
              <div>
                <p className="text-sm font-medium mb-2">{ar ? "اختر القسم" : "Select Department"}</p>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="">{ar ? "-- اختر --" : "-- Select --"}</option>
                  {assignDepts.map((d) => (
                    <option key={d.id} value={d.id}>{d.name_ar}</option>
                  ))}
                </select>
              </div>
            )}

            {assignScope === "branch" && (
              <div>
                <p className="text-sm font-medium mb-2">{ar ? "اختر الفرع" : "Select Branch"}</p>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="">{ar ? "-- اختر --" : "-- Select --"}</option>
                  {assignBranches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name_ar}</option>
                  ))}
                </select>
              </div>
            )}

            {assignScope === "company" && (
              <div className="p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-lg text-sm">
                {ar
                  ? "⚠️ سيتم تعيين الموقع لجميع موظفي الشركة"
                  : "⚠️ Location will be assigned to all company employees"}
              </div>
            )}"""

if old_dialog in text:
    text = text.replace(old_dialog, new_dialog)
    print("[OK] Dialog updated")

p.write_text(text, encoding="utf-8")
print(f"Saved: {p.stat().st_size} bytes")
