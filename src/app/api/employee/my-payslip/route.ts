import { NextResponse } from "next/server";

const BACKEND = "https://jssolutions-eg.com";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.toString();
    const url = `${BACKEND}/attendance/api/mobile/employee/payslip/${query ? `?${query}` : ""}`;

    const res = await fetch(url, {
      headers: { Authorization: authHeader, "Accept-Language": "ar" },
      cache: "no-store",
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}