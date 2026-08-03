import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const url = new URL(request.url);
    const queryString = url.search;

    const response = await fetch(
      `https://jssolutions-eg.com/attendance/api/mobile/manager/employees/${queryString}`,
      {
        method: "GET",
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Employees list failed:", response.status, errorText.substring(0, 200));
      return NextResponse.json(
        { success: false, message: `فشل تحميل الموظفين (${response.status})` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Employees list error:", error);
    return NextResponse.json(
      { success: false, message: "خطأ في الاتصال بالسيرفر" },
      { status: 500 }
    );
  }
}
