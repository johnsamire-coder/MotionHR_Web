"""
Fix job-titles API route: use /manager/job-titles/{id}/ for update/delete
"""
from pathlib import Path

path = Path("src/app/api/job-titles/route.ts")
content = '''import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE = "https://jssolutions-eg.com/attendance/api/mobile/manager/job-titles";

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
        { success: false, message: `فشل تحميل المسميات (${response.status})` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("JobTitles GET error:", error);
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

    const response = await fetch(`${BACKEND_BASE}/`, {
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
    console.error("JobTitles POST error:", error);
    return NextResponse.json(
      { success: false, message: "خطأ في إنشاء المسمى" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });
    }

    const body = await request.json();

    const response = await fetch(`${BACKEND_BASE}/${id}/`, {
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
    console.error("JobTitles PUT error:", error);
    return NextResponse.json(
      { success: false, message: "خطأ في تحديث المسمى" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });
    }

    const response = await fetch(`${BACKEND_BASE}/${id}/`, {
      method: "DELETE",
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        Accept: "application/json",
      },
    });

    const data = await response.json().catch(() => ({ success: true }));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("JobTitles DELETE error:", error);
    return NextResponse.json(
      { success: false, message: "خطأ في حذف المسمى" },
      { status: 500 }
    );
  }
}
'''

path.write_text(content, encoding="utf-8")
print(f"[OK] API Route updated!")
print(f"     Size: {path.stat().st_size} bytes")
