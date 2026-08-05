import { NextRequest, NextResponse } from "next/server";

const BACKEND = "https://jssolutions-eg.com";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const url = new URL(request.url);
    const search = url.search || "";

    const response = await fetch(
      `${BACKEND}/attendance/api/mobile/manager/employees/managers/${search}`,
      {
        method: "GET",
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const text = await response.text();
    try {
      return NextResponse.json(JSON.parse(text), { status: response.status });
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid backend response", detail: text.substring(0, 500) },
        { status: response.status || 500 }
      );
    }
  } catch (error) {
    console.error("Employees managers GET error:", error);
    return NextResponse.json(
      { success: false, message: "Network error" },
      { status: 500 }
    );
  }
}
