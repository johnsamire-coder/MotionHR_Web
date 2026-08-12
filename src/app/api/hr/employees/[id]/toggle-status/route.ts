import { NextResponse } from "next/server";
const BACKEND = "https://jssolutions-eg.com";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const body = await request.json();
    const res = await fetch(
      `${BACKEND}/attendance/api/mobile/manager/employees/${id}/toggle-status/`,
      {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ status: body.status }),
      }
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
