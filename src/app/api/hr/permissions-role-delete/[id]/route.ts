import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API = "https://jssolutions-eg.com";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = request.headers.get("authorization");
    if (!auth) {
      return NextResponse.json({ success: false, message: "Missing authorization header" }, { status: 401 });
    }

    const { id } = await params;

    const res = await fetch(`${API}/attendance/api/mobile/manager/permissions/roles/${id}/delete/`, {
      method: "DELETE",
      headers: { Authorization: auth },
      cache: "no-store",
    });

    const text = await res.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { success: res.ok, message: text || "Non-JSON response" };
    }

    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, message: "Proxy error" }, { status: 500 });
  }
}
