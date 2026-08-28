import { NextResponse } from "next/server";
const BACKEND = "https://jssolutions-eg.com";
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || "";
  try {
    const res = await fetch(
      `${BACKEND}/attendance/api/mobile/manager/attendance/export/pdf/?date=${date}`,
      { headers: { Authorization: authHeader }, cache: "no-store" }
    );
    if (!res.ok) {
      return NextResponse.json({ error: "PDF export failed" }, { status: res.status });
    }
    const blob = await res.blob();
    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="attendance_${date}.pdf"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
