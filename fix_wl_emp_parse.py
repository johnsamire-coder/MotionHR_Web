import sys
sys.stdout.reconfigure(encoding="utf-8")
from pathlib import Path

p = Path("src/app/hr/work-locations/page.tsx")
text = p.read_text(encoding="utf-8")

# نصلح استخدام response
old = """      const list = (data?.employees || data || []).map((e: any) => ({
        id: e.id,
        name: e.full_name_ar || e.name || `${e.first_name_ar || ""} ${e.last_name_ar || ""}`.trim() || `#${e.id}`,
      }));"""

new = """      const rawList = data?.employees || data?.results || data?.items || (Array.isArray(data) ? data : []);
      const list = rawList.map((e: any) => ({
        id: e.id,
        name: e.full_name_ar || e.full_name || e.name || `${e.first_name_ar || ""} ${e.last_name_ar || ""}`.trim() || `#${e.id}`,
      }));"""

if old in text:
    text = text.replace(old, new)
    print("[OK] Fixed employees response parsing")
else:
    print("[WARN] Not found")

p.write_text(text, encoding="utf-8")
print(f"Saved: {p.stat().st_size} bytes")
