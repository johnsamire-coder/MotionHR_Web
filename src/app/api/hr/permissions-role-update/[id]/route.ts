import { NextResponse } from "next/server";

const BACKEND = "https://jssolutions-eg.com";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();

    const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/permissions/roles/${id}/update/`, {
      method: "PUT",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        "Accept-Language": "ar",
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let data: any = {};
    try { data = text ? JSON.parse(text) : {}; }
    catch { data = { success: false, message: text }; }

    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "Network error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;

    const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/permissions/roles/${id}/delete/`, {
      method: "DELETE",
      headers: { Authorization: authHeader, "Accept-Language": "ar" },
    });

    const text = await res.text();
    let data: any = {};
    try { data = text ? JSON.parse(text) : {}; }
    catch { data = { success: false, message: text }; }

    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "Network error" }, { status: 500 });
  }
}
