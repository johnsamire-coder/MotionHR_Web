import sys
sys.stdout.reconfigure(encoding="utf-8")
from pathlib import Path

# 1) نصلح [id]/route.ts للحذف
p_delete = Path("src/app/api/hr/work-locations/[id]/route.ts")
delete_content = '''import { NextResponse } from "next/server";
const BACKEND = "https://jssolutions-eg.com";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/work-locations/${id}/delete/`, {
      method: "DELETE",
      headers: { Authorization: authHeader, "Host": "jssolutions-eg.com" },
    });
    const data = await res.json().catch(() => ({ success: res.ok }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const res = await fetch(`${BACKEND}/attendance/api/mobile/work-locations/${id}/`, {
      headers: { Authorization: authHeader, "Host": "jssolutions-eg.com" },
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
'''
p_delete.parent.mkdir(parents=True, exist_ok=True)
p_delete.write_text(delete_content, encoding="utf-8")
print(f"[OK] {p_delete}")

# 2) نضيف assign-employees route
p_assign = Path("src/app/api/hr/work-locations/[id]/assign-employees/route.ts")
p_assign.parent.mkdir(parents=True, exist_ok=True)
assign_content = '''import { NextResponse } from "next/server";
const BACKEND = "https://jssolutions-eg.com";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/work-locations/${id}/assign-employees/`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        "Host": "jssolutions-eg.com",
      },
      body: JSON.stringify(body),
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
'''
p_assign.write_text(assign_content, encoding="utf-8")
print(f"[OK] {p_assign}")

print("[SUCCESS] Web routes created!")
