import { NextResponse } from "next/server";

const BACKEND = "https://jssolutions-eg.com";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/offboarding/list/`, {
      headers: { Authorization: authHeader, "Accept-Language": "ar" },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Backend error" }, { status: res.status });
    }

    const raw = await res.json();
    const employees = Array.isArray(raw?.employees)
      ? raw.employees.map((emp: any) => ({
          id: emp.id,
          full_name: emp.full_name || emp.name || `#${emp.id}`,
          employee_code: emp.employee_code || "",
          termination_date: emp.termination_date || null,
          termination_reason: emp.termination_reason || "",
          department: emp.department || "",
          status: emp.status || "",
          status_label: emp.status_label || emp.status || "",
        }))
      : [];

    return NextResponse.json({
      employees,
      total: raw?.total ?? employees.length,
    });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
