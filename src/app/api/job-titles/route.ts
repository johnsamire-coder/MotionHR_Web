import { NextRequest, NextResponse } from "next/server";

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
      return NextResponse.json(
        { success: false, error: "ID required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // جرب الـ endpoints المحتملة
    const endpoints = [
      `${BACKEND_BASE}/${id}/update/`,
      `${BACKEND_BASE}/${id}/`,
    ];

    let lastError = null;
    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          method: "PUT",
          headers: {
            ...(authHeader ? { Authorization: authHeader } : {}),
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(body),
        });

        if (response.ok || response.status === 400) {
          const data = await response.json();
          return NextResponse.json(data, { status: response.status });
        }
        lastError = { status: response.status };
      } catch (e) {
        lastError = e;
      }
    }

    return NextResponse.json(
      { success: false, message: "لا يمكن تحديث المسمى", details: lastError },
      { status: 500 }
    );
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
      return NextResponse.json(
        { success: false, error: "ID required" },
        { status: 400 }
      );
    }

    // جرب الـ endpoints المحتملة
    const endpoints = [
      `${BACKEND_BASE}/${id}/delete/`,
      `${BACKEND_BASE}/${id}/`,
    ];

    let lastError = null;
    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          method: "DELETE",
          headers: {
            ...(authHeader ? { Authorization: authHeader } : {}),
            Accept: "application/json",
          },
        });

        if (response.ok || response.status === 400 || response.status === 204) {
          const data = await response.json().catch(() => ({ success: true }));
          return NextResponse.json(data, { status: response.status === 204 ? 200 : response.status });
        }
        lastError = { status: response.status };
      } catch (e) {
        lastError = e;
      }
    }

    return NextResponse.json(
      { success: false, message: "لا يمكن حذف المسمى", details: lastError },
      { status: 500 }
    );
  } catch (error) {
    console.error("JobTitles DELETE error:", error);
    return NextResponse.json(
      { success: false, message: "خطأ في حذف المسمى" },
      { status: 500 }
    );
  }
}
