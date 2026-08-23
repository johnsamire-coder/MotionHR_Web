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
    return NextResponse.json(await res.json(), { status: res.status });
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
    return NextResponse.json(await res.json(), { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: "Network error", detail: String(e) }, { status: 500 });
  }
}