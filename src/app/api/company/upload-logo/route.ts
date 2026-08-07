import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const BACKEND = "https://jssolutions-eg.com";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const logo = formData.get("logo");
    if (!logo) {
      return NextResponse.json({ success: false, error: "No logo file" }, { status: 400 });
    }

    const backendFormData = new FormData();
    backendFormData.append("logo", logo);

    const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/company-info/upload-logo/`, {
      method: "POST",
      headers: { Authorization: authHeader },
      body: backendFormData,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "Network error" }, { status: 500 });
  }
}
