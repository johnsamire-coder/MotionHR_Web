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
    // source=web: عشان السيرفر مايسجلش تنبيه "GPS مقفول" كل ما صفحة تتفتح
    const statusRes = await fetch(`${BACKEND}/attendance/api/mobile/status/?source=web`, {
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

      // حساب إدارة مالوش ملف موظف: نعرض دوره الحقيقي بدل "مسؤول النظام" للكل
      const roleLabel = roleMap[permData?.role] || "";
      return NextResponse.json(
        {
          id: 0,
          full_name: roleLabel,
          name: roleLabel,
          role: permData?.role || "company_admin",
          job_title: roleMap[permData?.role] || "إدارة النظام",
          department: "الإدارة العامة",
          is_admin: true,
          permissions: permData?.permissions || [],
        },
        { status: 200 }
      );
    }

    // مانرجعش بيانات "مسؤول النظام" وهمية لو حصل خطأ
    return NextResponse.json({ error: "تعذر تحميل الملف الشخصي" }, { status: statusRes.status >= 400 ? statusRes.status : 502 });
  } catch (error) {
    return NextResponse.json({ error: "Network error" }, { status: 502 });
  }
}
