import { NextResponse } from "next/server";

const BACKEND = "https://jssolutions-eg.com";

// تقرير الزيارات الميدانية: JSON للعرض، أو ملف Excel/PDF لو format=xlsx|pdf
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const params = new URLSearchParams();
  for (const k of ["date_from", "date_to", "employee_id", "status", "visit_type"]) {
    const v = url.searchParams.get(k);
    if (v) params.set(k, v);
  }
  const format = url.searchParams.get("format");
  if (format) params.set("export", format);
  try {
    const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/reports/field-visits/?${params}`, {
      headers: { Authorization: auth, "Accept-Language": "ar" },
      cache: "no-store",
    });
    if (format && res.ok) {
      const buf = await res.arrayBuffer();
      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Type": res.headers.get("content-type") || "application/octet-stream",
          "Content-Disposition": res.headers.get("content-disposition") || `attachment; filename="field_visits.${format === "pdf" ? "pdf" : "xlsx"}"`,
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
