import { NextResponse } from "next/server";

const BACKEND = "https://jssolutions-eg.com";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = request.headers.get("authorization");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/reports/field-visits/${encodeURIComponent(id)}/`, {
      headers: { Authorization: auth, "Accept-Language": "ar" },
      cache: "no-store",
    });
    const text = await res.text();
    try { return NextResponse.json(JSON.parse(text), { status: res.status }); }
    catch { return NextResponse.json({ success: false, message: "Backend error" }, { status: res.ok ? 502 : res.status }); }
  } catch {
    return NextResponse.json({ success: false, message: "Network error" }, { status: 502 });
  }
}
