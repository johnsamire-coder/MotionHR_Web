import { NextRequest, NextResponse } from "next/server";
const BACKEND = process.env.NEXT_PUBLIC_API_BASE || "https://jssolutions-eg.com";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const res = await fetch(`${BACKEND}/attendance/api/mobile/charter/`, {
    headers: { Authorization: auth },
  });
  return NextResponse.json(await res.json());
}
