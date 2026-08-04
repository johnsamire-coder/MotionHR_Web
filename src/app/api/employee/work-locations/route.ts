import { NextResponse } from "next/server";
const BACKEND = "https://jssolutions-eg.com";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const lang = request.headers.get("accept-language") || "ar";
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const types = url.searchParams.get("types") === "true";
  const endpoint = types
    ? `${BACKEND}/attendance/api/mobile/work-locations/types/`
    : `${BACKEND}/attendance/api/mobile/work-locations/`;
  try {
    const res = await fetch(endpoint, {
      headers: {
        Authorization: authHeader,
        "Accept-Language": lang,
        "Host": "jssolutions-eg.com",
      },
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const lang = request.headers.get("accept-language") || "ar";
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND}/attendance/api/mobile/work-locations/propose/`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        "Accept-Language": lang,
        "Host": "jssolutions-eg.com",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
