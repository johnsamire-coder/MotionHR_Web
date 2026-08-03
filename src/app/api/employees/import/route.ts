import { NextRequest, NextResponse } from "next/server";

// Extend timeout for large imports (5 minutes)
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const formData = await request.formData();

    // Set fetch with longer timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 290000); // 4 min 50 sec

    const response = await fetch(
      "https://jssolutions-eg.com/employees/api/mobile/import-excel/",
      {
        method: "POST",
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: formData,
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    // Handle non-JSON responses (e.g., HTML errors)
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Non-JSON response:", text.substring(0, 300));
      return NextResponse.json(
        {
          success: false,
          message: `الاستيراد جاري - قد تحتاج تحديث الصفحة للتأكد (${response.status})`,
        },
        { status: 200 } // نرجع 200 عشان الويب مايظهرش خطأ
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    console.error("Import upload error:", error);
    const err = error as { name?: string; message?: string };

    if (err.name === "AbortError") {
      return NextResponse.json(
        {
          success: true,
          message: "الاستيراد جاري في الخلفية - راجع قائمة الموظفين بعد دقيقة",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: false, message: err.message || "خطأ في رفع الملف" },
      { status: 500 }
    );
  }
}
