import { NextResponse } from "next/server";
const B = "https://jssolutions-eg.com";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = request.headers.get("authorization");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const res = await fetch(`${B}/attendance/api/mobile/manager/payroll/runs/${id}/cancel/`, {
      method: "POST",
      headers: {
        Authorization: auth,
        "Host": "jssolutions-eg.com",
      },
    });
    const text = await res.text();
    try {
      return NextResponse.json(JSON.parse(text), { status: res.status });
    } catch {
      return NextResponse.json({ error: text.substring(0, 200) }, { status: 500 });
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
