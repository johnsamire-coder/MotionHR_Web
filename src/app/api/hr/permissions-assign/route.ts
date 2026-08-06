import { NextResponse } from "next/server";
const BACKEND = "https://jssolutions-eg.com";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const { action, ...rest } = body;
    const url = action === "assign"
      ? `${BACKEND}/attendance/api/mobile/manager/permissions/assign-role/`
      : `${BACKEND}/attendance/api/mobile/manager/permissions/remove-role/`;
    const method = action === "assign" ? "POST" : "DELETE";
    const res = await fetch(url, {
      method,
      headers: { Authorization: authHeader, "Content-Type": "application/json", "Accept-Language": "ar" },
      body: JSON.stringify(rest),
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
