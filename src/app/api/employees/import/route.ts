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
      // رد مش مفهوم من السيرفر = حصلت مشكلة؛ نقول كده بدل "جاري"
      return NextResponse.json(
        {
          success: false,
          message: `حصلت مشكلة في السيرفر أثناء الاستيراد (${response.status}). راجع سجل الاستيراد قبل ما تعيد المحاولة.`,
        },
        { status: response.ok ? 502 : response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    console.error("Import upload error:", error);
    const err = error as { name?: string; message?: string };

    if (err.name === "AbortError") {
      // الملف كبير والسيرفر لسه بيشتغل عليه: مانقولش "نجح" لأننا مانعرفش النتيجة
      return NextResponse.json(
        {
          success: false,
          pending: true,
          message: "الاستيراد لسه شغال على السيرفر. راجع سجل الاستيراد بعد دقيقة عشان تعرف النتيجة، وماتعيدش رفع الملف.",
        },
        { status: 202 }
      );
    }

    return NextResponse.json(
      { success: false, message: err.message || "خطأ في رفع الملف" },
      { status: 500 }
    );
  }
}
