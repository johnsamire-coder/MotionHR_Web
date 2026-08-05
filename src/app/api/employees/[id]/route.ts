import { NextRequest, NextResponse } from "next/server";

const BACKEND = "https://jssolutions-eg.com";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get("authorization");

    const response = await fetch(
      `${BACKEND}/attendance/api/mobile/manager/employees/${id}/`,
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
    console.error("Employee detail GET error:", error);
    return NextResponse.json(
      { success: false, message: "Network error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get("authorization");
    const body = await request.json();

    const response = await fetch(
      `${BACKEND}/attendance/api/mobile/manager/employees/${id}/update/`,
      {
        method: "PUT",
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
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
    console.error("Employee detail PUT error:", error);
    return NextResponse.json(
      { success: false, message: "Network error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  return PUT(request, ctx);
}
