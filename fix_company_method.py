"""
Fix: Change POST to PUT for company update
"""
from pathlib import Path

path = Path("src/app/api/company/info/route.ts")
text = path.read_text(encoding="utf-8")

# نغيّر POST لـ PUT
old = 'export async function POST(request: Request) {'
new = 'export async function PUT(request: Request) {'

if old in text:
    text = text.replace(old, new)
    print("[OK] Route method: POST -> PUT")

# نغيّر الطريقة في الـ fetch جواه
old_fetch = '''    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });'''

new_fetch = '''    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });'''

if old_fetch in text:
    text = text.replace(old_fetch, new_fetch)
    print("[OK] Backend call method: POST -> PUT")

path.write_text(text, encoding="utf-8")
print(f"\n[SUCCESS] API Route fixed!")

# ═══════════════════════════════════════════════
# نصلح الـ page.tsx كمان
# ═══════════════════════════════════════════════
page = Path("src/app/hr/company/page.tsx")
ptext = page.read_text(encoding="utf-8")

old_page = '''      const res = await fetch("/api/company/info", {
        method: "POST",'''

new_page = '''      const res = await fetch("/api/company/info", {
        method: "PUT",'''

if old_page in ptext:
    ptext = ptext.replace(old_page, new_page)
    page.write_text(ptext, encoding="utf-8")
    print("[OK] Page method: POST -> PUT")

print("\n[DONE] All fixes applied!")
