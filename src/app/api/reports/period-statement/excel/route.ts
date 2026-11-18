import { NextResponse } from "next/server";

const BACKEND = "https://jssolutions-eg.com";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  url.searchParams.set("export", "xlsx");
  try {
    const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/reports/period-statement/?${url.searchParams.toString()}`, {
      headers: { Authorization: authHeader },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ error: "Excel export failed" }, { status: res.status });
    const blob = await res.blob();
    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="period_statement.xlsx"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
