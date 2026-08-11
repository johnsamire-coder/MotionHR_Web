import sys
sys.stdout.reconfigure(encoding="utf-8")
from pathlib import Path

p = Path("src/app/hr/departments/page.tsx")
text = p.read_text(encoding="utf-8")

# 1) Update Department interface
text = text.replace(
    """interface Department {
  id: number;
  name_ar: string;
  name_en?: string;
  code?: string;
  description?: string;
  employees_count?: number;
  employee_count?: number;
}""",
    """interface Department {
  id: number;
  name_ar: string;
  name_en?: string;
  code?: string;
  description?: string;
  employees_count?: number;
  employee_count?: number;
  branch_id?: number | null;
  branch_name?: string | null;
}

interface BranchItem {
  id: number;
  name_ar: string;
  name_en?: string;
}"""
)

# 2) Update EMPTY
text = text.replace(
    'const EMPTY = { name_ar: "", name_en: "", code: "", description: "" };',
    'const EMPTY = { name_ar: "", name_en: "", code: "", description: "", branch_id: "" };'
)

# 3) Add branches state
text = text.replace(
    """  const [departments, setDepartments] = useState<Department[]>([]);""",
    """  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);"""
)

# 4) Load branches in useEffect
text = text.replace(
    """    fetch("/api/hr/departments", { headers: { Authorization: authHeader } })
      .then(r => r.json())
      .then(data => setDepartments(data?.departments || data || []))
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, []);""",
    """    Promise.all([
      fetch("/api/hr/departments", { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch("/api/branches", { headers: { Authorization: authHeader } }).then(r => r.json()),
    ])
      .then(([depData, brData]) => {
        setDepartments(depData?.departments || depData || []);
        setBranches(Array.isArray(brData) ? brData : brData?.branches || []);
      })
      .catch(() => toast.error(d.failedLoad))
      .finally(() => setLoading(false));
  }, []);"""
)

# 5) Update openEdit to include branch_id
text = text.replace(
    """  const openEdit = (item: Department) => {
    setForm({
      name_ar: item.name_ar || "",
      name_en: item.name_en || "",
      code: item.code || "",
      description: item.description || ""
    });
    setEditItem(item);
  };""",
    """  const openEdit = (item: Department) => {
    setForm({
      name_ar: item.name_ar || "",
      name_en: item.name_en || "",
      code: item.code || "",
      description: item.description || "",
      branch_id: item.branch_id ? String(item.branch_id) : "",
    });
    setEditItem(item);
  };"""
)

# 6) Add branch dropdown to form
old_form = """      <div>
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
  );"""

new_form = """      <div>
        <label className="text-sm font-medium mb-1 block">{ar ? "الفرع *" : "Branch *"}</label>
        <select
          value={form.branch_id}
          onChange={e => setForm(p => ({ ...p, branch_id: e.target.value }))}
          className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
        >
          <option value="">{ar ? "-- اختر الفرع --" : "-- Select Branch --"}</option>
          {branches.map(b => (
            <option key={b.id} value={b.id}>{ar ? b.name_ar : (b.name_en || b.name_ar)}</option>
          ))}
        </select>
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
  );"""

if old_form in text:
    text = text.replace(old_form, new_form)
    print("[OK] Added Branch dropdown to Department form")
else:
    print("[WARN] Form block not found")

# 7) Show branch name in department card
old_card = """                    <div>
                      <p className="font-semibold">{getName(dep)}</p>
                      {dep.name_en && dep.name !== dep.name_en && (
                        <p className="text-xs text-muted-foreground">
                          {ar ? dep.name_en : dep.name}
                        </p>
                      )}
                    </div>"""

new_card = """                    <div>
                      <p className="font-semibold">{getName(dep)}</p>
                      {dep.branch_name && (
                        <p className="text-xs text-brand-primary flex items-center gap-1">
                          🏢 {dep.branch_name}
                        </p>
                      )}
                    </div>"""

if old_card in text:
    text = text.replace(old_card, new_card)
    print("[OK] Show branch name on department card")

p.write_text(text, encoding="utf-8")
print(f"[OK] Saved: {p.stat().st_size} bytes")
