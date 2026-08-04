import { NextResponse } from "next/server";
const BACKEND = "https://jssolutions-eg.com";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "offboard";
  const endpoint = action === "reactivate"
    ? `${BACKEND}/attendance/api/mobile/manager/offboarding/${id}/reactivate/`
    : `${BACKEND}/attendance/api/mobile/manager/offboarding/${id}/`;
  try {
    const body = await request.json();
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: authHeader, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
