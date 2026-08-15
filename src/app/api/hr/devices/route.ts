import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_BASE || "https://jssolutions-eg.com";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const qs = req.nextUrl.searchParams.toString();
  const url = `${BACKEND}/attendance/api/mobile/manager/devices/${qs ? `?${qs}` : ""}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: auth },
      cache: "no-store",
    });
    const text = await res.text();
    try {
      return NextResponse.json(JSON.parse(text), { status: res.status });
    } catch {
      return NextResponse.json({ error: text.substring(0, 300) }, { status: 500 });
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
