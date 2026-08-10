"""
Quick fix for import page - safe .join()
"""
from pathlib import Path

path = Path("src/app/hr/employees/import/page.tsx")
text = path.read_text(encoding="utf-8")

# النسخة القديمة الخطيرة
old = "{err.errors.join(\" | \")}"
# النسخة الآمنة
new = "{(err.errors || []).join(\" | \")}"

if old in text:
    text = text.replace(old, new)
    path.write_text(text, encoding="utf-8")
    print("[OK] Fixed err.errors.join to be safe")
else:
    print("[SKIP] Not found - showing all .join usage:")
    import re
    for i, line in enumerate(text.split("\n"), 1):
        if ".join(" in line and "err" in line.lower():
            print(f"  Line {i}: {line.strip()[:100]}")
