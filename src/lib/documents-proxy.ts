import { NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_BASE || "https://jssolutions-eg.com";

// وسيط مستندات الموظف: بيعدّي الطلب زي ما هو (JSON أو رفع ملف) ويرجّع رد الباك إند بنفس الحالة
export async function forwardDocuments(request: Request, empId: string, docId?: string) {
  const auth = request.headers.get("authorization");
  if (!auth) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  if (!/^\d+$/.test(empId) || (docId !== undefined && !/^\d+$/.test(docId))) {
    return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
  }
  const headers: Record<string, string> = { Authorization: auth };
  const ct = request.headers.get("content-type");
  if (ct) headers["Content-Type"] = ct;
  try {
    const res = await fetch(
      `${BACKEND}/attendance/api/mobile/manager/employees/${empId}/documents/${docId ? `${docId}/` : ""}`,
      {
        method: request.method,
        headers,
        body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
        cache: "no-store",
      },
    );
    const text = await res.text();
    try { return NextResponse.json(JSON.parse(text), { status: res.status }); }
    catch { return NextResponse.json({ success: false, message: "Backend error" }, { status: res.ok ? 502 : res.status }); }
  } catch {
    return NextResponse.json({ success: false, message: "Network error" }, { status: 502 });
  }
}
