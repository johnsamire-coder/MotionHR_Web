import { NextResponse } from "next/server";
import { todayCairo } from "@/lib/utils";
const BACKEND = "https://jssolutions-eg.com";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const date = url.searchParams.get("date") || todayCairo();
  try {
    const res = await fetch(
      `${BACKEND}/attendance/api/mobile/manager/attendance/?date=${date}`,
      { headers: { Authorization: authHeader }, cache: "no-store" }
    );
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
