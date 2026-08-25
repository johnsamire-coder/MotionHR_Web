import { NextResponse } from "next/server";
const DJANGO_URL = process.env.NEXT_PUBLIC_API_URL || "https://jssolutions-eg.com";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const body = await req.text();
  try {
    const res = await fetch(`${DJANGO_URL}/attendance/api/mobile/manager/shifts/assign/`, {
      method: "POST",
      headers: { "Authorization": auth, "Content-Type": "application/json" },
      body,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Backend fetch failed" }, { status: 500 });
  }
}
