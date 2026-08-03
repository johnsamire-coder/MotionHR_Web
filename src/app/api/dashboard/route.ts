import { NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "https://jssolutions-eg.com";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(
      `${BACKEND}/attendance/api/mobile/manager/employees/?page_size=1`,
      {
        headers: {
          Authorization: authHeader,
          "Accept-Language": "ar",
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Backend error" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({
      total_employees: data.count ?? 0,
    });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
