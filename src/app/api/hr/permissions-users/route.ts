import { NextResponse } from "next/server";

const BACKEND = "https://jssolutions-eg.com";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = `${BACKEND}/attendance/api/mobile/manager/permissions/users/`;
    const res = await fetch(url, {
      headers: { Authorization: authHeader, "Accept-Language": "ar" },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ error: "Backend error" }, { status: res.status });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
