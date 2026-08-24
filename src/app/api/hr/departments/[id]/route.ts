import { NextResponse } from "next/server";
const BACKEND = "https://jssolutions-eg.com";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/departments/${id}/`, {
      method: "PUT",
      headers: { Authorization: authHeader, "Content-Type": "application/json", Host: "jssolutions-eg.com" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    try {
      return NextResponse.json(JSON.parse(text), { status: res.status });
    } catch {
      return NextResponse.json({ error: "Backend error", detail: text.substring(0, 200) }, { status: res.status });
    }
  } catch (e) {
    return NextResponse.json({ error: "Network error", detail: String(e) }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/departments/${id}/`, {
      method: "DELETE",
      headers: { Authorization: authHeader, Host: "jssolutions-eg.com" },
    });
    const text = await res.text();
    try {
      return NextResponse.json(JSON.parse(text), { status: res.status });
    } catch {
      return NextResponse.json({ error: "Backend error", detail: text.substring(0, 200) }, { status: res.status });
    }
  } catch (e) {
    return NextResponse.json({ error: "Network error", detail: String(e) }, { status: 500 });
  }
}