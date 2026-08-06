import { NextResponse } from "next/server";
const BACKEND = "https://jssolutions-eg.com";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/permissions/roles/${params.id}/update/`, {
      method: "PUT",
      headers: { Authorization: authHeader, "Content-Type": "application/json", "Accept-Language": "ar" },
      body: JSON.stringify(body),
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/permissions/roles/${params.id}/delete/`, {
      method: "DELETE",
      headers: { Authorization: authHeader, "Accept-Language": "ar" },
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}