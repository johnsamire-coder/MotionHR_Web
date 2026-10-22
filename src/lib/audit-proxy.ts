import { NextResponse } from "next/server";

const BACKEND = "https://jssolutions-eg.com";

// وسيط مشترك لتقارير سجل التعديلات: JSON أو ملف Excel لو export=xlsx
export async function auditProxy(request: Request, backendPath: string) {
  const auth = request.headers.get("authorization");
  if (!auth) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  try {
    const res = await fetch(`${BACKEND}${backendPath}${url.search}`, {
      headers: { Authorization: auth, "Accept-Language": "ar" },
      cache: "no-store",
    });
    if (url.searchParams.get("export") && res.ok) {
      const buf = await res.arrayBuffer();
      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Type": res.headers.get("content-type") || "application/octet-stream",
          "Content-Disposition": res.headers.get("content-disposition") || 'attachment; filename="audit.xlsx"',
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
