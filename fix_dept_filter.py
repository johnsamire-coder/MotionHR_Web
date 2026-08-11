import sys
sys.stdout.reconfigure(encoding="utf-8")
from pathlib import Path

p = Path("src/app/hr/job-titles/page.tsx")
text = p.read_text(encoding="utf-8")

# نصلح الفلترة: لو department مالوش branch_id، نظهره في كل الفروع
old = """                {departments
                  .filter((dep) => !formData.branch_id || String(dep.branch_id) === String(formData.branch_id))
                  .map((dep) => ("""

new = """                {departments
                  .filter((dep) => !formData.branch_id || !dep.branch_id || String(dep.branch_id) === String(formData.branch_id))
                  .map((dep) => ("""

if old in text:
    text = text.replace(old, new)
    print("[OK] Fixed department filter")

p.write_text(text, encoding="utf-8")
print(f"Saved: {p.stat().st_size} bytes")
