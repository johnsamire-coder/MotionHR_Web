import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const formData = await request.formData();

    const response = await fetch(
      "https://jssolutions-eg.com/employees/api/mobile/import-excel/",
      {
        method: "POST",
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: formData,
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Import upload error:", error);
    return NextResponse.json(
      { success: false, message: "خطأ في رفع الملف" },
      { status: 500 }
    );
  }
}
