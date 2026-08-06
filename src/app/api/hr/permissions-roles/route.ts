import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API = "https://jssolutions-eg.com";

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization");
    if (!auth) {
      return NextResponse.json({ success: false, message: "Missing authorization" }, { status: 401 });
    }

    const res = await fetch(`${API}/attendance/api/mobile/manager/permissions/roles/`, {
      method: "GET",
      headers: { Authorization: auth },
      cache: "no-store",
    });

    const data = await res.json();

    // normalize — الباك بيرجع { roles: [...] } بدون success
    return NextResponse.json({
      success: true,
      roles: data.roles ?? data.data ?? data ?? [],
    }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Proxy error" }, { status: 500 });
  }
}
