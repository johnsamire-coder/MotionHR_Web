import { NextRequest, NextResponse } from "next/server";

const BACKEND = "https://jssolutions-eg.com";

// الخروج بيعدي من السيرفر بتاعنا (قبل كده المتصفح كان بيكلم السيرفر الأساسي مباشرة فالطلب غالباً بيترفض والجلسة تفضل شغالة)
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ success: true });
  try {
    const res = await fetch(`${BACKEND}/attendance/api/mobile/logout/`, {
      method: "POST",
      headers: { Authorization: authHeader, Accept: "application/json" },
      cache: "no-store",
    });
    return NextResponse.json({ success: res.ok }, { status: res.ok ? 200 : res.status });
  } catch {
    return NextResponse.json({ success: false }, { status: 502 });
  }
}
