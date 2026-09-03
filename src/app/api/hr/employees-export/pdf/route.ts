import { NextResponse } from "next/server";
const BACKEND = "https://jssolutions-eg.com";
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const res = await fetch(
      `${BACKEND}/attendance/api/mobile/manager/employees/export/pdf/`,
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
        "Content-Disposition": `attachment; filename="employees.pdf"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
