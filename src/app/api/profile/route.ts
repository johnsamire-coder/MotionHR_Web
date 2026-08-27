import { NextRequest, NextResponse } from "next/server";

const BACKEND = "https://jssolutions-eg.com";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cookieToken = request.cookies.get("token")?.value || request.cookies.get("auth_token")?.value;
    const token = authHeader?.replace("Token ", "")?.replace("Bearer ", "") || cookieToken;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const headers = {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
      "Accept-Language": "ar",
    };

    // 1. محاولة جلب بيانات الموظف
    const statusRes = await fetch(`${BACKEND}/attendance/api/mobile/status/`, {
      headers,
      cache: "no-store",
    });

    const statusData = await statusRes.json().catch(() => null);

    if (statusRes.ok && statusData?.success !== false && statusData?.employee) {
      return NextResponse.json(statusData.employee, { status: 200 });
    }

    // 2. إذا كان المستخدم مديراً/أدمن وليس موظفاً مسجلاً ككادر عادي، نجلب الصلاحيات
    const permRes = await fetch(`${BACKEND}/attendance/api/mobile/permissions/my/`, {
      headers,
      cache: "no-store",
    });

    if (permRes.ok) {
      const permData = await permRes.json().catch(() => null);
      const roleMap: Record<string, string> = {
        company_admin: "مدير الشركة / النظام",
        super_admin: "مدير عام النظام",
        hr_manager: "مدير الموارد البشرية",
        manager: "مدير القسم",
      };

      return NextResponse.json(
        {
          id: 0,
          full_name: "مسؤول النظام",
          name: "مسؤول النظام",
          role: permData?.role || "company_admin",
          job_title: roleMap[permData?.role] || "إدارة النظام",
          department: "الإدارة العامة",
          is_admin: true,
          permissions: permData?.permissions || [],
        },
        { status: 200 }
      );
    }

    // استجابة آمنة لمنع أي انهيار في الـ Header
    return NextResponse.json(
      {
        job_title: "مسؤول النظام",
        department: "الإدارة العامة",
        role: "admin",
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        job_title: "مسؤول النظام",
        department: "الإدارة العامة",
        role: "admin",
      },
      { status: 200 }
    );
  }
}
