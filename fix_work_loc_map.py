import sys
sys.stdout.reconfigure(encoding="utf-8")
from pathlib import Path

p = Path("src/app/hr/work-locations/page.tsx")
text = p.read_text(encoding="utf-8")

# نغير استخدام Map للـ JavaScript Map
text = text.replace(
    "const employeeMap = new Map<number,",
    "const employeeMap: Map<number, { name: string; locations: WorkLocation[] }> = new globalThis.Map();\n  const _tmp = new globalThis.Map<number,"
)

# طريقة أنظف: نغير الـ import بس
text = p.read_text(encoding="utf-8")
text = text.replace(
    "  Map, Loader2, Plus, MapPin, Users,",
    "  Map as MapIcon, Loader2, Plus, MapPin, Users,"
)
# نغير أي استخدام لـ <Map /> للـ <MapIcon />
text = text.replace("<Map ", "<MapIcon ")
text = text.replace("<Map>", "<MapIcon>")

p.write_text(text, encoding="utf-8")
print(f"OK: Renamed Map icon to MapIcon")
print(f"Size: {p.stat().st_size} bytes")
