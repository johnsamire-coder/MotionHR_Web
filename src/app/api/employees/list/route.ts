import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const url = new URL(request.url);
    const queryString = url.search;

    const response = await fetch(
      `https://jssolutions-eg.com/attendance/api/mobile/manager/employees/${queryString}`,
      {
        method: "GET",
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { success: false, message: `فشل تحميل الموظفين (${response.status})` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // normalize: backend returns 'employees', page expects 'results'
    return NextResponse.json({
      count:   data.count   ?? data.total   ?? (data.employees?.length ?? 0),
      results: data.results ?? data.employees ?? [],
      stats:   data.stats   ?? {
        total:    data.count ?? 0,
        active:   data.active_count   ?? 0,
        inactive: data.inactive_count ?? 0,
        on_leave: data.on_leave_count ?? 0,
      },
      next:     data.next     ?? null,
      previous: data.previous ?? null,
    });
  } catch (error) {
    console.error("Employees list error:", error);
    return NextResponse.json(
      { success: false, message: "خطأ في الاتصال بالسيرفر" },
      { status: 500 }
    );
  }
}