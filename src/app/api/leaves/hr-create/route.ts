import { NextResponse } from "next/server";
const BACKEND = "https://jssolutions-eg.com";

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND}/attendance/api/mobile/hr/create-leave/`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    try { return NextResponse.json(JSON.parse(text), { status: res.status }); }
    catch { return NextResponse.json({ error: "Backend error" }, { status: 500 }); }
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
