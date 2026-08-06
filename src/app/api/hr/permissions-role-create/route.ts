import { NextResponse } from "next/server";

const BACKEND = "https://jssolutions-eg.com";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/permissions/roles/create/`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        "Accept-Language": "ar",
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { success: false, message: text || "Invalid backend response" };
    }

    if (res.ok && data?.success) {
      return NextResponse.json(
        {
          success: true,
          role: data.role ?? {
            id: data.role_id,
            name: body.name,
            permissions: [],
          },
          message: data.message ?? "Role created successfully",
        },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: "Network error" }, { status: 500 });
  }
}
