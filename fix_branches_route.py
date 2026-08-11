import sys
sys.stdout.reconfigure(encoding="utf-8")
from pathlib import Path

# ═══════════════════════════════════════════
# FIX 1: branches/route.ts - add POST/PUT/DELETE
# ═══════════════════════════════════════════
branches_file = Path("src/app/api/branches/route.ts")
new_branches = '''import { NextResponse } from "next/server";
const B = "https://jssolutions-eg.com";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const res = await fetch(`${B}/attendance/api/mobile/manager/branches/`, {
      headers: { Authorization: auth, "Host": "jssolutions-eg.com" },
      cache: "no-store",
    });
    const text = await res.text();
    try { return NextResponse.json(JSON.parse(text), { status: res.status }); }
    catch { return NextResponse.json({ error: "Backend error", detail: text.substring(0,200) }, { status: 500 }); }
  } catch (e) {
    return NextResponse.json({ error: "Network error", detail: String(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const res = await fetch(`${B}/attendance/api/mobile/manager/branches/`, {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
        "Host": "jssolutions-eg.com",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: "Network error", detail: String(e) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const body = await request.json();
    const res = await fetch(`${B}/attendance/api/mobile/manager/branches/${id}/`, {
      method: "PUT",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
        "Host": "jssolutions-eg.com",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: "Network error", detail: String(e) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const res = await fetch(`${B}/attendance/api/mobile/manager/branches/${id}/`, {
      method: "DELETE",
      headers: { Authorization: auth, "Host": "jssolutions-eg.com" },
    });
    const data = await res.json().catch(() => ({ success: true }));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: "Network error", detail: String(e) }, { status: 500 });
  }
}
'''

branches_file.write_text(new_branches, encoding="utf-8")
print(f"[OK] branches/route.ts saved: {branches_file.stat().st_size} bytes")
print("[SUCCESS] Web routes updated!")
