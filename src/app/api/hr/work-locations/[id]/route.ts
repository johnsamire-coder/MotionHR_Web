import { NextResponse } from "next/server";
const BACKEND = "https://jssolutions-eg.com";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "approve";
  const endpoint = action === "reject"
    ? `${BACKEND}/attendance/api/mobile/manager/work-locations/${id}/reject/`
    : `${BACKEND}/attendance/api/mobile/manager/work-locations/${id}/approve/`;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: authHeader },
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
