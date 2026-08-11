import sys
sys.stdout.reconfigure(encoding="utf-8")
from pathlib import Path

p = Path("src/app/hr/job-titles/page.tsx")
text = p.read_text(encoding="utf-8")

# 1) Update interface
text = text.replace(
    """interface JobTitleItem {
  id: number;
  name_ar: string;
  name_en: string;
  description?: string;
  is_active?: boolean;
}""",
    """interface JobTitleItem {
  id: number;
  name_ar: string;
  name_en: string;
  description?: string;
  is_active?: boolean;
  branch_id?: number | null;
  department_id?: number | null;
  is_manager?: boolean;
}

interface BranchItem {
  id: number;
  name_ar: string;
  name_en?: string;
}

interface DepartmentItem {
  id: number;
  name_ar: string;
  name_en?: string;
  branch_id?: number | null;
}"""
)

# 2) Update EMPTY_FORM
text = text.replace(
    'const EMPTY_FORM = { name_ar: "", name_en: "", description: "" };',
    'const EMPTY_FORM = { name_ar: "", name_en: "", description: "", branch_id: "", department_id: "", is_manager: false };'
)

# 3) Add states for branches and departments
text = text.replace(
    """  const [jobTitles, setJobTitles] = useState<JobTitleItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeLite[]>([]);""",
    """  const [jobTitles, setJobTitles] = useState<JobTitleItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeLite[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);"""
)

# 4) Load branches and departments
text = text.replace(
    """    Promise.all([
      fetch("/api/job-titles", { headers: { Authorization: authHeader } }).then((r) => r.json()),
      fetch("/api/employees/list", { headers: { Authorization: authHeader } }).then((r) => r.json()),
    ])
      .then(([jtRes, empRes]) => {
        setJobTitles(Array.isArray(jtRes) ? jtRes : jtRes.job_titles || jtRes.jobTitles || []);
        setEmployees(Array.isArray(empRes) ? empRes : empRes.employees || []);
      })""",
    """    Promise.all([
      fetch("/api/job-titles", { headers: { Authorization: authHeader } }).then((r) => r.json()),
      fetch("/api/employees/list", { headers: { Authorization: authHeader } }).then((r) => r.json()),
      fetch("/api/branches", { headers: { Authorization: authHeader } }).then((r) => r.json()),
      fetch("/api/departments", { headers: { Authorization: authHeader } }).then((r) => r.json()),
    ])
      .then(([jtRes, empRes, brRes, depRes]) => {
        setJobTitles(Array.isArray(jtRes) ? jtRes : jtRes.job_titles || jtRes.jobTitles || []);
        setEmployees(Array.isArray(empRes) ? empRes : empRes.employees || []);
        setBranches(Array.isArray(brRes) ? brRes : brRes.branches || []);
        setDepartments(Array.isArray(depRes) ? depRes : depRes.departments || []);
      })"""
)

# 5) Update openEditDialog to include new fields
text = text.replace(
    """  const openEditDialog = (item: JobTitleItem) => {
    setEditingItem(item);
    setFormData({
      name_ar: item.name_ar || "",
      name_en: item.name_en || "",
      description: item.description || "",
    });
    setDialogOpen(true);
  };""",
    """  const openEditDialog = (item: JobTitleItem) => {
    setEditingItem(item);
    setFormData({
      name_ar: item.name_ar || "",
      name_en: item.name_en || "",
      description: item.description || "",
      branch_id: item.branch_id ? String(item.branch_id) : "",
      department_id: item.department_id ? String(item.department_id) : "",
      is_manager: item.is_manager || false,
    });
    setDialogOpen(true);
  };"""
)

# 6) Update dialog to add new fields
old_dialog_form = """            <div className="space-y-2">
              <Label htmlFor="description">{d.jobTitleDescLabel}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description..."
                disabled={isSaving}
              />
            </div>

            <div className="flex gap-2 justify-end">"""

new_dialog_form = """            <div className="space-y-2">
              <Label htmlFor="branch_id">{ar ? "الفرع" : "Branch"}</Label>
              <select
                id="branch_id"
                value={formData.branch_id}
                onChange={(e) => setFormData({ ...formData, branch_id: e.target.value, department_id: "" })}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                disabled={isSaving}
              >
                <option value="">{ar ? "-- اختر الفرع --" : "-- Select Branch --"}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{ar ? b.name_ar : (b.name_en || b.name_ar)}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department_id">{ar ? "القسم" : "Department"}</Label>
              <select
                id="department_id"
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                disabled={isSaving || !formData.branch_id}
              >
                <option value="">{ar ? "-- اختر القسم --" : "-- Select Department --"}</option>
                {departments
                  .filter((dep) => !formData.branch_id || String(dep.branch_id) === String(formData.branch_id))
                  .map((dep) => (
                    <option key={dep.id} value={dep.id}>{ar ? dep.name_ar : (dep.name_en || dep.name_ar)}</option>
                  ))}
              </select>
              {!formData.branch_id && (
                <p className="text-xs text-muted-foreground">
                  {ar ? "اختر الفرع أولاً" : "Select branch first"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{d.jobTitleDescLabel}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description..."
                disabled={isSaving}
              />
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg border-2 border-brand-primary/30 bg-brand-primary/5">
              <input
                type="checkbox"
                id="is_manager"
                checked={formData.is_manager}
                onChange={(e) => setFormData({ ...formData, is_manager: e.target.checked })}
                className="w-5 h-5 rounded"
                disabled={isSaving}
              />
              <Label htmlFor="is_manager" className="cursor-pointer flex-1">
                <span className="font-semibold">
                  {ar ? "🎯 هذا المسمى الوظيفي مدير" : "🎯 This job title is a Manager"}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  {ar
                    ? "لو مفعّل، الموظفين بهذا المسمى سيظهرون في قائمة المديرين المباشرين"
                    : "If enabled, employees with this title will appear in direct managers list"}
                </p>
              </Label>
            </div>

            <div className="flex gap-2 justify-end">"""

if old_dialog_form in text:
    text = text.replace(old_dialog_form, new_dialog_form)
    print("[OK] Dialog form updated with branch/department/is_manager")
else:
    print("[WARN] Dialog block not found")

p.write_text(text, encoding="utf-8")
print(f"[OK] Saved: {p.stat().st_size} bytes")
