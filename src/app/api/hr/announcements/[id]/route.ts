import { NextResponse } from "next/server";

const BACKEND = "https://jssolutions-eg.com";

// GET stats
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/announcements/${id}/stats/`, {
      headers: { Authorization: authHeader, "Accept-Language": "ar" },
      cache: "no-store",
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}

// PUT / PATCH update
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/announcements/${id}/update/`, {
      method: "PUT",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        "Accept-Language": "ar",
      },
      body: JSON.stringify(body),
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}

// DELETE announcement
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/announcements/${id}/delete/`, {
      method: "DELETE",
      headers: { Authorization: authHeader, "Accept-Language": "ar" },
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
