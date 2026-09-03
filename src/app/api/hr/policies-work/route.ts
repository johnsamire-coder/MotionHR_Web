import { NextResponse } from "next/server";

const BACKEND = "https://jssolutions-eg.com";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/work-policy/`, {
      headers: { Authorization: authHeader, "Accept-Language": "ar" },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ error: "Backend error" }, { status: res.status });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/work-policy/save/`, {
      method: "POST",
      headers: { Authorization: authHeader, "Content-Type": "application/json", "Accept-Language": "ar" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return NextResponse.json({ error: "Backend error" }, { status: res.status });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
