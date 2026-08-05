import { NextResponse } from "next/server";
const B = "https://jssolutions-eg.com";
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const res = await fetch(`${B}/attendance/api/mobile/manager/payroll/runs/`, {
      headers: { Authorization: auth, "Host": "jssolutions-eg.com" },
      cache: "no-store",
    });
    const text = await res.text();
    try { return NextResponse.json(JSON.parse(text), { status: res.status }); }
    catch { return NextResponse.json({ error: text.substring(0,200) }, { status: 500 }); }
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const res = await fetch(`${B}/attendance/api/mobile/manager/payroll/run/create/`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json", "Host": "jssolutions-eg.com" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    try { return NextResponse.json(JSON.parse(text), { status: res.status }); }
    catch { return NextResponse.json({ error: text.substring(0,200) }, { status: 500 }); }
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
