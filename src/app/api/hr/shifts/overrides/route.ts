import { NextRequest, NextResponse } from "next/server";
const BACKEND = process.env.NEXT_PUBLIC_API_BASE || "https://jssolutions-eg.com";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const { searchParams } = new URL(req.url);
  const query = searchParams.toString();
  const res = await fetch(
    `${BACKEND}/attendance/api/mobile/manager/shifts/overrides/${query ? `?${query}` : ""}`,
    { headers: { Authorization: auth } }
  );
  return NextResponse.json(await res.json());
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const body = await req.json();
  const res = await fetch(
    `${BACKEND}/attendance/api/mobile/manager/shifts/override/create/`,
    {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  return NextResponse.json(await res.json());
}
