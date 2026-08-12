import { NextRequest, NextResponse } from "next/server";

const BACKEND = "https://jssolutions-eg.com";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();

  try {
    const url = `${BACKEND}/attendance/api/mobile/manager/reports/insurance/${qs ? "?" + qs : ""}`;
    const res = await fetch(url, { headers: { Authorization: authHeader }, cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
