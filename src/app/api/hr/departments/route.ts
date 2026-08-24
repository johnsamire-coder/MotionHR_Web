import { NextResponse } from "next/server";
const BACKEND = "https://jssolutions-eg.com";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const qs = searchParams.toString();
    const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/departments/${qs ? `?${qs}` : ""}`, {
      headers: { Authorization: authHeader },
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: "Network error", detail: String(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/departments/`, {
      method: "POST",
      headers: { Authorization: authHeader, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: "Network error", detail: String(e) }, { status: 500 });
  }
}
