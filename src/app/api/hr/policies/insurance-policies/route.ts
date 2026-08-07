import { NextResponse } from "next/server";

const BACKEND = "https://jssolutions-eg.com";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const lang = request.headers.get("accept-language") || "ar";
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.toString();
    const url = `${BACKEND}/attendance/api/mobile/manager/insurance-policies/${query ? `?${query}` : ""}`;

    const res = await fetch(url, {
      headers: {
        Authorization: authHeader,
        "Accept-Language": lang,
      },
      cache: "no-store",
    });
    return NextResponse.json(await res.json(), { status: res.status });
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
    const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/insurance-policies/`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        "Accept-Language": lang,
      },
      body: JSON.stringify(body),
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
