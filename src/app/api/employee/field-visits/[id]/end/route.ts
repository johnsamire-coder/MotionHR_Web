import { NextResponse } from "next/server";
const BACKEND = "https://jssolutions-eg.com";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get("authorization");
  const lang = request.headers.get("accept-language") || "ar";
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const body = await request.json();
    const res = await fetch(
      `${BACKEND}/attendance/api/mobile/field-visits/end/${id}/`,
      {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
          "Accept-Language": lang,
          "Host": "jssolutions-eg.com",
        },
        body: JSON.stringify(body),
      }
    );
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
