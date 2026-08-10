"""
MotionHR Web Inventory Extractor
"""
import json
import re
from pathlib import Path

ROOT = Path("src/app")
OUTPUT = Path("inventory_web.json")

if not ROOT.exists():
    print(f"[ERROR] Cannot find {ROOT}")
    raise SystemExit(1)

inventory = {
    "project": "MotionHR Web",
    "pages": [],
    "api_routes": [],
}

API_CALL_PATTERN = re.compile(r"""['"`](/api/[^'"`\s?]+)['"`]""")
BUTTON_PATTERN = re.compile(r"<[Bb]utton[^>]*>([^<]{2,80})</[Bb]utton>")
LINK_PATTERN = re.compile(r"<Link[^>]*>([^<]{2,80})</Link>")
TAB_PATTERN = re.compile(r"""<TabsTrigger[^>]*>([^<]{2,60})</TabsTrigger>""")
HEADING_PATTERN = re.compile(r"<h[1-3][^>]*>([^<]{2,80})</h[1-3]>")
CARD_TITLE_PATTERN = re.compile(r"<CardTitle[^>]*>([^<]{2,80})</CardTitle>")

def rel(p): return str(p.as_posix())
def clean_text(s): return re.sub(r'\s+', ' ', s).strip()

def scan_file(fp):
    try:
        text = fp.read_text(encoding="utf-8", errors="ignore")
    except:
        return None

    return {
        "file": rel(fp),
        "apis": sorted(set(API_CALL_PATTERN.findall(text)))[:100],
        "buttons": sorted(set(clean_text(s) for s in BUTTON_PATTERN.findall(text) if s.strip()))[:100],
        "links": sorted(set(clean_text(s) for s in LINK_PATTERN.findall(text) if s.strip()))[:100],
        "tabs": sorted(set(clean_text(s) for s in TAB_PATTERN.findall(text) if s.strip()))[:100],
        "headings": sorted(set(clean_text(s) for s in HEADING_PATTERN.findall(text) if s.strip()))[:100],
        "card_titles": sorted(set(clean_text(s) for s in CARD_TITLE_PATTERN.findall(text) if s.strip()))[:100],
    }

print("[SCAN] Pages...")
for pattern in ["page.tsx", "page.ts"]:
    for fp in ROOT.rglob(pattern):
        entry = scan_file(fp)
        if entry:
            route = "/" + str(fp.parent.relative_to(ROOT)).replace("\\", "/")
            if route == "/.": route = "/"
            entry["route"] = route
            inventory["pages"].append(entry)

print("[SCAN] API routes...")
for pattern in ["route.ts", "route.tsx"]:
    for fp in ROOT.rglob(pattern):
        api_path = "/" + str(fp.parent.relative_to(ROOT)).replace("\\", "/")
        try:
            text = fp.read_text(encoding="utf-8", errors="ignore")
            methods = re.findall(r"export\s+(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)", text)
        except:
            methods = []
        inventory["api_routes"].append({
            "route": api_path,
            "file": rel(fp),
            "methods": sorted(set(methods)),
        })

OUTPUT.write_text(json.dumps(inventory, ensure_ascii=False, indent=2), encoding="utf-8")

print(f"\n[OK] Pages: {len(inventory['pages'])}")
print(f"[OK] API routes: {len(inventory['api_routes'])}")
print(f"[OK] Saved to: {OUTPUT.absolute()}")
