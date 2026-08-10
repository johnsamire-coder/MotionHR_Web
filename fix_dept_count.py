"""
Fix employee count display in departments cards
"""
from pathlib import Path

path = Path("src/app/hr/departments/page.tsx")
text = path.read_text(encoding="utf-8")

old = "{dep.employee_count || 0} {ar ? \"موظف\" : \"employees\"}"
new = "{dep.employees_count || dep.employee_count || 0} {ar ? \"موظف\" : \"employees\"}"

if old in text:
    text = text.replace(old, new)
    path.write_text(text, encoding="utf-8")
    print("[OK] Fixed employee count in department cards")
else:
    print("[WARN] Pattern not found")
