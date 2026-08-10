import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE = "https://jssolutions-eg.com/attendance/api/mobile/manager/shifts";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const response = await fetch(`${BACKEND_BASE}/`, {
      method: "GET",
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: `فشل تحميل الشيفتات (${response.status})` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Shifts GET error:", error);
    return NextResponse.json(
      { success: false, message: "خطأ في الاتصال بالسيرفر" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const body = await request.json();

    const response = await fetch(`${BACKEND_BASE}/create/`, {
      method: "POST",
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Shifts POST error:", error);
    return NextResponse.json(
      { success: false, message: "خطأ في إنشاء الشيفت" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const shiftId = searchParams.get("id");

    if (!shiftId) {
      return NextResponse.json(
        { success: false, error: "Shift ID required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const response = await fetch(`${BACKEND_BASE}/${shiftId}/update/`, {
      method: "PUT",
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Shifts PUT error:", error);
    return NextResponse.json(
      { success: false, message: "خطأ في تحديث الشيفت" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const shiftId = searchParams.get("id");

    if (!shiftId) {
      return NextResponse.json(
        { success: false, error: "Shift ID required" },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_BASE}/${shiftId}/delete/`, {
      method: "DELETE",
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        Accept: "application/json",
      },
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Shifts DELETE error:", error);
    return NextResponse.json(
      { success: false, message: "خطأ في حذف الشيفت" },
      { status: 500 }
    );
  }
}
