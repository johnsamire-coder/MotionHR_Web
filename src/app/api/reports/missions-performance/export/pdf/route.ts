import { NextRequest, NextResponse } from "next/server";

const BACKEND = "https://jssolutions-eg.com";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();

  try {
    const url = `${BACKEND}/attendance/api/mobile/manager/reports/missions-performance/export/pdf/${qs ? "?" + qs : ""}`;
    const res = await fetch(url, { headers: { Authorization: authHeader }, cache: "no-store" });
    if (!res.ok) return NextResponse.json({ error: "Export failed" }, { status: res.status });

    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="missions-performance.pdf"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
