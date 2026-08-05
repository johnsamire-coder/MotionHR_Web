import { NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "https://jssolutions-eg.com";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date().toISOString().split("T")[0];

    const [empRes, attRes, pendingRes, leavesRes] = await Promise.all([
      fetch(`${BACKEND}/attendance/api/mobile/manager/employees/?page_size=1`, {
        headers: { Authorization: authHeader, "Accept-Language": "ar" },
        cache: "no-store",
      }),
      fetch(`${BACKEND}/attendance/api/mobile/manager/attendance/?date=${today}`, {
        headers: { Authorization: authHeader, "Accept-Language": "ar" },
        cache: "no-store",
      }),
      fetch(`${BACKEND}/attendance/api/mobile/manager/pending/`, {
        headers: { Authorization: authHeader, "Accept-Language": "ar" },
        cache: "no-store",
      }),
      fetch(`${BACKEND}/attendance/api/mobile/manager/reports/leaves-enhanced/?year=${new Date().getFullYear()}&month=${new Date().getMonth() + 1}`, {
        headers: { Authorization: authHeader, "Accept-Language": "ar" },
        cache: "no-store",
      }),
    ]);

    const empData     = empRes.ok     ? await empRes.json()     : {};
    const attData     = attRes.ok     ? await attRes.json()     : {};
    const pendingData = pendingRes.ok ? await pendingRes.json() : {};
    const leavesData  = leavesRes.ok  ? await leavesRes.json()  : {};

    const records = attData?.records || attData?.attendance || [];

    const present_today = Array.isArray(records)
      ? records.filter((r: { status?: string; status_code?: string }) =>
          ["present", "late"].includes(r.status || r.status_code || "")
        ).length
      : 0;

    const on_leave = Array.isArray(records)
      ? records.filter((r: { status?: string; status_code?: string }) =>
          ["on_leave"].includes(r.status || r.status_code || "")
        ).length
      : (leavesData?.summary?.total_on_leave ?? 0);

    const pending_requests =
      (pendingData?.total_pending) ??
      (
        ((pendingData?.pending_requests as unknown[])?.length ?? 0) +
        ((pendingData?.pending_leaves as unknown[])?.length ?? 0) +
        ((pendingData?.pending as unknown[])?.length ?? 0)
      );

    return NextResponse.json({
      total_employees:  empData?.count ?? empData?.total ?? 0,
      present_today,
      on_leave,
      pending_requests,
    });

  } catch {
    return NextResponse.json({
      total_employees:  0,
      present_today:    0,
      on_leave:         0,
      pending_requests: 0,
    });
  }
}