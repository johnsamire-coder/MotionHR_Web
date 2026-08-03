import { NextRequest, NextResponse } from "next/server";

const BACKEND = "https://jssolutions-eg.com/attendance/api/mobile/manager/departments/";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const response = await fetch(BACKEND, {
      method: "GET",
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: `فشل تحميل الأقسام (${response.status})` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Departments GET error:", error);
    return NextResponse.json(
      { success: false, message: "خطأ في الاتصال بالسيرفر" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const body = await request.json();

    const response = await fetch(BACKEND, {
      method: "POST",
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Departments POST error:", error);
    return NextResponse.json(
      { success: false, message: "خطأ في إنشاء القسم" },
      { status: 500 }
    );
  }
}
