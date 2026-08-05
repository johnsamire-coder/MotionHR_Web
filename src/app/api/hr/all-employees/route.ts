import { NextResponse } from "next/server";
const B = "https://jssolutions-eg.com";
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const backendUrl = `${B}/attendance/api/mobile/manager/employees/${search ? `?search=${encodeURIComponent(search)}` : ""}`;
    const res = await fetch(backendUrl, {
      headers: { Authorization: auth, "Host": "jssolutions-eg.com" },
      cache: "no-store",
    });
    const text = await res.text();
    try { return NextResponse.json(JSON.parse(text), { status: res.status }); }
    catch { return NextResponse.json({ error: "Backend error", detail: text.substring(0,200) }, { status: 500 }); }
  } catch (e) {
    return NextResponse.json({ error: "Network error", detail: String(e) }, { status: 500 });
  }
}
