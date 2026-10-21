import { NextResponse } from "next/server";

const BACKEND = "https://jssolutions-eg.com";
const ALLOWED = /^(devices(\/\d+)?|user-map|upload|report)$/;

// وسيط أجهزة البصمة: بيعدّي الطلب زي ما هو (JSON أو رفع ملف) ويرجّع الرد (JSON أو ملف Excel)
async function forward(request: Request, path: string[]) {
  const auth = request.headers.get("authorization");
  if (!auth) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  const sub = path.join("/");
  if (!ALLOWED.test(sub)) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
  const url = new URL(request.url);
  const headers: Record<string, string> = { Authorization: auth, "Accept-Language": "ar" };
  const ct = request.headers.get("content-type");
  if (ct) headers["Content-Type"] = ct;
  try {
    const res = await fetch(`${BACKEND}/biometric/api/${sub}/${url.search}`, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
      cache: "no-store",
    });
    const rct = res.headers.get("content-type") || "";
    if (res.ok && !rct.includes("json")) {
      return new NextResponse(await res.arrayBuffer(), {
        status: 200,
        headers: {
          "Content-Type": rct || "application/octet-stream",
          "Content-Disposition": res.headers.get("content-disposition") || 'attachment; filename="biometric.xlsx"',
        },
      });
    }
    const text = await res.text();
    try { return NextResponse.json(JSON.parse(text), { status: res.status }); }
    catch { return NextResponse.json({ success: false, message: "Backend error" }, { status: res.ok ? 502 : res.status }); }
  } catch {
    return NextResponse.json({ success: false, message: "Network error" }, { status: 502 });
  }
}

type Ctx = { params: Promise<{ path: string[] }> };
export async function GET(r: Request, { params }: Ctx) { return forward(r, (await params).path); }
export async function POST(r: Request, { params }: Ctx) { return forward(r, (await params).path); }
export async function PATCH(r: Request, { params }: Ctx) { return forward(r, (await params).path); }
export async function DELETE(r: Request, { params }: Ctx) { return forward(r, (await params).path); }
