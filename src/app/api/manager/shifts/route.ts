import { NextResponse } from "next/server";
const DJANGO_URL = process.env.NEXT_PUBLIC_API_URL || "https://jssolutions-eg.com";

async function proxy(req: Request, method: string) {
  const auth = req.headers.get("authorization") || "";
  const body = method !== "GET" ? await req.text() : undefined;
  try {
    const res = await fetch(`${DJANGO_URL}/attendance/api/mobile/manager/shifts/`, {
      method,
      headers: { "Authorization": auth, "Content-Type": "application/json" },
      body: body || undefined,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Backend fetch failed" }, { status: 500 });
  }
}

export async function GET(req: Request) { return proxy(req, "GET"); }
export async function POST(req: Request) { return proxy(req, "POST"); }
