import { NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_BASE || "https://jssolutions-eg.com";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = request.headers.get("authorization") || "";

  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/devices/${id}/action/`, {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    try {
      return NextResponse.json(JSON.parse(text), { status: res.status });
    } catch {
      return NextResponse.json({ error: text.substring(0, 300) }, { status: 500 });
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
