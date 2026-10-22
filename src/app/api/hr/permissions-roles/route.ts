import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API = "https://jssolutions-eg.com";

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization");
    if (!auth) {
      return NextResponse.json({ success: false, message: "Missing authorization" }, { status: 401 });
    }

    const res = await fetch(`${API}/attendance/api/mobile/manager/permissions/roles/`, {
      method: "GET",
      headers: { Authorization: auth },
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));

    // لو السيرفر رفض (زي مدير الـ HR: الأدوار لصاحب الشركة بس) نرجّع الرفض زي ما هو
    // (قبل كده كان بيرجع "نجاح" والصفحة تقع شاشة بيضا)
    if (!res.ok) {
      return NextResponse.json({
        success: false,
        roles: [],
        message: data.error || data.message || "غير مصرح",
      }, { status: res.status });
    }

    const roles = data.roles ?? data.data ?? data;
    return NextResponse.json({
      success: true,
      roles: Array.isArray(roles) ? roles : [],
    }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Proxy error" }, { status: 500 });
  }
}
