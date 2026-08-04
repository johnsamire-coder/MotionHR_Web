import { NextRequest, NextResponse } from "next/server";

const BACKEND = "https://jssolutions-eg.com";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const lang = request.headers.get("accept-language") || "ar";

    const response = await fetch(
      `${BACKEND}/attendance/api/mobile/login/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Accept-Language": lang,
          "Host": "jssolutions-eg.com",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );

    const raw = await response.json();
    const appMode = raw.app_mode || raw.role || "employee";

    const normalized = {
      ...raw,
      success: raw.success ?? response.ok,
      token: raw.token || raw.access || "",
      refreshToken: raw.refresh || "",
      role: raw.role || appMode,
      app_mode: appMode,

      user: raw.user || {
        id: raw.employee?.id ?? null,
        username: raw.username || body.username || "",
        first_name: raw.first_name || raw.employee?.first_name || "",
        full_name: raw.full_name || raw.employee?.name || "",
        name: raw.full_name || raw.employee?.name || "",
        role: raw.role || appMode,
        app_mode: appMode,
        gender: raw.gender || raw.employee?.gender || "",
        must_change_password: !!raw.must_change_password,
      },

      company: raw.company || {
        id: raw.company_id ?? null,
        name: raw.company_name || raw.employee?.company || "",
      },

      employee: raw.employee || {
        id: null,
        name: raw.full_name || "",
        first_name: raw.first_name || "",
        gender: raw.gender || "",
        company: raw.company_name || "",
        is_field_worker: false,
        stealth_tracking_enabled: false,
        should_track: false,
      },
    };

    return NextResponse.json(normalized, { status: response.status });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { success: false, message: "خطأ في الاتصال بالسيرفر" },
      { status: 500 }
    );
  }
}
