import { NextResponse } from "next/server";
const BACKEND = "https://jssolutions-eg.com";
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const res = await fetch(`${BACKEND}/attendance/api/mobile/charters/my/`, {
      headers: { Authorization: authHeader },
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
