import { NextRequest, NextResponse } from "next/server";

const BACKEND = "https://jssolutions-eg.com";

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const q = sp.toString();
  const url = `${BACKEND}/attendance/api/mobile/manager/leaves/list/${q ? `?${q}` : ""}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: auth, "Accept-Language": "ar" },
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
