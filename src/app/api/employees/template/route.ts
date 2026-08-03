import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    const response = await fetch(
      "https://jssolutions-eg.com/employees/api/mobile/import-template/",
      {
        method: "GET",
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Template download failed:", response.status, errorText.substring(0, 200));
      return NextResponse.json(
        { success: false, message: `فشل تحميل النموذج (${response.status})` },
        { status: response.status }
      );
    }

    const blob = await response.blob();
    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="employee_import_template.xlsx"',
      },
    });
  } catch (error) {
    console.error("Template download error:", error);
    return NextResponse.json(
      { success: false, message: "خطأ في تحميل النموذج" },
      { status: 500 }
    );
  }
}
